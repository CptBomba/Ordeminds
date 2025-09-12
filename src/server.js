
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

const CANONICAL = process.env.CANONICAL_HOST;
app.use((req,res,next)=>{
  if (CANONICAL && req.headers.host && req.headers.host !== CANONICAL) {
    return res.redirect(301, `https://${CANONICAL}${req.originalUrl}`);
  }
  next();
});

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const UPLOADS = path.join(DATA_DIR, 'uploads'); if(!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, {recursive:true});
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'ordeminds.db');
const db = new sqlite3.Database(DB_FILE);
db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,email_verified INTEGER DEFAULT 0,address TEXT,verified_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,completed INTEGER DEFAULT 0,due_at DATETIME,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,start_at DATETIME NOT NULL,end_at DATETIME,location TEXT,reminder_min INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS shopping_items (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,qty TEXT,done INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS bills (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,title TEXT NOT NULL,amount REAL NOT NULL,due_date DATE NOT NULL,paid INTEGER DEFAULT 0,category TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS email_verifications (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,code TEXT NOT NULL,expires_at DATETIME NOT NULL,used INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT NOT NULL,expires_at DATETIME NOT NULL,used INTEGER DEFAULT 0,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id))`);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '6mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'CHANGE-ME',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '25', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${port}`;
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@ordeminds.local';

app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets'), { maxAge: '7d', immutable: true }));

function sendPage(res, name){ return res.sendFile(path.join(__dirname, '..', 'public', name)); }
app.get('/', (req,res)=>sendPage(res,'index.html'));
app.get('/login', (req,res)=>sendPage(res,'login.html'));
app.get('/signup', (req,res)=>sendPage(res,'signup.html'));
app.get('/verify', (req,res)=>sendPage(res,'verify.html'));
app.get('/forgot', (req,res)=>sendPage(res,'forgot.html'));
app.get('/reset', (req,res)=>sendPage(res,'reset.html'));
app.get('/app', (req,res)=>{ if(!req.session.user) return res.redirect('/login'); return sendPage(res,'app.html'); });
app.get('/agenda',(req,res)=>{ if(!req.session.user) return res.redirect('/login'); return sendPage(res,'agenda.html'); });
app.get('/tasks',(req,res)=>{ if(!req.session.user) return res.redirect('/login'); return sendPage(res,'tasks.html'); });
app.get('/shopping',(req,res)=>{ if(!req.session.user) return res.redirect('/login'); return sendPage(res,'shopping.html'); });
app.get('/bills',(req,res)=>{ if(!req.session.user) return res.redirect('/login'); return sendPage(res,'bills.html'); });
app.get('/reports',(req,res)=>{ if(!req.session.user) return res.redirect('/login'); return sendPage(res,'reports.html'); });
app.get('/profile',(req,res)=>{ if(!req.session.user) return res.redirect('/login'); return sendPage(res,'profile.html'); });

const limiterAuth = rateLimit({ windowMs: 60_000, max: 20 });
const limiterShort = rateLimit({ windowMs: 60_000, max: 30 });

function sendVerifyCode(userId, email, cb){
  const code = Math.floor(100000 + Math.random()*900000).toString();
  const expiresAt = new Date(Date.now() + 30*60*1000).toISOString();
  db.run('INSERT INTO email_verifications (user_id, code, expires_at) VALUES (?, ?, ?)', [userId, code, expiresAt], async function(){
    try {
      await transporter.sendMail({
        from: MAIL_FROM, to: email,
        subject: 'Ordeminds — Código de verificação',
        text: `Seu código é ${code}. Expira em 30 minutos.`,
        html: `<h2>${code}</h2><p>Expira em 30 minutos.</p>`
      });
    } catch(e){ console.error('mail', e.message); }
    if(cb) cb();
  });
}

app.get('/api/me', (req,res)=>res.json({user:req.session.user||null}));

app.post('/signup', limiterAuth, (req,res)=>{
  const {name,email,password,confirm} = req.body||{};
  if(!name||!email||!password||password!==confirm) return res.status(400).send('Dados inválidos');
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  stmt.run(name.trim(), email.trim().toLowerCase(), hash, function(err){
    if(err) return res.status(400).send(err.message.includes('UNIQUE')?'E-mail já cadastrado':'Erro ao cadastrar');
    const user = { id: this.lastID, name, email: email.trim().toLowerCase(), email_verified: 0 };
    req.session.user = user;
    sendVerifyCode(user.id, user.email, ()=> res.redirect(`/verify?email=${encodeURIComponent(user.email)}&sent=1`));
  });
});

app.post('/login', limiterAuth, (req,res)=>{
  const {email,password} = req.body||{};
  if(!email||!password) return res.status(400).send('Informe e-mail e senha');
  db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], (err, row)=>{
    if(err || !row) return res.status(400).send('Credenciais inválidas');
    const ok = bcrypt.compareSync(password, row.password_hash);
    if(!ok) return res.status(400).send('Credenciais inválidas');
    req.session.user = { id: row.id, name: row.name, email: row.email, address: row.address, email_verified: row.email_verified };
    if(!row.email_verified) return res.redirect(`/verify?email=${encodeURIComponent(row.email)}&err=${encodeURIComponent('Confirme seu e-mail para continuar.')}`);
    res.redirect('/app');
  });
});
app.post('/logout',(req,res)=> req.session.destroy(()=> res.redirect('/')));

