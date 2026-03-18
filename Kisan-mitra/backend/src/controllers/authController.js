const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { generateOTP, sendOTPEmail, sendPasswordResetOTP } = require("../utils/emailService");

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "Required fields missing" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role, // 🟢 ADMIN or USER STORE
    });

    return res.status(201).json({
      user: user.toClient(),
      token: generateToken(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    return res.json({
      user: user.toClient(),
      token: generateToken(user),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user: user.toClient() });
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// Send OTP for email verification
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP temporarily (you might want to use Redis for this in production)
    // For now, we'll store it in a temporary user record
    let tempUser = await User.findOne({ email, isEmailVerified: false });
    if (tempUser) {
      tempUser.otp = otp;
      tempUser.otpExpiry = otpExpiry;
      await tempUser.save();
    } else {
      // Create temporary user record for OTP storage
      tempUser = await User.create({
        name: "temp",
        email,
        passwordHash: "temp",
        otp: otp,
        otpExpiry,
        isEmailVerified: false
      });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    return res.status(200).json({ 
      message: "OTP sent successfully to your email",
      success: true 
    });

  } catch (err) {
    console.error("Send OTP error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user with OTP
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpiry: { $gt: new Date() },
      isEmailVerified: false 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ 
      message: "Email verified successfully",
      success: true 
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Send OTP for password reset
exports.sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in user record
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailResult = await sendPasswordResetOTP(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    return res.status(200).json({ 
      message: "Password reset OTP sent successfully to your email",
      success: true 
    });

  } catch (err) {
    console.error("Send password reset OTP error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Verify OTP for password reset
exports.verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find user with OTP
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.status(200).json({ 
      message: "OTP verified successfully",
      success: true 
    });

  } catch (err) {
    console.error("Verify password reset OTP error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }

    // Find user with valid OTP
    const user = await User.findOne({ 
      email, 
      otp, 
      otpExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.passwordHash = passwordHash;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({ 
      message: "Password reset successfully",
      success: true 
    });

  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Updated register function
exports.registerWithVerification = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if email is verified
    const verifiedUser = await User.findOne({ 
      email, 
      isEmailVerified: true 
    });

    if (!verifiedUser) {
      return res.status(400).json({ 
        message: "Please verify your email first" 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update the verified user with complete registration data
    verifiedUser.name = name;
    verifiedUser.phone = phone;
    verifiedUser.passwordHash = passwordHash;
    verifiedUser.role = role;
    await verifiedUser.save();

    return res.status(201).json({
      user: verifiedUser.toClient(),
      token: generateToken(verifiedUser),
    });

  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};
