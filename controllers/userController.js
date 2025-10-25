const db = require("../config/database");
const bcrypt = require("bcrypt");

function getAllUsers(req, res) {
  db.all("SELECT * FROM User", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

async function createUser(req, res) {
  console.log("\n--- CREATE USER: Endpoint Hit ---");
  try {
    console.log("Receiving Data..."); 
    const { Name, Email, Password, Phone, Address, Latitude, Longitude, LocationName } = req.body;

    // ตรวจสอบไฟล์
    if (!req.file) {
      return res.status(400).json({ error: "Profile image is required." });
    }

    const profilePicturePath = req.file.path;
    const hashed = await bcrypt.hash(Password, 10);

    // ขั้นตอนที่ 1: บันทึกข้อมูลลงตาราง User
    db.run(
      `INSERT INTO User (Name, Email, Password, Phone, ProfilePicture) VALUES (?, ?, ?, ?, ?)`,
      [Name, Email, hashed, Phone, profilePicturePath],
      function (err) {
        if (err) {
          console.error("!!! USER INSERT FAILED:", err.message);
          return res.status(500).json({ error: `User insert failed: ${err.message}` });
        }

        const newUserID = this.lastID;

        // ขั้นตอนที่ 2: บันทึกข้อมูลสถานที่ลงตาราง User_Saved_Location
        db.run(
          `INSERT INTO User_Saved_Location (UserID, LocationName, Latitude, Longitude, AddressText) VALUES (?, ?, ?, ?, ?)`,
          [newUserID, LocationName || Address, Latitude, Longitude, Address],
          function (err) {
            if (err) {
              console.error("!!! LOCATION INSERT FAILED:", err.message);
              return res.status(500).json({ error: `Saved Location insert failed: ${err.message}` });
            }

            // ส่งข้อมูลผู้ใช้ใหม่กลับไป
            res.status(201).json({
              UserID: newUserID,
              Name,
              Email,
              Phone,
              ProfilePicture: profilePicturePath
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("!!! OUTER CATCH ERROR:", err.message);
    res.status(500).json({ error: `Outer catch error: ${err.message}` });
  }
}

async function loginUser(req, res) {
 console.log("\n--- LOGIN USER: Endpoint Hit ---");
 console.log("Request Headers:", req.headers);
 console.log("Request Body:", req.body);

 const { Email, Password } = req.body || {};

 if (!Email || !Password) {
  console.error("ERROR: Email or Password missing in request body.");
  return res.status(400).json({ error: "Email and Password are required." });
 }

 console.log(`Attempting login for Email: ${Email}`);

 // 1. ลองหาในตาราง User ก่อน
 db.get("SELECT * FROM User WHERE Email = ?", [Email], async (err, userRow) => {
  if (err) {
   console.error("!!! DB SELECT (User) FAILED:", err.message);
   return res.status(500).json({ error: err.message });
  }

  // 1.1 ถ้าเจอใน User
  if (userRow) {
   console.log("Email found in User table. Comparing password...");
   const match = await bcrypt.compare(Password, userRow.Password);

   if (!match) {
    console.log(`Login Failed: Incorrect password for User Email (${Email})`);
    return res.status(400).json({ error: "Incorrect password" });
   }

   // Login สำเร็จ (เป็น User)
   console.log(`Login SUCCESS (User) for Email: ${Email}`);
   res.json({
    // ส่งข้อมูล User กลับไป (ปรับ Key ให้ตรงกับที่ Flutter คาดหวัง)
    UserID: userRow.UserID,
    Name: userRow.Name,
    Email: userRow.Email,
    Phone: userRow.Phone,
    ProfilePicture: userRow.ProfilePicture // ชื่อคอลัมน์จาก DB
    // เพิ่ม Role เพื่อให้ Flutter แยกง่ายขึ้น
    // Role: 'Customer'
   });
   return; // จบการทำงาน ไม่ต้องไปหา Rider ต่อ
  }

  // 1.2 ถ้าไม่เจอใน User -> ไปหาใน Rider
  console.log(`Email not found in User table. Checking Rider table...`);
  db.get("SELECT * FROM Rider WHERE Email = ?", [Email], async (err2, riderRow) => {
   if (err2) {
    console.error("!!! DB SELECT (Rider) FAILED:", err2.message);
    return res.status(500).json({ error: err2.message });
   }

   // 2.1 ถ้าไม่เจอใน Rider ด้วย
   if (!riderRow) {
    console.log(`Login Failed: Email not found in Rider table either (${Email})`);
    return res.status(400).json({ error: "Email not found" });
   }

   // 2.2 ถ้าเจอใน Rider
   console.log("Email found in Rider table. Comparing password...");
   const matchRider = await bcrypt.compare(Password, riderRow.RiderPassword);

   if (!matchRider) {
    console.log(`Login Failed: Incorrect password for Rider Email (${Email})`);
    return res.status(400).json({ error: "Incorrect password" });
   }

   // Login สำเร็จ (เป็น Rider)
   console.log(`Login SUCCESS (Rider) for Email: ${Email}`);
   res.json({
    // ส่งข้อมูล Rider กลับไป (ปรับ Key ให้ตรงกับที่ Flutter คาดหวัง และ riderController)
    RiderID: riderRow.RiderID,
    RiderName: riderRow.RiderName, // หรือใช้ Name ถ้าต้องการ Key เดียวกัน
    Email: riderRow.Email,
    Phone: riderRow.Phone,
    VehicleImagePath: riderRow.VehicleImagePath,
    LicensePlate: riderRow.LicensePlate,
    ProfilePictureRider: riderRow.ProfilePictureRider // ชื่อคอลัมน์จาก DB
    // เพิ่ม Role เพื่อให้ Flutter แยกง่ายขึ้น
    // Role: 'Rider'
   });
  });
 });
}

function getUserById(req, res) {
  const userId = req.params.userId;
  console.log(`\n--- GET USER BY ID: Endpoint Hit for UserID: ${userId} ---`);

  if (!userId) {
    console.error("ERROR: UserID missing in request parameters.");
    return res.status(400).json({ error: "UserID is required in the URL path." });
  }

  // ดึงข้อมูล User (ไม่เอา Password)
  db.get(
    "SELECT UserID, Name, Email, Phone, ProfilePicture FROM User WHERE UserID = ?",
    [userId],
    (err, row) => {
      if (err) {
        console.error(`!!! GET USER FAILED for UserID ${userId}:`, err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        console.log(`Get User Failed: User not found (${userId})`);
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`SUCCESS: Fetched User data for UserID ${userId}.`);
      res.json(row); // ส่งข้อมูล User กลับไป
    }
  );
}


// --- (ใหม่!) ฟังก์ชันอัปเดตข้อมูล User ---
async function updateUser(req, res) {
  const userId = req.params.userId;
  console.log(`\n--- UPDATE USER: Endpoint Hit for UserID: ${userId} ---`);
  console.log("Received Body:", req.body);
  console.log("Received File:", req.file); // ตรวจสอบว่ามีไฟล์ใหม่ส่งมาไหม

  try {
    // 1. ดึงข้อมูลที่จะอัปเดตจาก req.body
    //    (เราจะอนุญาตให้อัปเดตแค่ Name กับ Phone ในตัวอย่างนี้)
    const { Name, Phone } = req.body;

    // ตรวจสอบว่ามีข้อมูลส่งมาอย่างน้อย 1 อย่าง หรือมีไฟล์ใหม่
    if (!Name && !Phone && !req.file) {
      console.error("ERROR: No update data provided.");
      return res.status(400).json({ error: "No update data (Name, Phone, or new ProfilePicture) provided." });
    }

    // 2. สร้างส่วนของ SQL Query และ Parameters
    let updateFields = [];
    let updateParams = [];

    if (Name) {
      updateFields.push("Name = ?");
      updateParams.push(Name);
    }
    if (Phone) {
      updateFields.push("Phone = ?");
      updateParams.push(Phone);
    }

    let oldImagePath = null; // ตัวแปรเก็บ path รูปเก่า (ถ้ามี)

    // 3. จัดการรูปภาพใหม่ (ถ้ามี)
    if (req.file) {
       const newProfilePicturePath = req.file.path;
       console.log(`New profile image uploaded to: ${newProfilePicturePath}`);
       updateFields.push("ProfilePicture = ?");
       updateParams.push(newProfilePicturePath);

       // (สำคัญ!) ดึง path รูปเก่า เพื่อลบทิ้งหลังจากอัปเดตสำเร็จ
       db.get("SELECT ProfilePicture FROM User WHERE UserID = ?", [userId], (err, row) => {
         if (!err && row && row.ProfilePicture) {
           oldImagePath = row.ProfilePicture;
           console.log(`Old image path found: ${oldImagePath}`);
         }
       });
    }

    // 4. สร้าง SQL Query แบบไดนามิก
    if (updateFields.length === 0) {
        // กรณีนี้ไม่ควรเกิด ถ้าการตรวจสอบด้านบนทำงานถูกต้อง
        console.error("ERROR: Update fields array is empty unexpectedly.");
        return res.status(400).json({ error: "No valid fields to update." });
    }
    const sqlQuery = `UPDATE User SET ${updateFields.join(", ")} WHERE UserID = ?`;
    updateParams.push(userId); // เพิ่ม userId เป็น parameter สุดท้ายสำหรับ WHERE

    console.log("Attempting SQL:", sqlQuery);
    console.log("With Params:", updateParams);

    // 5. รันคำสั่ง UPDATE
    db.run(sqlQuery, updateParams, function (err) {
      if (err) {
        console.error(`!!! USER UPDATE FAILED for UserID ${userId}:`, err.message);
        return res.status(500).json({ error: `User update failed: ${err.message}` });
      }

      // ตรวจสอบว่ามีการอัปเดตเกิดขึ้นจริงหรือไม่
      if (this.changes === 0) {
         console.log(`Update Warning: UserID ${userId} not found or no changes made.`);
         // อาจจะส่ง 404 ถ้า UserID ไม่มีอยู่จริง
         return res.status(404).json({ error: "User not found or no changes applied." });
      }

      console.log(`SUCCESS: User updated for UserID ${userId}. Rows affected: ${this.changes}`);

      // 6. (ถ้ามีการอัปเดตรูป) ลบรูปภาพเก่า (ถ้ามี)
      if (oldImagePath) {
         // สร้าง path เต็ม
         const fullOldPath = path.join(__dirname, '..', oldImagePath); // ใช้ '..' เพื่อกลับไป 1 ระดับจาก /controllers
         console.log(`Attempting to delete old image: ${fullOldPath}`);
         fs.unlink(fullOldPath, (unlinkErr) => {
             if (unlinkErr) {
                 // ไม่ต้อง return error หลัก แค่ log ไว้
                 console.error(`Warning: Failed to delete old image file (${fullOldPath}): ${unlinkErr.message}`);
             } else {
                 console.log(`Successfully deleted old image file: ${fullOldPath}`);
             }
         });
      }

      // 7. ส่ง response สำเร็จกลับไป (อาจจะส่งข้อมูลที่อัปเดตแล้วกลับไปด้วยก็ได้ โดยการ SELECT อีกครั้ง)
      //    ในตัวอย่างนี้ ส่งแค่ message กลับไปก่อน
      // db.get("SELECT UserID, Name, Email, Phone, ProfilePicture FROM User WHERE UserID = ?", [userId], (selectErr, updatedRow) => { ... res.json(updatedRow) })
      res.json({ message: "User profile updated successfully." });
    });

  } catch (err) {
    console.error(`!!! OUTER CATCH ERROR (Update User) for UserID ${userId}:`, err.message);
    res.status(500).json({ error: `Outer catch error: ${err.message}` });
  }
}

module.exports = { getAllUsers, createUser, loginUser,getUserById,updateUser };