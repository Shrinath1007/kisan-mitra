// src/utils/generateToken.js
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload = { id: user._id, role: user.role, email: user.email };
  const secret = process.env.JWT_SECRET || "changeme";
  const expiresIn = process.env.JWT_EXPIRES || "7d";
  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = generateToken;
