    const db = require("../config/database");

    // --- (ใหม่!) ฟังก์ชันดึงข้อมูล Location ตาม UserID ---
    function getUserLocations(req, res) {
      const userId = req.params.userId;
      console.log(`\n--- GET USER LOCATIONS: Endpoint Hit for UserID: ${userId} ---`);

      if (!userId) {
        console.error("ERROR: UserID missing in request parameters.");
        return res.status(400).json({ error: "UserID is required in the URL path." });
      }

      db.all(
        "SELECT * FROM User_Saved_Location WHERE UserID = ?", // <-- ตรวจสอบชื่อตาราง/คอลัมน์
        [userId],
        (err, rows) => {
          if (err) {
            console.error(`!!! GET LOCATIONS FAILED for UserID ${userId}:`, err.message);
            return res.status(500).json({ error: err.message });
          }
          console.log(`SUCCESS: Fetched ${rows.length} locations for UserID ${userId}.`);
          res.json(rows); // ส่ง Array กลับไป (อาจจะเป็น Array ว่าง)
        }
      );
    }


    // --- (ใหม่!) ฟังก์ชันเพิ่ม Location ใหม่ ---
    function addLocation(req, res) {
      console.log("\n--- ADD LOCATION: Endpoint Hit ---");
      console.log("Received Body:", req.body); // Log ข้อมูลที่ได้รับ

      try {
        const { UserID, LocationName, Latitude, Longitude, AddressText } = req.body;

        // ตรวจสอบข้อมูลเบื้องต้น
        if (!UserID || !LocationName || Latitude == null || Longitude == null || !AddressText) {
           console.error("ERROR: Missing required fields for adding location.");
           return res.status(400).json({ error: "UserID, LocationName, Latitude, Longitude, and AddressText are required." });
        }

        console.log("Attempting: INSERT INTO User_Saved_Location...");
        db.run(
          `INSERT INTO User_Saved_Location (
              UserID, LocationName, Latitude, Longitude, AddressText
           ) VALUES (?, ?, ?, ?, ?)`,
          [UserID, LocationName, Latitude, Longitude, AddressText],
          function (err) {
            if (err) {
              console.error("!!! ADD LOCATION INSERT FAILED:", err.message);
              return res.status(500).json({ error: `Failed to add location: ${err.message}` });
            }
            const newLocationId = this.lastID;
            console.log(`SUCCESS: Location added with ID: ${newLocationId} for UserID: ${UserID}.`);
            // ส่งข้อมูลที่เพิ่งสร้างกลับไป (รวม ID)
            res.status(201).json({
               LocationID: newLocationId, // <-- ส่ง ID กลับไปด้วย
               UserID, LocationName, Latitude, Longitude, AddressText
            });
          }
        );
      } catch (e) {
         console.error("!!! OUTER CATCH ERROR (Add Location):", e.message);
         res.status(500).json({ error: `Server error while adding location: ${e.message}` });
      }
    }


    // --- (ใหม่!) ฟังก์ชันอัปเดต Location ---
    function updateLocation(req, res) {
        const locationId = req.params.locationId; // <-- ดึง ID จาก URL
        console.log(`\n--- UPDATE LOCATION: Endpoint Hit for LocationID: ${locationId} ---`);
        console.log("Received Body:", req.body);

        try {
            const { LocationName, Latitude, Longitude, AddressText } = req.body;

            // ตรวจสอบว่ามีข้อมูลส่งมาอย่างน้อย 1 อย่าง
            if (!LocationName && Latitude == null && Longitude == null && !AddressText) {
                console.error("ERROR: No update data provided for location update.");
                return res.status(400).json({ error: "No data provided for update (LocationName, Latitude, Longitude, AddressText)." });
            }

             // สร้างส่วนของ SQL Query และ Parameters แบบไดนามิก (เผื่ออัปเดตแค่บางส่วน)
            let updateFields = [];
            let updateParams = [];

            if (LocationName) { updateFields.push("LocationName = ?"); updateParams.push(LocationName); }
            if (Latitude != null) { updateFields.push("Latitude = ?"); updateParams.push(Latitude); }
            if (Longitude != null) { updateFields.push("Longitude = ?"); updateParams.push(Longitude); }
            if (AddressText) { updateFields.push("AddressText = ?"); updateParams.push(AddressText); }

            if (updateFields.length === 0) {
                 console.error("ERROR: Update fields array is empty unexpectedly (update location).");
                 return res.status(400).json({ error: "No valid fields to update." });
            }

            const sqlQuery = `UPDATE User_Saved_Location SET ${updateFields.join(", ")} WHERE LocationID = ?`;
            updateParams.push(locationId); // เพิ่ม locationId เป็น parameter สุดท้าย

            console.log("Attempting SQL:", sqlQuery);
            console.log("With Params:", updateParams);

            db.run(sqlQuery, updateParams, function(err) {
                if (err) {
                    console.error(`!!! LOCATION UPDATE FAILED for LocationID ${locationId}:`, err.message);
                    return res.status(500).json({ error: `Failed to update location: ${err.message}` });
                }
                if (this.changes === 0) {
                    console.log(`Update Warning: LocationID ${locationId} not found or no changes made.`);
                    return res.status(404).json({ error: "Location not found or no changes applied." });
                }
                console.log(`SUCCESS: Location updated for LocationID ${locationId}. Rows affected: ${this.changes}`);
                res.json({ message: "Location updated successfully." }); // ส่ง message สำเร็จ
            });

        } catch(e) {
            console.error(`!!! OUTER CATCH ERROR (Update Location) for LocationID ${locationId}:`, e.message);
            res.status(500).json({ error: `Server error while updating location: ${e.message}` });
        }
    }


    // --- (ใหม่!) ฟังก์ชันลบ Location ---
    function deleteLocation(req, res) {
        const locationId = req.params.locationId;
        console.log(`\n--- DELETE LOCATION: Endpoint Hit for LocationID: ${locationId} ---`);

        if (!locationId) {
             console.error("ERROR: LocationID missing in request parameters for delete.");
             return res.status(400).json({ error: "LocationID is required in the URL path." });
        }

        console.log("Attempting: DELETE FROM User_Saved_Location...");
        db.run(
            "DELETE FROM User_Saved_Location WHERE LocationID = ?",
            [locationId],
            function(err) {
                 if (err) {
                    console.error(`!!! LOCATION DELETE FAILED for LocationID ${locationId}:`, err.message);
                    return res.status(500).json({ error: `Failed to delete location: ${err.message}` });
                }
                 if (this.changes === 0) {
                    console.log(`Delete Warning: LocationID ${locationId} not found.`);
                    // ส่ง 404 ถ้าไม่เจอ ID ที่จะลบ
                    return res.status(404).json({ error: "Location not found." });
                }
                console.log(`SUCCESS: Location deleted for LocationID ${locationId}. Rows affected: ${this.changes}`);
                // ส่ง 200 OK หรือ 204 No Content ก็ได้
                res.status(200).json({ message: "Location deleted successfully." });
            }
        );
    }


    module.exports = { getUserLocations, addLocation, updateLocation, deleteLocation }; // <-- Export ฟังก์ชันใหม่
    

