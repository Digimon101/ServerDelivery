const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./Data.db", (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

module.exports = db;
