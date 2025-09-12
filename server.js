const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
if (process.env.NODE_ENV === 'production') {
  app.use((req,res,next)=>{res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload'); next();});
}
app.use(compression());

// Canonical
const CANONICAL = process.env.CANONICAL_HOST;
app.use((req,res,next)=>{
  if (CANONICAL && req.headers.host && req.headers.host !== CANONICAL) {
    return res.redirect(301, `https://${CANONICAL}${req.originalUrl}`);
  }
  next();
});

// DB
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'ordeminds.db');
const db = new sqlite3.Database(DB_FILE);
db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email_verified INTEGER DEFAULT 0,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS email_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  // In case db existed without columns
  db.run(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0`, ()=>{});
  db.run(`ALTER TABLE users ADD COLUMN verified_at DATETIME`, ()=>{});
});

// Sessions & body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'CHANGE-ME-SECRET',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

// SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '25', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${port}`;
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@ordeminds.local';

// Static
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '7d', immutable: true }));
app.use('/', express.static(path.join(__dirname, 'public')));

// Helpers
const limiterAuth = rateLimit({ windowMs: 60_000, max: 20 });
const limiterForgot = rateLimit({ windowMs: 60_000, max: 6 });
const limiterVerify = rateLimit({ windowMs: 60_000, max: 6 });

function sendVerifyCode(userId, email, cb) {
  const code = Math.floor(100000 + Math.random()*900000).toString(); // 6 digits
  const expiresAt = new Date(Date.now() + 30*60*1000).toISOString();
  db.run('INSERT INTO email_verifications (user_id, code, expires_at) VALUES (?, ?, ?)', [userId, code, expiresAt], async function() {
    try {
      await transporter.sendMail({
        from: MAIL_FROM, to: email,
        subject: 'Ordeminds — Código de verificação',
        text: `Seu código é ${code}. Ele expira em 30 minutos.`,
        html: `<p>Seu código de verificação:</p>
               <p style="font-size:28px;letter-spacing:6px;font-weight:800">${code}</p>
               <p>Expira em 30 minutos.</p>`
      });
    } catch(e) { console.error('verify email send error:', e.message); }
    if (cb) cb();
  });
}

function requireAuth(req,res,next){ if(!req.session.user) return res.redirect('/login'); next(); }

// Routes
app.get('/api/health', (req,res)=>res.json({status:'ok'}));
app.get('/api/me', (req,res)=>res.json({user:req.session.user || null}));

// Signup: create user, send code, redirect to verify
app.post('/signup', limiterAuth, (req,res)=>{
  const {name,email,password,confirm} = req.body||{};
  if(!name||!email||!password||password!==confirm) return res.status(400).send('Dados inválidos');
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  stmt.run(name.trim(), email.trim().toLowerCase(), hash, function(err){
    if(err) return res.status(400).send(err.message.includes('UNIQUE')?'E-mail já cadastrado':'Erro ao cadastrar');
    const user = { id: this.lastID, name, email: email.trim().toLowerCase(), email_verified: 0 };
    req.session.user = user;
    sendVerifyCode(user.id, user.email, ()=>{
      res.redirect(`/verify?email=${encodeURIComponent(user.email)}&sent=1`);
    });
  });
});

// Login: if not verified -> redirect to verify
app.post('/login', limiterAuth, (req,res)=>{
  const {email,password} = req.body||{};
  if(!email||!password) return res.status(400).send('Informe e-mail e senha');
  db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], (err, row)=>{
    if(err || !row) return res.status(400).send('Credenciais inválidas');
    const ok = bcrypt.compareSync(password, row.password_hash);
    if(!ok) return res.status(400).send('Credenciais inválidas');
    req.session.user = { id: row.id, name: row.name, email: row.email, email_verified: row.email_verified };
    if(!row.email_verified) return res.redirect(`/verify?email=${encodeURIComponent(row.email)}&err=${encodeURIComponent('Confirme seu e-mail para continuar.')}`);
    res.redirect('/app');
  });
});

app.post('/logout', (req,res)=> req.session.destroy(()=> res.redirect('/')));

// Resend verify code
app.get('/resend', limiterVerify, (req,res)=>{
  const email = (req.query.email||'').toLowerCase().trim();
  if(!email) return res.redirect('/verify?err='+encodeURIComponent('Informe o e-mail.'));
  db.get('SELECT id, email_verified FROM users WHERE email = ?', [email], (err,row)=>{
    if(err||!row) return res.redirect('/verify?err='+encodeURIComponent('E-mail não encontrado.'));
    if(row.email_verified) return res.redirect('/login');
    sendVerifyCode(row.id, email, ()=> res.redirect(`/verify?email=${encodeURIComponent(email)}&sent=1`));
  });
});

