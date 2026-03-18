// src/models/Machine.js
const mongoose = require("mongoose");

const MachineSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: { type: String, required: true },
    type: { type: String },
    model: { type: String },
    pricePerHour: { type: Number, default: 0 },
    photos: [{ type: String }],
    rating: { type: Number, default: 4.5 },
    location: {
        address: { type: String, required: true },
    },
    availability: { type: Boolean, default: true },
    specifications: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Machine", MachineSchema);