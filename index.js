// CREATE VIRTUAL CARD
app.post('/api/create-card', ensureAuth, (req, res) => {
  const username = req.session.user.username;

  const userCards = cards.filter(c => c.username === username);
  if (userCards.length >= 3) {
    return res.json({ error: "You already have 3 cards" });
  }

  const card = {
    id: Date.now(),
    username,
    cardNumber: 4000 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)},
    cvv: ${Math.floor(100 + Math.random() * 900)},
    expiry: 0${Math.floor(1 + Math.random() * 8)}/${25 + Math.floor(Math.random() * 5)},
    created: new Date()
  };

  cards.push(card);
  fs.writeFileSync('cards.json', JSON.stringify(cards, null, 2));

  res.json({ success: true, card });
});
