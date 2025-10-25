const db = require("../config/database");

exports.getAddressesByUser = (req, res) => {
  const { userId } = req.params;
  db.all("SELECT * FROM Address WHERE UserID = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.addAddress = (req, res) => {
  const { UserID, Place_Name, Street, City, Province, PostalCode, Phone } =
    req.body;

  db.run(
    `INSERT INTO Address 
     (UserID, Place_Name, Street, City, Province, PostalCode, Phone) 
     VALUES (?,?,?,?,?,?,?)`,
    [UserID, Place_Name, Street, City, Province, PostalCode, Phone],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ AddressID: this.lastID });
    }
  );
};
