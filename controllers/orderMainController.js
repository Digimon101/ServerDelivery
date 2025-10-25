const db = require("../config/database");

function createOrder(req, res) {
  const { UserID, RiderID, TotalAmount, PaymentMethod } = req.body;

  db.run(
    `INSERT INTO Order_Main (UserID, RiderID, TotalAmount, PaymentMethod) 
     VALUES (?,?,?,?)`,
    [UserID, RiderID || null, TotalAmount, PaymentMethod],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ OrderID: this.lastID });
    }
  );
}

function getOrders(req, res) {
  db.all("SELECT * FROM Order_Main", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

module.exports = { createOrder, getOrders };