const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const os = require("os");
const path = require("path");
const fs = require("fs");
const multer = require('multer');

// --- Import Controllers ---
const userController = require("./controllers/userController");
const riderController = require("./controllers/riderController");
const addressController = require("./controllers/addressController");
const foodController = require("./controllers/foodController");
const orderMainController = require("./controllers/orderMainController");
const orderDetailController = require("./controllers/orderDetailController");
const locationController = require("./controllers/locationController");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- ตั้งค่า Multer แยกกัน ---

// 1. Storage สำหรับรูป Profile User
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/ProfilePicture/'); // โฟลเดอร์สำหรับ User
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + extension); // เปลี่ยน prefix ชื่อไฟล์
  }
});
const profileUpload = multer({ storage: profileStorage }); // Middleware สำหรับ User

// 2. Storage สำหรับรูป Rider (ใช้ fields)
const riderImagesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/RiderImages/'); // โฟลเดอร์สำหรับรูป Rider
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension); // ใส่ชื่อ field ในชื่อไฟล์
  }
});
const riderImagesUpload = multer({ storage: riderImagesStorage }); // Middleware สำหรับ Rider


// --- สร้างโฟลเดอร์ ---
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads/ProfilePicture'), { recursive: true }); // สร้างโฟลเดอร์ User
fs.mkdirSync(path.join(__dirname, 'uploads/RiderImages'), { recursive: true }); // สร้างโฟลเดอร์ Rider

// --- ให้บริการไฟล์ Static ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- Routes ---

// User Routes
app.get("/api/users", userController.getAllUsers);
app.post("/api/login", userController.loginUser);
app.post("/api/users", profileUpload.single('profileImage'), userController.createUser);
app.get("/api/users/:userId", userController.getUserById);           // ดึงข้อมูล User ตาม ID
app.put("/api/users/:userId", profileUpload.single('profileImage'), userController.updateUser); // อัปเดตข้อมูล User (ใช้ PUT และ multer)
const shipmentController = require('./controllers/shipmentController');

app.get("/api/shipments", shipmentController.getAllShipments);
app.post("/api/shipments", shipmentController.createShipment);
app.put("/api/shipments/:shipmentId", shipmentController.updateShipmentStatus);
// User Saved Location Routes
app.get("/api/users/:userId/locations", locationController.getUserLocations); // ดึงที่อยู่
app.post("/api/users/locations", locationController.addLocation);           // เพิ่มที่อยู่ใหม่
// (เพิ่ม!) Routes สำหรับ Update และ Delete Location
app.put("/api/users/locations/:locationId", locationController.updateLocation); // อัปเดตที่อยู่
app.delete("/api/users/locations/:locationId", locationController.deleteLocation); // ลบที่อยู่

// Rider Routes
app.get("/api/riders", riderController.getAllRiders);
app.post("/api/riders", riderImagesUpload.fields([
  { name: 'riderImage', maxCount: 1 },
  { name: 'vehicleImage', maxCount: 1 }
]), riderController.createRider);
// app.post("/api/riders/login", riderController.loginRider); // ถ้าต้องการ Login แยก

// Address Routes (ที่อยู่แบบดั้งเดิม - อาจจะไม่จำเป็นแล้ว?)
app.get("/api/addresses/:userId", addressController.getAddressesByUser);
app.post("/api/addresses", addressController.addAddress);

// Food Routes
app.get("/api/foods", foodController.getFoods);
app.post("/api/foods", foodController.addFood);

// Order Main Routes
app.get("/api/orders", orderMainController.getOrders);
app.post("/api/orders", orderMainController.createOrder);

// Order Detail Routes
app.get("/api/orders/:orderId/details", orderDetailController.getOrderDetails);
app.post("/api/orders/details", orderDetailController.addOrderDetail);


// --- Start Server ---
const interfaces = os.networkInterfaces();
let ip = "0.0.0.0";
for (const iface of Object.values(interfaces)) {
  for (const alias of iface) {
    if (alias.family === "IPv4" && !alias.internal) {
      ip = alias.address;
      break;
    }
  }
}

const port = process.env.PORT || 3000; // ใช้ PORT จาก Environment Variable

app.listen(port, () => { // Listen บน port 0.0.0.0 (เป็น default บน Cloud)
  console.log(`✅ Server listening on port ${port}`);
});

