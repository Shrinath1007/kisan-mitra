const mongoose = require("mongoose");

const VacancySchema = new mongoose.Schema({
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // Farmer
    },

    title: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    contact: { type: String },

    skills: [{ type: String }],

    startDate: { type: String },

    duration: { type: Number, default: 1 }, // Days (same as numberOfDays)

    numWorkers: { type: Number, required: true, default: 1 }, // Total workers required
    ratePerDay: { type: Number, required: true, default: 0 },

    paymentMethod: {
        type: String,
        enum: ["advance", "after"],
        default: "after",
    },

    applicants: [{
        labourId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
    }, ],

    status: {
        type: String,
        enum: ["open", "filled", "cancelled"],
        default: "open",
    },

    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    paymentOrderId: {
        type: String,
    },
}, { timestamps: true });

// Auto-update vacancy status based on applicants count
VacancySchema.methods.updateStatus = function() {
    if (this.applicants.length >= this.numWorkers) {
        this.status = "filled";
    } else {
        this.status = "open";
    }
};

module.exports = mongoose.model("Vacancy", VacancySchema);