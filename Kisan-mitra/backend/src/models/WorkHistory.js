const mongoose = require("mongoose");

const WorkHistorySchema = new mongoose.Schema({
    labour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    farmName: String,
    days: Number, // total days worked
    payment: Number, // total payment received

    date: { type: String }, // job completion date (string for simplicity)
    rating: { type: Number, default: 0 }, // optional labour rating

    vacancy: { type: mongoose.Schema.Types.ObjectId, ref: "Vacancy" },
}, { timestamps: true });

module.exports = mongoose.model("WorkHistory", WorkHistorySchema);