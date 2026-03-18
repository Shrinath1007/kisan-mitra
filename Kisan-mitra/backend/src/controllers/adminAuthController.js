const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate admin token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email });

    if (!admin || admin.role !== "admin")
      return res.status(401).json({ message: "Invalid admin credentials" });

    const isMatch = await admin.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    res.json({
      token: generateToken(admin._id),
      admin: admin.toClient(),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
