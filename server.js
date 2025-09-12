
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'ordeminds.db');

const db = new sqlite3.Database(DB_FILE);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
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
});

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'CHANGE-ME-SECRET',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '25', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${port}`;
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@ordeminds.local';

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => { if (filePath.endsWith('app.html')) res.status(404); }
}));

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'not_authenticated' });
  next();
}

app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/forgot', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forgot.html')));
app.get('/reset', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset.html')));
app.get('/app', (req, res) => { if (!req.session.user) return res.redirect('/login'); res.sendFile(path.join(__dirname, 'public', 'app.html')); });

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/me', (req, res) => res.json({ user: req.session.user || null }));

app.post('/signup', (req, res) => {
  const { name, email, password, confirm } = req.body || {};
  if (!name || !email || !password || password !== confirm) return res.status(400).send('Dados inválidos');
  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
  stmt.run(name.trim(), email.trim().toLowerCase(), hash, function(err) {
    if (err) return res.status(400).send(err.message.includes('UNIQUE') ? 'E-mail já cadastrado' : 'Erro ao cadastrar');
    req.session.user = { id: this.lastID, name, email: email.trim().toLowerCase() };
    res.redirect('/app');
  });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).send('Informe e-mail e senha');
  db.get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()], (err, row) => {
    if (err || !row) return res.status(400).send('Credenciais inválidas');
    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return res.status(400).send('Credenciais inválidas');
    req.session.user = { id: row.id, name: row.name, email: row.email };
    res.redirect('/app');
  });
});

app.post('/logout', (req, res) => { req.session.destroy(() => res.redirect('/')); });

app.post('/forgot', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(200).send('Se o e-mail existir, enviaremos instruções.');
  db.get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()], async (err, row) => {
    const generic = () => res.status(200).send('Se o e-mail existir, enviaremos instruções.');
    if (err || !row) return generic();
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    db.run('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [row.id, hash, expiresAt], async () => {
      const resetUrl = `${APP_BASE_URL}/reset?token=${token}&email=${encodeURIComponent(email.trim().toLowerCase())}`;
      try{
        await transporter.sendMail({
          from: MAIL_FROM,
          to: email.trim().toLowerCase(),
          subject: 'Ordeminds — Redefinição de senha',
          text: `Para redefinir sua senha, acesse: ${resetUrl} (válido por 30 minutos).`,
          html: `<p>Para redefinir sua senha, clique abaixo (válido por 30 minutos):</p><p><a href="${resetUrl}" style="background:#1AC6B2;color:#001;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Redefinir senha</a></p><p>Se você não solicitou, ignore.</p>`
        });
      }catch(e){ console.error('Email send error:', e.message); }
      generic();
    });
  });
});

app.post('/reset', (req, res) => {
  const { token, email, password, confirm } = req.body || {};
  if (!token || !email || !password || password !== confirm) return res.status(400).send('Dados inválidos');
  const hash = require('crypto').createHash('sha256').update(token).digest('hex');
  db.get(`SELECT pr.id, pr.user_id, pr.expires_at, pr.used
          FROM password_resets pr JOIN users u ON u.id = pr.user_id AND u.email = ?
          WHERE pr.token_hash = ? ORDER BY pr.id DESC LIMIT 1`, [email.trim().toLowerCase(), hash], (err, row) => {
    if (err || !row) return res.status(400).send('Token inválido');
    if (row.used) return res.status(400).send('Token já utilizado');
    if (new Date(row.expires_at) < new Date()) return res.status(400).send('Token expirado');
    const newHash = bcrypt.hashSync(password, 10);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, row.user_id], (e1) => {
      if (e1) return res.status(500).send('Erro ao atualizar senha');
      db.run('UPDATE password_resets SET used = 1 WHERE id = ?', [row.id], () => res.redirect('/login'));
    });
  });
});

app.get('/api/tasks', requireAuth, (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC', [req.session.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.json(rows);
  });
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title_required' });
  const stmt = db.prepare('INSERT INTO tasks (user_id, title) VALUES (?, ?)');
  stmt.run(req.session.user.id, title.trim(), function(err) {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.status(201).json({ id: this.lastID, title: title.trim(), completed: 0 });
  });
});

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const { completed } = req.body || {};
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid_id' });
  db.run('UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?', [completed ? 1 : 0, id, req.session.user.id], function(err) {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid_id' });
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.session.user.id], function(err) {
    if (err) return res.status(500).json({ error: 'db_error' });
    res.json({ deleted: this.changes });
  });
});

app.listen(port, () => console.log(`Ordeminds running on :${port}`));