app.get('/resend', limiterShort, (req,res)=>{
  const email=(req.query.email||'').toLowerCase().trim();
  if(!email) return res.redirect('/verify?err='+encodeURIComponent('Informe o e-mail.'));
  db.get('SELECT id, email_verified FROM users WHERE email = ?', [email], (err,row)=>{
    if(err||!row) return res.redirect('/verify?err='+encodeURIComponent('E-mail não encontrado.'));
    if(row.email_verified) return res.redirect('/login');
    sendVerifyCode(row.id, email, ()=> res.redirect(`/verify?email=${encodeURIComponent(email)}&sent=1`));
  });
});
app.post('/verify', limiterShort, (req,res)=>{
  const email=(req.body.email||'').toLowerCase().trim();
  const code=(req.body.code||'').trim();
  if(!email||!code) return res.redirect('/verify?err='+encodeURIComponent('Dados inválidos.'));
  db.get('SELECT id FROM users WHERE email = ?', [email], (err,u)=>{
    if(err||!u) return res.redirect('/verify?err='+encodeURIComponent('E-mail não encontrado.'));
    db.get('SELECT * FROM email_verifications WHERE user_id = ? AND code = ? ORDER BY id DESC LIMIT 1', [u.id, code], (e, row)=>{
      if(e||!row) return res.redirect('/verify?email='+encodeURIComponent(email)+'&err='+encodeURIComponent('Código inválido.'));
      if(row.used) return res.redirect('/verify?email='+encodeURIComponent(email)+'&err='+encodeURIComponent('Código já utilizado.'));
      if(new Date(row.expires_at) < new Date()) return res.redirect('/verify?email='+encodeURIComponent(email)+'&err='+encodeURIComponent('Código expirado.'));
      db.run('UPDATE users SET email_verified = 1, verified_at = CURRENT_TIMESTAMP WHERE id = ?', [u.id], (e1)=>{
        db.run('UPDATE email_verifications SET used = 1 WHERE id = ?', [row.id], ()=>{});
        db.get('SELECT id,name,email,address,email_verified FROM users WHERE id=?',[u.id],(e2,user)=>{ req.session.user=user; res.redirect('/app'); });
      });
    });
  });
});

app.post('/forgot', limiterShort, (req,res)=>{
  const {email}=req.body||{}; if(!email) return res.redirect('/forgot');
  db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()], (err,row)=>{
    const back=()=>res.redirect('/forgot');
    if(err||!row) return back();
    const token=crypto.randomBytes(32).toString('hex');
    const hash=crypto.createHash('sha256').update(token).digest('hex');
    const exp=new Date(Date.now()+30*60*1000).toISOString();
    db.run('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [row.id, hash, exp], async ()=>{
      const url=`${APP_BASE_URL}/reset?token=${token}&email=${encodeURIComponent(email.trim().toLowerCase())}`;
      try{ await transporter.sendMail({from:MAIL_FROM,to:email,subject:'Redefinição de senha',text:url,html:`<a href="${url}">Redefinir senha</a>`}); }catch(e){}
      back();
    });
  });
});
app.post('/reset', limiterShort, (req,res)=>{
  const {token,email,password,confirm}=req.body||{};
  if(!token||!email||!password||password!==confirm) return res.status(400).send('Dados inválidos');
  const hash=crypto.createHash('sha256').update(token).digest('hex');
  db.get(`SELECT pr.id, pr.user_id, pr.expires_at, pr.used FROM password_resets pr JOIN users u ON u.id=pr.user_id AND u.email=? WHERE pr.token_hash=? ORDER BY pr.id DESC LIMIT 1`, [email.trim().toLowerCase(), hash], (err,row)=>{
    if(err||!row) return res.status(400).send('Token inválido');
    if(row.used) return res.status(400).send('Token já utilizado');
    if(new Date(row.expires_at) < new Date()) return res.status(400).send('Token expirado');
    const newHash=bcrypt.hashSync(password,10);
    db.run('UPDATE users SET password_hash=? WHERE id=?',[newHash,row.user_id],()=>{
      db.run('UPDATE password_resets SET used=1 WHERE id=?',[row.id],()=> res.redirect('/login'));
    });
  });
});

