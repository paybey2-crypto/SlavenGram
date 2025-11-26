// Dohvati kartice korisnika
app.get('/api/cards', ensureAuth, (req, res) => {
  const user = users.find(u => u.username === req.session.user.username);
  res.json(user.cards || []);
});

// Kreiraj novu karticu (max 3)
app.post('/api/cards', ensureAuth, (req, res) => {
  const user = users.find(u => u.username === req.session.user.username);
  if (!user.cards) user.cards = [];
  if (user.cards.length >= 3) return res.status(400).json({ error: 'Max 3 cards allowed' });

  // Generiraj random broj kartice
  const cardNumber = `${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}-${Math.floor(1000+Math.random()*9000)}`;
  const card = { cardNumber, balance: 0 };
  user.cards.push(card);

  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.json({ success: true, card });
});
