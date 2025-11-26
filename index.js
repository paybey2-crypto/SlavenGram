const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// SESSION
app.use(session({
  secret: process.env.SESSION_SECRET || "secret123",
  resave: false,
  saveUninitialized: false
}));

// BODY PARSER
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// STATIC FILES (public/)
app.use(express.static(path.join(__dirname, "public")));


// ---------------- FILE LOADERS ----------------
function load(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let users = load("users.json");
let cards = load("cards.json");
let transactions = load("transactions.json");


// AUTO CREATE DEFAULT ADMIN
if (!users.find(u => u.username === "admin")) {
  users.push({
    username: "admin",
    password: "admin",
    balance: 10000,
    isAdmin: true
  });
  save("users.json", users);
}


// ---------------- MIDDLEWARE ----------------
function auth(req, res, next) {
  if (!req.session.user) return res.redirect("/");
  next();
}


// ---------------- LOGIN ROUTE ----------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.send("Invalid credentials. <a href='/'>Back</a>");

  req.session.user = {
    username: user.username,
    isAdmin: user.isAdmin || false
  };

  return res.redirect("/dashboard.html");
});


// ---------------- API: CURRENT USER ----------------
app.get("/api/me", auth, (req, res) => {
  const user = users.find(u => u.username === req.session.user.username);
  res.json({
    username: user.username,
    balance: user.balance,
    isAdmin: user.isAdmin || false
  });
});


// ---------------- API: ADMIN USERS ----------------
app.get("/api/users", auth, (req, res) => {
  const me = users.find(u => u.username === req.session.user.username);
  if (!me.isAdmin) return res.status(403).json({ error: "Not admin." });

  res.json(users);
});


// ---------------- SEND MONEY ----------------
app.post("/api/transfer", auth, (req, res) => {
  const { toUsername, iban, amount, reason } = req.body;

  const from = users.find(u => u.username === req.session.user.username);
  const to = users.find(u => u.username === toUsername);

  if (!from) return res.json({ success: false, error: "Sender not found" });
  if (!to) return res.json({ success: false, error: "User not found" });

  if (from.balance < amount)
    return res.json({ success: false, error: "Not enough balance" });

  from.balance -= amount;
  to.balance += amount;

  transactions.push({
    from: from.username,
    to: to.username,
    amount,
    iban,
    reason,
    date: new Date().toISOString()
  });

  save("users.json", users);
  save("transactions.json", transactions);

  return res.json({ success: true });
});


// ---------------- TRANSACTIONS ----------------
app.get("/api/transactions", auth, (req, res) => {
  const me = req.session.user.username;

  const list = transactions.filter(t => t.to === me || t.from === me);
  res.json(list);
});


// ---------------- VIRTUAL CARDS ----------------
app.get("/api/cards", auth, (req, res) => {
  const me = req.session.user.username;
  const userCards = cards.filter(c => c.owner === me);
  res.json(userCards);
});

app.post("/api/cards", auth, (req, res) => {
  const me = req.session.user.username;
  const userCards = cards.filter(c => c.owner === me);

  if (userCards.length >= 3)
    return res.json({ success: false, error: "Max 3 cards allowed" });

  const newCard = {
    id: Date.now(),
    owner: me,
    cardNumber: "52" + Math.floor(Math.random() * 1000000000000),
    expiry: "12/27",
    cvv: Math.floor(100 + Math.random() * 899),
    balance: 0
  };

  cards.push(newCard);
  save("cards.json", cards);

  return res.json({ success: true, card: newCard });
});


// ---------------- LOGOUT ----------------
app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});


// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`TransferCash app running on ${PORT}`);
});

