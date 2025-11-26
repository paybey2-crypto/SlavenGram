app.post('/api/transfer', ensureAuth, (req,res)=>{
  const fromUser = users.find(u=>u.username===req.session.user.username);
  const {toUsername, iban, amount, reason} = req.body;

  if(!amount || !reason) return res.json({success:false,error:'Missing fields'});
  if((fromUser.balance||0)<amount) return res.json({success:false,error:'Insufficient balance'});

  if(toUsername){ 
    // Slanje korisniku
    const toUser = users.find(u=>u.username===toUsername);
    if(!toUser) return res.json({success:false,error:'User not found'});
    toUser.balance = (toUser.balance||0) + amount;

    const txn = { from: fromUser.username, to: toUser.username, amount, reason, date: new Date().toISOString() };
    transactions.push(txn);
    saveTransactions();

  } else if(iban) {
    // Slanje na IBAN
    const txn = { from: fromUser.username, to: iban, amount, reason, date: new Date().toISOString() };
    transactions.push(txn);
    saveTransactions();

  } else {
    return res.json({success:false,error:'Provide username or IBAN'});
  }

  fromUser.balance -= amount;
  saveUsers();
  res.json({success:true});
});

