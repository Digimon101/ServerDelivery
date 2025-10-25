-- CREATE TABLE User (
--     UserID INTEGER PRIMARY KEY AUTOINCREMENT,
--     Name VARCHAR(100) NOT NULL,
--     Email VARCHAR(150) UNIQUE NOT NULL,
--     Password VARCHAR(255) NOT NULL,
--     Phone VARCHAR(20)
-- );

-- -- ตาราง Address (ที่อยู่)
-- CREATE TABLE Address (
--     AddressID INTEGER PRIMARY KEY AUTOINCREMENT,
--     UserID INTEGER NOT NULL,
--     Place_Name VARCHAR(100),
--     Street VARCHAR(200) NOT NULL,
--     City VARCHAR(100) NOT NULL,
--     Province VARCHAR(100) NOT NULL,
--     PostalCode VARCHAR(10),
--     Phone VARCHAR(20),
--     FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
-- );

-- -- ตาราง Rider (ผู้จัดส่ง)
-- CREATE TABLE Rider (
--     RiderID INTEGER PRIMARY KEY AUTOINCREMENT,
--     RiderName VARCHAR(100) NOT NULL,
--     Email VARCHAR(100) NOT NULL UNIQUE,
--     Phone VARCHAR(20) NOT NULL,
--     RiderPassword VARCHAR(255) NOT NULL
-- );

-- -- ตาราง Food_Item (รายการอาหาร)
-- CREATE TABLE Food_Item (
--     FoodID INTEGER PRIMARY KEY AUTOINCREMENT,
--     FoodName VARCHAR(150) NOT NULL,
--     Price DECIMAL(10,2) NOT NULL,
--     Description TEXT
-- );

-- -- ตาราง Order_Main (คำสั่งซื้อหลัก)
-- CREATE TABLE Order_Main (
--     OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
--     UserID INTEGER NOT NULL,
--     RiderID INTEGER,
--     OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
--     TotalAmount DECIMAL(10,2) NOT NULL,
--     Status VARCHAR(50) DEFAULT 'กำลังเตรียม',
--     PaymentMethod VARCHAR(50) NOT NULL,
--     FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE,
--     FOREIGN KEY (RiderID) REFERENCES Rider(RiderID) ON DELETE SET NULL
-- );

-- -- ตาราง Order_Detail (รายละเอียดคำสั่งซื้อ)
-- CREATE TABLE Order_Detail (
--     DetailID INTEGER PRIMARY KEY AUTOINCREMENT,
--     OrderID INTEGER NOT NULL,
--     FoodID INTEGER NOT NULL,
--     Quantity INTEGER NOT NULL DEFAULT 1,
--     Price DECIMAL(10,2) NOT NULL,
--     FOREIGN KEY (OrderID) REFERENCES Order_Main(OrderID) ON DELETE CASCADE,
--     FOREIGN KEY (FoodID) REFERENCES Food_Item(FoodID) ON DELETE CASCADE
-- );

-- ALTER TABLE User
-- ADD COLUMN ProfilePicture VARCHAR(255);

-- ALTER TABLE Rider
-- ADD COLUMN ProfilePictureRider VARCHAR(255);