// Verify code
app.post('/verify', limiterVerify, (req,res)=>{
  const email = (req.body.email||'').toLowerCase().trim();
  const code = (req.body.code||'').trim();
  if(!email||!code) return res.redirect('/verify?err='+encodeURIComponent('Dados inválidos.'));
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, u)=>{
    if(err||!u) return res.redirect('/verify?err='+encodeURIComponent('E-mail não encontrado.'));
    db.get('SELECT * FROM email_verifications WHERE user_id = ? AND code = ? ORDER BY id DESC LIMIT 1', [u.id, code], (e, row)=>{
      if(e||!row) return res.redirect('/verify?email='+encodeURIComponent(email)+'&err='+encodeURIComponent('Código inválido.'));
      if(row.used) return res.redirect('/verify?email='+encodeURIComponent(email)+'&err='+encodeURIComponent('Código já utilizado.'));
      if(new Date(row.expires_at) < new Date()) return res.redirect('/verify?email='+encodeURIComponent(email)+'&err='+encodeURIComponent('Código expirado.'));
      db.run('UPDATE users SET email_verified = 1, verified_at = CURRENT_TIMESTAMP WHERE id = ?', [u.id], (e1)=>{
        db.run('UPDATE email_verifications SET used = 1 WHERE id = ?', [row.id], ()=>{});
        if(req.session.user) req.session.user.email_verified = 1;
        res.redirect('/app');
      });
    });
  });
});

// Forgot/reset (unchanged core)
app.post('/forgot', limiterForgot, (req,res)=>{
  const {email} = req.body||{}; if(!email) return res.redirect('/forgot');
  db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()], async (err, row)=>{
    const generic = ()=> res.redirect('/forgot');
    if(err||!row) return generic();
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30*60*1000).toISOString();
    db.run('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [row.id, hash, expiresAt], async ()=>{
      const resetUrl = `${APP_BASE_URL}/reset?token=${token}&email=${encodeURIComponent(email.trim().toLowerCase())}`;
      try { await transporter.sendMail({ from: MAIL_FROM, to: email.trim().toLowerCase(),
        subject: 'Ordeminds — Redefinição de senha', text: `Acesse: ${resetUrl}`,
        html: `<p>Para redefinir sua senha, clique: <a href="${resetUrl}">Redefinir</a></p>`}); } catch(e){}
      generic();
    });
  });
});

app.post('/reset', limiterForgot, (req,res)=>{
  const { token, email, password, confirm } = req.body||{};
  if(!token||!email||!password||password!==confirm) return res.status(400).send('Dados inválidos');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  db.get(`SELECT pr.id, pr.user_id, pr.expires_at, pr.used
          FROM password_resets pr JOIN users u ON u.id = pr.user_id AND u.email = ?
          WHERE pr.token_hash = ? ORDER BY pr.id DESC LIMIT 1`,
    [email.trim().toLowerCase(), hash], (err, row)=>{
      if(err||!row) return res.status(400).send('Token inválido');
      if(row.used) return res.status(400).send('Token já utilizado');
      if(new Date(row.expires_at) < new Date()) return res.status(400).send('Token expirado');
      const newHash = bcrypt.hashSync(password, 10);
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, row.user_id], (e1)=>{
        if(e1) return res.status(500).send('Erro ao atualizar senha');
        db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [row.id], ()=> res.redirect('/login'));
      });
    });
});

// Tasks
app.get('/api/tasks', requireAuth, (req,res)=>{
  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [req.session.user.id], (err, rows)=>{
    if(err) return res.status(500).json({error:'db_error'});
    res.json(rows);
  });
});
app.post('/api/tasks', requireAuth, (req,res)=>{
  const {title} = req.body||{}; if(!title) return res.status(400).json({error:'title_required'});
  const stmt = db.prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)');
  stmt.run(req.session.user.id, title.trim(), function(err){
    if(err) return res.status(500).json({error:'db_error'});
    res.status(201).json({id:this.lastID, title:title.trim(), completed:0});
  });
});
app.patch('/api/tasks/:id', requireAuth, (req,res)=>{
  const id = parseInt(req.params.id,10);
  const completed = req.body&&req.body.completed ? 1 : 0;
  if(Number.isNaN(id)) return res.status(400).json({error:'invalid_id'});
  db.run('UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?', [completed, id, req.session.user.id], function(err){
    if(err) return res.status(500).json({error:'db_error'});
    res.json({updated:this.changes});
  });
});
app.delete('/api/tasks/:id', requireAuth, (req,res)=>{
  const id = parseInt(req.params.id,10);
  if(Number.isNaN(id)) return res.status(400).json({error:'invalid_id'});
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.session.user.id], function(err){
    if(err) return res.status(500).json({error:'db_error'});
    res.json({deleted:this.changes});
  });
});

app.listen(port, ()=> console.log('Ordeminds v2.3 on :' + port));
