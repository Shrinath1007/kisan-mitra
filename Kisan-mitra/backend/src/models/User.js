// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: String,

    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["farmer", "labour", "owner", "admin"],
      default: "farmer",
    },

    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },

    profilePic: String,
    kycVerified: { type: Boolean, default: false },

    // New fields
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
    farmingStyles: [String],
    
    // Labour-specific fields
    skills: [String],
    availability: { type: Boolean, default: false },
    expectedRate: Number,
    manualOverride: { type: Boolean, default: false },
    manualStatus: { type: Boolean, default: false },
    
    // OTP fields
    otp: String,
    otpExpiry: Date,
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.methods.toClient = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    kycVerified: this.kycVerified,
    profilePic: this.profilePic,
    farmingStyles: this.farmingStyles,
    skills: this.skills,
    availability: this.availability,
    expectedRate: this.expectedRate,
    manualOverride: this.manualOverride,
    manualStatus: this.manualStatus,
  };
};

module.exports = mongoose.model("User", UserSchema);