-- -- ตาราง Shipment (การส่งสินค้า)
-- CREATE TABLE Shipment (
--     ShipmentID INTEGER PRIMARY KEY AUTOINCREMENT,
--     SenderID INTEGER NOT NULL,          -- ID ของผู้ใช้ (User) ที่เป็นคนส่ง (2.1.1)
--     RiderID INTEGER,                    -- ID ของคนขับ (Rider) ที่รับงาน (2.2.1)
--     OriginAddressID INTEGER NOT NULL,   -- ID ที่อยู่ต้นทาง (ของผู้ส่ง) (2.1.3)
    
--     -- ข้อมูลผู้รับ (Receiver) (2.1.2)
--     ReceiverName VARCHAR(100) NOT NULL,
--     ReceiverPhone VARCHAR(20) NOT NULL,
    
--     -- ที่อยู่ปลายทาง (ของผู้รับ)
--     Destination_Street VARCHAR(200) NOT NULL,
--     Destination_City VARCHAR(100) NOT NULL,
--     Destination_Province VARCHAR(100) NOT NULL,
--     Destination_PostalCode VARCHAR(10),
    
--     ItemDescription TEXT,               -- รายละเอียดของที่ส่ง
--     ShippingCost DECIMAL(10, 2),        -- ค่าส่ง (2.1.4)
--     PaymentMethod VARCHAR(50) NOT NULL,
    
--     -- สถานะของ (2.2.2)
--     Status VARCHAR(50) DEFAULT 'รอดำเนินการ', -- เช่น 'รอดำเนินการ', 'กำลังหาคนขับ', 'กำลังไปรับ', 'กำลังจัดส่ง', 'ส่งสำเร็จ', 'ยกเลิกแล้ว'
    
--     CreatedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    
--     FOREIGN KEY (SenderID) REFERENCES User(UserID) ON DELETE CASCADE,
--     FOREIGN KEY (RiderID) REFERENCES Rider(RiderID) ON DELETE SET NULL,
--     FOREIGN KEY (OriginAddressID) REFERENCES Address(AddressID) ON DELETE RESTRICT
-- );

-- -- ตารางตำแหน่งล่าสุดของคนขับ
-- CREATE TABLE Rider_Location (
--     RiderLocationID INTEGER PRIMARY KEY AUTOINCREMENT,
--     RiderID INTEGER NOT NULL UNIQUE, -- ให้ Rider 1 คน มีตำแหน่งล่าสุดได้แค่ 1 ที่
--     Latitude DECIMAL(10, 8) NOT NULL,
--     Longitude DECIMAL(11, 8) NOT NULL,
--     LastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP,
    
--     FOREIGN KEY (RiderID) REFERENCES Rider(RiderID) ON DELETE CASCADE
-- );

-- -- ตารางประวัติสถานะการส่ง (สำหรับ Tracking)
-- CREATE TABLE Shipment_Status_History (
--     HistoryID INTEGER PRIMARY KEY AUTOINCREMENT,
--     ShipmentID INTEGER NOT NULL,
--     Status VARCHAR(50) NOT NULL,
--     Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
--     Notes TEXT, -- หมายเหตุเพิ่มเติม เช่น "คนขับรับของแล้ว"
    
--     FOREIGN KEY (ShipmentID) REFERENCES Shipment(ShipmentID) ON DELETE CASCADE
-- );


-- ตารางนี้ถูกต้องแล้วสำหรับการเก็บหลายที่อยู่
-- CREATE TABLE Address (
--     AddressID INTEGER PRIMARY KEY AUTOINCREMENT,
--     UserID INTEGER NOT NULL,
--     Place_Name VARCHAR(100), -- เช่น "บ้าน", "ที่ทำงาน"
--     Street VARCHAR(200) NOT NULL,
--     City VARCHAR(100) NOT NULL,
--     Province VARCHAR(100) NOT NULL,
--     PostalCode VARCHAR(10),
--     Phone VARCHAR(20),
--     FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
-- );

-- CREATE TABLE User_Saved_Location (
--     LocationID INTEGER PRIMARY KEY AUTOINCREMENT,
--     UserID INTEGER NOT NULL,
--     LocationName VARCHAR(100) NOT NULL,  -- ชื่อที่ผู้ใช้ตั้งเอง เช่น "บ้าน", "โกดัง", "ร้าน A"
--     Latitude DECIMAL(10, 8) NOT NULL,     -- ค่าละติจูด
--     Longitude DECIMAL(11, 8) NOT NULL,    -- ค่าลองจิจูด
    
--     -- (แนะนำให้มี) เก็บที่อยู่แบบข้อความที่ได้จาก GPS ด้วย
--     AddressText TEXT, 
    
--     FOREIGN KEY (UserID) REFERENCES User(UserID) ON DELETE CASCADE
-- );

ALTER TABLE Rider
ADD COLUMN VehicleImagePath VARCHAR(255); 

ALTER TABLE Rider
ADD COLUMN LicensePlate VARCHAR(50); 