// Profile update + avatar
app.patch('/api/user', (req,res,next)=>{ if(!req.session.user) return res.status(401).json({error:'auth'}); next(); }, (req,res)=>{
  const {name,address,password,confirm,avatar} = req.body||{};
  const updates = []; const params=[];
  if(name!=null){ updates.push('name=?'); params.push(String(name).trim()); req.session.user.name = String(name).trim(); }
  if(address!=null){ updates.push('address=?'); params.push(String(address).trim()); req.session.user.address = String(address).trim(); }
  if(password){ if(password!==confirm) return res.status(400).json({error:'confirm'}); const hash=bcrypt.hashSync(password,10); updates.push('password_hash=?'); params.push(hash); }
  if(updates.length>0) db.run(`UPDATE users SET ${updates.join(', ')} WHERE id=?`, [...params, req.session.user.id], ()=>{});
  if(avatar && avatar.startsWith('data:image/')){
    const base64 = avatar.split(',')[1]; const buf = Buffer.from(base64, 'base64');
    const file = path.join(UPLOADS, `avatar-${req.session.user.id}.png`);
    fs.writeFileSync(file, buf);
  }
  res.json({ok:true});
});
app.get('/api/user/avatar', (req,res,next)=>{ if(!req.session.user) return res.status(401).end(); next(); }, (req,res)=>{
  const file = path.join(UPLOADS, `avatar-${req.session.user.id}.png`);
  if(fs.existsSync(file)) return res.sendFile(file);
  res.status(404).end();
});

