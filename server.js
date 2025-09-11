const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Ordeminds', uptime: process.uptime() });
});

app.post('/api/contact', (req, res) => {
  console.log('Contato:', req.body);
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`Ordeminds site listening on port ${port}`);
});
