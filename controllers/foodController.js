const db = require("../config/database");

exports.getFoods = (req, res) => {
  db.all("SELECT * FROM Food_Item", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.addFood = (req, res) => {
  const { FoodName, Price, Description } = req.body;

  db.run(
    `INSERT INTO Food_Item (FoodName, Price, Description) VALUES (?,?,?)`,
    [FoodName, Price, Description],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ FoodID: this.lastID });
    }
  );
};
