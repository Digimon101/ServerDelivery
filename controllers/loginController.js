const db = require("../config/database");
const bcrypt = require("bcrypt");

async function login(req, res) {
  const { Email, Password } = req.body;
  if (!Email || !Password)
    return res.status(400).json({ error: "Email and Password required" });

  // ตรวจสอบ User ก่อน
  db.get("SELECT * FROM User WHERE Email = ?", [Email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (user) {
      const match = await bcrypt.compare(Password, user.Password);
      if (!match) return res.status(400).json({ error: "Incorrect password" });

      return res.json({
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        phone: user.Phone,
      });
    }

    // ตรวจสอบ Rider
    db.get("SELECT * FROM Rider WHERE Email = ?", [Email], async (err2, rider) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!rider) return res.status(400).json({ error: "Email not found" });

      const matchRider = await bcrypt.compare(Password, rider.RiderPassword);
      if (!matchRider) return res.status(400).json({ error: "Incorrect password" });

      return res.json({
        id: rider.RiderID,
        name: rider.RiderName,
        email: rider.Email,
        phone: rider.Phone,
      });
    });
  });
}

module.exports = { login };