// DATA APIs
function requireAuth(req,res,next){ if(!req.session.user) return res.status(401).json({error:'auth'}); next(); }
app.get('/api/tasks', requireAuth, (req,res)=>{ db.all('SELECT * FROM tasks WHERE user_id=? ORDER BY id DESC',[req.session.user.id],(e,rows)=> res.json(rows||[])); });
app.post('/api/tasks', requireAuth, (req,res)=>{ const {title}=req.body||{}; if(!title) return res.status(400).json({error:'title'}); db.run('INSERT INTO tasks (user_id,title) VALUES (?,?)',[req.session.user.id,title.trim()],function(e){ if(e) return res.status(500).json({error:'db'}); res.status(201).json({id:this.lastID,title:title.trim(),completed:0}); }); });
app.patch('/api/tasks/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); const completed=req.body&&req.body.completed?1:0; db.run('UPDATE tasks SET completed=? WHERE id=? AND user_id=?',[completed,id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({updated:this.changes}); }); });
app.delete('/api/tasks/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); db.run('DELETE FROM tasks WHERE id=? AND user_id=?',[id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({deleted:this.changes}); }); });

app.get('/api/events', requireAuth, (req,res)=>{ const {from,to}=req.query; let sql='SELECT * FROM events WHERE user_id=?'; const params=[req.session.user.id]; if(from){ sql+=' AND start_at>=?'; params.push(from); } if(to){ sql+=' AND start_at<=?'; params.push(to); } sql+=' ORDER BY start_at ASC'; db.all(sql, params, (e,rows)=> res.json(rows||[])); });
app.post('/api/events', requireAuth, (req,res)=>{ const {title,start_at,end_at,location,reminder_min}=req.body||{}; if(!title||!start_at) return res.status(400).json({error:'data'}); db.run('INSERT INTO events (user_id,title,start_at,end_at,location,reminder_min) VALUES (?,?,?,?,?,?)',[req.session.user.id,title.trim(),start_at,end_at||null,location||null,parseInt(reminder_min||0,10)],function(e){ if(e) return res.status(500).json({error:'db'}); res.status(201).json({id:this.lastID}); }); });
app.patch('/api/events/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); const {title,start_at,end_at,location,reminder_min}=req.body||{}; db.run('UPDATE events SET title=?, start_at=?, end_at=?, location=?, reminder_min=? WHERE id=? AND user_id=?',[title,start_at,end_at,location,parseInt(reminder_min||0,10),id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({updated:this.changes}); }); });
app.delete('/api/events/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); db.run('DELETE FROM events WHERE id=? AND user_id=?',[id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({deleted:this.changes}); }); });

app.get('/api/shopping', requireAuth, (req,res)=>{ db.all('SELECT * FROM shopping_items WHERE user_id=? ORDER BY id DESC',[req.session.user.id],(e,rows)=> res.json(rows||[])); });
app.post('/api/shopping', requireAuth, (req,res)=>{ const {title,qty}=req.body||{}; if(!title) return res.status(400).json({error:'title'}); db.run('INSERT INTO shopping_items (user_id,title,qty) VALUES (?,?,?)',[req.session.user.id,title.trim(),qty||null],function(e){ if(e) return res.status(500).json({error:'db'}); res.status(201).json({id:this.lastID}); }); });
app.patch('/api/shopping/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); const done=req.body&&req.body.done?1:0; db.run('UPDATE shopping_items SET done=? WHERE id=? AND user_id=?',[done,id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({updated:this.changes}); }); });
app.delete('/api/shopping/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); db.run('DELETE FROM shopping_items WHERE id=? AND user_id=?',[id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({deleted:this.changes}); }); });

app.get('/api/bills', requireAuth, (req,res)=>{ db.all('SELECT * FROM bills WHERE user_id=? ORDER BY due_date ASC',[req.session.user.id],(e,rows)=> res.json(rows||[])); });
app.post('/api/bills', requireAuth, (req,res)=>{ const {title,amount,due_date,category}=req.body||{}; if(!title||!amount||!due_date) return res.status(400).json({error:'data'}); db.run('INSERT INTO bills (user_id,title,amount,due_date,category) VALUES (?,?,?,?,?)',[req.session.user.id,title.trim(),amount,due_date,category||null],function(e){ if(e) return res.status(500).json({error:'db'}); res.status(201).json({id:this.lastID}); }); });
app.patch('/api/bills/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); const paid=req.body&&req.body.paid?1:0; db.run('UPDATE bills SET paid=? WHERE id=? AND user_id=?',[paid,id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({updated:this.changes}); }); });
app.delete('/api/bills/:id', requireAuth, (req,res)=>{ const id=parseInt(req.params.id,10); db.run('DELETE FROM bills WHERE id=? AND user_id=?',[id,req.session.user.id],function(e){ if(e) return res.status(500).json({error:'db'}); res.json({deleted:this.changes}); }); });

app.get('/api/expenses/summary', requireAuth, (req,res)=>{
  const year=parseInt(req.query.year||new Date().getFullYear(),10);
  const start=`${year}-01-01`; const end=`${year}-12-31`;
  db.all(`SELECT strftime('%m', due_date) AS m, SUM(amount) AS total FROM bills 
          WHERE user_id=? AND due_date BETWEEN ? AND ? GROUP BY m`, [req.session.user.id, start, end], (e,rows)=>{
    const map = new Map(); (rows||[]).forEach(r=> map.set(parseInt(r.m,10), r.total||0));
    const out = Array.from({length:12}, (_,i)=> ({ month:i+1, total: +(map.get(i+1)||0) }));
    res.json(out);
  });
});

app.get('/api/alerts', requireAuth, (req,res)=>{
  const now = new Date();
  const next24 = new Date(now.getTime()+24*60*60*1000).toISOString();
  const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
  const soonBills = new Date(now.getTime()+3*24*60*60*1000).toISOString().slice(0,10);
  const items = [];
  db.all('SELECT title,start_at FROM events WHERE user_id=? AND start_at BETWEEN ? AND ? ORDER BY start_at ASC',[req.session.user.id, now.toISOString(), next24], (e,evs)=>{
    (evs||[]).forEach(ev=> items.push({type:'event', text:`Hoje/amanhã: ${ev.title} (${new Date(ev.start_at).toLocaleString()})`}));
    db.all('SELECT title FROM tasks WHERE user_id=? AND due_at <= ? AND completed=0',[req.session.user.id, todayEnd.toISOString()], (e2,ts)=>{
      (ts||[]).forEach(t=> items.push({type:'task', text:`Tarefa para hoje: ${t.title}`}));
      db.all('SELECT title,due_date,amount FROM bills WHERE user_id=? AND paid=0 AND due_date <= ? ORDER BY due_date ASC',[req.session.user.id, soonBills], (e3,bs)=>{
        (bs||[]).forEach(b=> items.push({type:'bill', text:`Conta próxima: ${b.title} — R$${b.amount} (${b.due_date})`}));
        res.json({total:items.length, items});
      });
    });
  });
});

app.listen(port, ()=> console.log('Ordeminds v4 on :' + port));
