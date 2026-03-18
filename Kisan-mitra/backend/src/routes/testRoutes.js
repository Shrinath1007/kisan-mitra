// src/routes/testRoutes.js
const express = require("express");
const router = express.Router();

// ⬇ Important Correction: import properly based on your middleware file
const { protect } = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

// ===================== PUBLIC TEST =====================
router.get("/test", (req, res) => {
  return res.json({ success: true, message: "Test route OK ✔" });
});

router.get("/test-cors", (req, res) => {
  return res.json({ success: true, message: "CORS test OK ✔" });
});

// ===================== PROTECTED ROUTE =====================
router.get("/protected", protect, (req, res) => {
  return res.json({
    success: true,
    message: "Protected route OK 🔐",
    user: req.user,
  });
});

// ===================== FARMER ONLY TEST =====================
router.get("/farmer-only", protect, role(["farmer"]), (req, res) => {
  return res.json({
    success: true,
    message: "Hello Farmer 👩‍🌾",
    user: req.user,
  });
});

module.exports = router;
