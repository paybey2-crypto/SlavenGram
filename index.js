require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const helmet = require('helmet');
const fs = require('fs');

const app = express();
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Simple session store
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true if HTTPS
}));

// Load users from JSON
let users = [];
try {
  users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
} catch (err) {
  console.error('Error loading users.json:', err);
}

function ensureAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  return res.redirect('/?next=' + encodeURIComponent(req.originalUrl));
}

// Serve static files (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const next = req.query.next || '/dashboard.html';
  if (!username || !password) {
    return res.status(400).send('Missing username or password. <a href="/">Back</a>');
  }

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.authenticated = true;
    req.session.user = { username: user.username };
    return res.redirect(next);
  }

  return res.status(401).send('Invalid credentials. <a href="/">Back</a>');
});

// API to get current user
app.get('/api/me', ensureAuth, (req, res) => {
  res.json({ username: req.session.user.username });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Transfer app listening on port ${PORT}`);
});
