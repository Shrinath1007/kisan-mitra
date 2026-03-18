// src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const fs = require("fs");

// 🔥 ROUTES IMPORTS
const authRoutes = require("./routes/authRoutes");
const farmerRoutes = require("./routes/farmerRoutes");
const labourRoutes = require("./routes/labourRoutes");
const machineRoutes = require("./routes/machineRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adminRoutes = require("./routes/adminRoutes");
const simpleAdminLogin = require("./routes/simpleAdminLogin");
const simplePaymentRoutes = require("./routes/simplePaymentRoutes");
const walletRoutes = require("./routes/walletRoutes");
const testRoutes = require("./routes/testRoutes");

const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 8080;

// ---------------- CONNECT DATABASE ----------------
connectDB();

// ---------------- FIXED CORS ----------------
// Now it allows 5173 & 5174 without failure
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ---------------- JSON & FORM DATA ----------------
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ---------------- UPLOAD FOLDER ----------------
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Created uploads directory");
}
app.use("/uploads", express.static(uploadsDir));

// ---------------- TEST ENDPOINTS ----------------
app.get("/api/health", (req, res) =>
  res.json({
    server: "KisanMitra Backend Running",
    port: PORT,
    time: new Date().toISOString(),
  })
);

// ---------------- API ROUTES ----------------
app.use("/api/simple-login", simpleAdminLogin); // 🔥 Login route on top priority
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/labour", labourRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/simple-payment", simplePaymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api", testRoutes);

// ---------------- ERROR HANDLER ----------------
app.use(errorHandler);

// ---------------- 404 CATCH ----------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server Running on PORT: ${PORT}`);
  console.log(`🌐 FRONTEND ALLOWED: http://localhost:5174`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
});
