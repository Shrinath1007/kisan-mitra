const express = require("express");
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  sendOTP, 
  verifyOTP, 
  registerWithVerification,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword
} = require("../controllers/authController");
const auth = require("../middlewares/authMiddleware");

/* ========== Normal user Auth ========== */
router.post("/register", register);
router.post("/register-with-verification", registerWithVerification);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/me", auth.protect, getMe);

/* ========== Password Reset ========== */
router.post("/forgot-password", sendPasswordResetOTP);
router.post("/verify-reset-otp", verifyPasswordResetOTP);
router.post("/reset-password", resetPassword);

/* 🔥 ADMIN LOGIN WITHOUT DATABASE */
router.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    return res.json({
      success: true,
      message: "Admin login successful!",
      user: {
        name: "Super Admin",
        email: "admin@system.com",
        role: "admin",
      },
      token: "admin_secret_token_here", // optional only for UI
    });
  }

  return res
    .status(401)
    .json({ success: false, message: "Invalid admin credentials" });
});

module.exports = router;
