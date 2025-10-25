const db = require("../config/database");
const bcrypt = require("bcrypt");

// Get all riders (Updated SELECT)
function getAllRiders(req, res) {
  console.log("\n--- GET ALL RIDERS: Endpoint Hit ---");
  // (แก้ไข!) เปลี่ยน RiderImagePath เป็น ProfilePictureRider
  db.all(
    "SELECT RiderID, RiderName, Email, Phone, VehicleImagePath, LicensePlate, ProfilePictureRider FROM Rider",
    [],
    (err, rows) => {
      if (err) {
        console.error("!!! GET RIDERS FAILED:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log("SUCCESS: Fetched all riders.");
      res.json(rows);
    }
  );
}

// Create rider (Corrected File Access)
async function createRider(req, res) {
  console.log("\n--- CREATE RIDER: Endpoint Hit ---");
  try {
    // 1. ดึง LicensePlate จาก req.body
    const { RiderName, Email, RiderPassword, Phone, LicensePlate } = req.body;

    // (เพิ่ม) ตรวจสอบ field ปกติ
    if (!RiderName || !Email || !RiderPassword || !Phone || !LicensePlate) {
       console.error("ERROR: Missing required fields in body.");
       console.log("Received Body:", req.body); // Log body ที่ได้รับ
       return res.status(400).json({ error: "RiderName, Email, RiderPassword, Phone, and LicensePlate are required" });
    }

    // 2. (แก้ไข!) ตรวจสอบไฟล์รูปภาพรถ จาก req.files (มี 's')
    //    .fields() จะส่งมาเป็น object เช่น { vehicleImage: [file], riderImage: [file] }
    if (!req.files || !req.files['vehicleImage'] || req.files['vehicleImage'].length === 0) {
      console.error("ERROR: Vehicle image is required (req.files['vehicleImage'] is missing).");
      console.log("Received Files:", req.files); // Log files ที่ได้รับ
      return res.status(400).json({ error: "Vehicle image is required." });
    }
    // (เพิ่ม) ตรวจสอบรูป Rider (ถ้าต้องการให้จำเป็น)
    if (!req.files || !req.files['riderImage'] || req.files['riderImage'].length === 0) {
      console.error("ERROR: Rider image is required (req.files['riderImage'] is missing).");
       console.log("Received Files:", req.files); // Log files ที่ได้รับ
      return res.status(400).json({ error: "Rider image is required." });
    }

    // (แก้ไข!) เก็บ path รูปภาพรถ จาก req.files
    const vehicleImagePath = req.files['vehicleImage'][0].path;
    // (แก้ไข!) เก็บ path รูป Rider จาก req.files (เรากำหนดให้ต้องมี)
    const riderImagePath = req.files['riderImage'][0].path;

    console.log("Rider Data:", req.body);
    console.log(`Vehicle image saved to: ${vehicleImagePath}`);
    console.log(`Rider image saved to: ${riderImagePath}`); // แก้ไข Log


    // 3. Hash password
    const hashed = await bcrypt.hash(RiderPassword, 10);
    console.log("Rider Password hashed.");

    // 4. INSERT ข้อมูลลงตาราง Rider
    console.log("Attempting: INSERT INTO Rider...");
    // (แก้ไข!) เปลี่ยน RiderImagePath เป็น ProfilePictureRider
    db.run(
      `INSERT INTO Rider (
          RiderName, Email, RiderPassword, Phone,
          VehicleImagePath, LicensePlate, ProfilePictureRider
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`, // <-- แก้ชื่อคอลัมน์สุดท้าย
      [
        RiderName,
        Email,
        hashed,
        Phone,
        vehicleImagePath,
        LicensePlate,
        riderImagePath // <-- Path รูป Rider
      ],
      function (err) {
        if (err) {
          console.error("!!! RIDER INSERT FAILED:", err.message);
          if (err.message.includes("UNIQUE constraint failed: Rider.Email")) {
            return res.status(400).json({ error: "This email is already registered as a Rider." });
          }
          // (แก้ไข!) ตรวจสอบ Error คอลัมน์ ProfilePictureRider ไม่มีอยู่
          if (err.message.includes("has no column named ProfilePictureRider")) {
             console.error(">>> Database Error: Please add 'ProfilePictureRider' column to the 'Rider' table.");
             return res.status(500).json({ error: "Database schema error: ProfilePictureRider column missing."});
          }
          return res.status(500).json({ error: `Rider insert failed: ${err.message}` });
        }

        const newRiderID = this.lastID;
        console.log(`Rider created with ID: ${newRiderID}`);

        // 5. ส่งข้อมูล Rider ใหม่กลับไป
        // (แก้ไข!) เปลี่ยน RiderImagePath เป็น ProfilePictureRider
        res.status(201).json({
          RiderID: newRiderID,
          RiderName,
          Email,
          Phone,
          VehicleImagePath: vehicleImagePath,
          LicensePlate,
          ProfilePictureRider: riderImagePath // <-- แก้ชื่อ field ที่ส่งกลับ
        });
      }
    );
  } catch (err) {
    console.error("!!! OUTER CATCH ERROR (Rider):", err.message);
    res.status(500).json({ error: `Outer catch error: ${err.message}` });
  }
}

// Login rider (Updated SELECT & Response)
async function loginRider(req, res) {
  console.log("\n--- LOGIN RIDER: Endpoint Hit ---");
  const { Email, RiderPassword } = req.body;

  if (!Email || !RiderPassword) {
    console.error("ERROR: Email or RiderPassword missing in login request.");
    return res.status(400).json({ error: "Email and Password required" });
  }

  console.log(`Attempting login for Rider Email: ${Email}`);
  // (แก้ไข!) เปลี่ยน RiderImagePath เป็น ProfilePictureRider ใน SELECT
  db.get(
    "SELECT RiderID, RiderName, Email, Phone, RiderPassword, VehicleImagePath, LicensePlate, ProfilePictureRider FROM Rider WHERE Email = ?",
    [Email],
    async (err, row) => {
      if (err) {
        console.error("!!! RIDER LOGIN DB SELECT FAILED:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log(`Login Failed: Rider Email not found (${Email})`);
        return res.status(400).json({ error: "Email not found" });
      }

      console.log("Rider Email found. Comparing password...");
      const match = await bcrypt.compare(RiderPassword, row.RiderPassword);
      if (!match) {
        console.log(`Login Failed: Incorrect password for Rider Email (${Email})`);
        return res.status(400).json({ error: "Incorrect password" });
      }

      console.log(`Login SUCCESS for Rider Email: ${Email}`);
      // (แก้ไข!) เปลี่ยน RiderImagePath เป็น ProfilePictureRider ใน Response
      res.json({
        RiderID: row.RiderID,
        RiderName: row.RiderName,
        Email: row.Email,
        Phone: row.Phone,
        VehicleImagePath: row.VehicleImagePath,
        LicensePlate: row.LicensePlate,
        ProfilePictureRider: row.ProfilePictureRider // <-- แก้ชื่อ field ที่ส่งกลับ
      });
    }
  );
}

module.exports = { getAllRiders, createRider, loginRider };

