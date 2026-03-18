const express = require("express");
const router = express.Router();

// FIXED ADMIN CREDENTIALS
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin";

// FIXED LOGIN ROUTE
router.post("/", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.status(200).json({
      success: true,
      message: "Login Successful",
      role: "admin",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid Username or Password",
  });
});

module.exports = router;
