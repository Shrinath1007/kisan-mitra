const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");

const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to get admin from Admin model first
      let user = await Admin.findById(decoded.id).select("-passwordHash");
      
      // If not found in Admin model, check User model with admin role
      if (!user) {
        user = await User.findById(decoded.id).select("-passwordHash");
        if (!user || user.role !== 'admin') {
          return res.status(401).json({ message: "Not authorized, admin access required" });
        }
      }

      // Set user with admin role
      req.user = { ...user.toObject(), role: 'admin', _id: user._id };
      next();
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { adminProtect };
