const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "admin" },
    wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet" },
}, { timestamps: true });

adminSchema.methods.matchPassword = function(password) {
    return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("Admin", adminSchema);