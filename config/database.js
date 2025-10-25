const sqlite3 = require("sqlite3").verbose();
const path = require("path"); // (สำคัญ!) Import path

// (แก้ไข!) กำหนด Path ของฐานข้อมูลให้ใช้โฟลเดอร์ชั่วคราวบน Cloud (ซึ่งจะหายไป)
const DB_PATH = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '..', 'Data.db') // ใช้ Data.db ในโฟลเดอร์หลัก (ถ้ามีสิทธิ์)
  : path.join(__dirname, '..', 'Data.db'); // ใช้ Data.db สำหรับ local

// (เพิ่ม!) เพิ่ม Logic การสร้างไฟล์ DB ถ้าไม่มี และ Try/Catch
let db;
try {
    // โค้ดจะสร้าง/เปิดไฟล์ Data.db ถ้าไม่มี
    db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error("❌ Fatal Error: Could not connect to SQLite database:", err.message);
        } else {
            console.log("✅ Connected to SQLite database at:", DB_PATH);
        }
    });

    // (เพิ่ม!) สร้างตารางที่จำเป็นทั้งหมด (Schema Setup)
    db.serialize(() => {
      console.log("Setting up database schema...");

      // 1. ตาราง User (รวม ProfilePicture)
      db.run(`CREATE TABLE IF NOT EXISTS User (
          UserID INTEGER PRIMARY KEY AUTOINCREMENT,
          Name VARCHAR(100) NOT NULL,
          Email VARCHAR(150) UNIQUE NOT NULL,
          Password VARCHAR(255) NOT NULL,
          Phone VARCHAR(20),
          ProfilePicture VARCHAR(255)
      )`);

      // 2. ตาราง Rider (รวม Vehicle และ ProfilePictureRider)
      db.run(`CREATE TABLE IF NOT EXISTS Rider (
          RiderID INTEGER PRIMARY KEY AUTOINCREMENT,
          RiderName VARCHAR(100) NOT NULL,
          Email VARCHAR(100) NOT NULL UNIQUE,
          RiderPassword VARCHAR(255) NOT NULL,
          Phone VARCHAR(20) NOT NULL,
          VehicleImagePath VARCHAR(255),
          LicensePlate VARCHAR(50),
          ProfilePictureRider VARCHAR(255)
      )`);

      // 3. ตาราง User_Saved_Location (ที่อยู่แบบ GPS)
      db.run(`CREATE TABLE IF NOT EXISTS User_Saved_Location (
          LocationID INTEGER PRIMARY KEY AUTOINCREMENT,
          UserID INTEGER NOT NULL,
          LocationName VARCHAR(100) NOT NULL,
          Latitude DECIMAL(10, 8) NOT NULL,
          Longitude DECIMAL(11, 8) NOT NULL,
          AddressText TEXT,
          FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
      )`);

      // 4. ตาราง Address (ที่อยู่แบบเต็ม/ดั้งเดิม - ถ้ายังใช้)
      db.run(`CREATE TABLE IF NOT EXISTS Address (
          AddressID INTEGER PRIMARY KEY AUTOINCREMENT,
          UserID INTEGER NOT NULL,
          Place_Name VARCHAR(100),
          Street VARCHAR(200) NOT NULL,
          City VARCHAR(100) NOT NULL,
          Province VARCHAR(100) NOT NULL,
          PostalCode VARCHAR(10),
          Phone VARCHAR(20),
          FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
      )`);

      // 5. ตาราง Food_Item (รายการอาหาร)
      db.run(`CREATE TABLE IF NOT EXISTS Food_Item (
          FoodID INTEGER PRIMARY KEY AUTOINCREMENT,
          FoodName VARCHAR(150) NOT NULL,
          Price DECIMAL(10,2) NOT NULL,
          Description TEXT
      )`);

      // 6. ตาราง Order_Main (คำสั่งซื้อหลัก)
      db.run(`CREATE TABLE IF NOT EXISTS Order_Main (
          OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
          UserID INTEGER NOT NULL,
          RiderID INTEGER,
          OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          TotalAmount DECIMAL(10,2) NOT NULL,
          Status VARCHAR(50) DEFAULT 'กำลังเตรียม',
          PaymentMethod VARCHAR(50) NOT NULL,
          FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
          FOREIGN KEY (RiderID) REFERENCES Rider(RiderID) ON DELETE SET NULL
      )`);

      // 7. ตาราง Order_Detail (รายละเอียดคำสั่งซื้อ)
      db.run(`CREATE TABLE IF NOT EXISTS Order_Detail (
          DetailID INTEGER PRIMARY KEY AUTOINCREMENT,
          OrderID INTEGER NOT NULL,
          FoodID INTEGER NOT NULL,
          Quantity INTEGER NOT NULL DEFAULT 1,
          Price DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (OrderID) REFERENCES Order_Main(OrderID) ON DELETE CASCADE,
          FOREIGN KEY (FoodID) REFERENCES Food_Item(FoodID) ON DELETE CASCADE
      )`);
      
      // 8. ตาราง Shipment (การส่งสินค้า)
      db.run(`CREATE TABLE IF NOT EXISTS Shipment (
          ShipmentID INTEGER PRIMARY KEY AUTOINCREMENT,
          SenderID INTEGER NOT NULL,
          RiderID INTEGER,
          OriginAddressID INTEGER NOT NULL,
          ReceiverName VARCHAR(100) NOT NULL,
          ReceiverPhone VARCHAR(20) NOT NULL,
          Destination_Street VARCHAR(200) NOT NULL,
          Destination_City VARCHAR(100) NOT NULL,
          Destination_Province VARCHAR(100) NOT NULL,
          Destination_PostalCode VARCHAR(10),
          ItemDescription TEXT,
          ShippingCost DECIMAL(10, 2),
          PaymentMethod VARCHAR(50) NOT NULL,
          Status VARCHAR(50) DEFAULT 'รอดำเนินการ',
          CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (SenderID) REFERENCES User(UserID) ON DELETE CASCADE,
          FOREIGN KEY (RiderID) REFERENCES Rider(RiderID) ON DELETE SET NULL,
          FOREIGN KEY (OriginAddressID) REFERENCES Address(AddressID) ON DELETE RESTRICT
      )`);

      // 9. ตาราง Rider_Location (ตำแหน่งล่าสุดของคนขับ)
      db.run(`CREATE TABLE IF NOT EXISTS Rider_Location (
          RiderLocationID INTEGER PRIMARY KEY AUTOINCREMENT,
          RiderID INTEGER NOT NULL UNIQUE,
          Latitude DECIMAL(10, 8) NOT NULL,
          Longitude DECIMAL(11, 8) NOT NULL,
          LastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (RiderID) REFERENCES Rider(RiderID) ON DELETE CASCADE
      )`);

      // 10. ตาราง Shipment_Status_History (ประวัติสถานะการส่ง)
      db.run(`CREATE TABLE IF NOT EXISTS Shipment_Status_History (
          HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
          ShipmentID INTEGER NOT NULL,
          Status VARCHAR(50) NOT NULL,
          Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          Notes TEXT,
          FOREIGN KEY (ShipmentID) REFERENCES Shipment(ShipmentID) ON DELETE CASCADE
      )`);

       console.log("✅ Database schema setup complete.");
    });


} catch (e) {
    console.error("❌ CRITICAL ERROR DURING DB INITIALIZATION:", e.message);
}

module.exports = db;
