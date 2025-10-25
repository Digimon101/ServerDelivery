const db = require("../config/database");

exports.addOrderDetail = (req, res) => {
  const { OrderID, FoodID, Quantity, Price } = req.body;

  db.run(
    `INSERT INTO Order_Detail (OrderID, FoodID, Quantity, Price) VALUES (?,?,?,?)`,
    [OrderID, FoodID, Quantity, Price],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ DetailID: this.lastID });
    }
  );
};

exports.getOrderDetails = (req, res) => {
  const { orderId } = req.params;
  db.all(
    "SELECT * FROM Order_Detail WHERE OrderID = ?",
    [orderId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};
