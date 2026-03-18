// src/models/Booking.js
const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    machine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Machine",
        required: true,
    },

    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    // Date range of work
    date: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
    },

    hours: { type: Number, required: false },

    // Final price calculation
    price: { type: Number, default: 0 },

    // Booking status
    status: {
        type: String,
        enum: ["pending", "approved", "completed", "rejected", "cancelled"],
        default: "pending",
    },

    // -----------------------------
    // PAYMENT DATA (NEW FEATURES)
    // -----------------------------

    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "refunded", "failed"],
        default: "unpaid",
    },

    // Razorpay order tracking
    paymentOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Invoice ID (for receipt)
    invoiceId: { type: String },

    // Payment method
    paymentPreference: {
        type: String,
        enum: ["advance", "after", "rozpay"],
        default: "after",
    },

    // Advance amount (if 50% advance selected)
    advanceAmount: { type: Number, default: 0 },

    // Full amount for payment tracking
    totalAmount: { type: Number, default: 0 },

    // Refund info
    refund: {
        isRefunded: { type: Boolean, default: false },
        refundId: { type: String },
        refundedAmount: { type: Number },
        refundedAt: { type: Date },
    },

    //-----------------------------
    // WORK DETAILS
    //-----------------------------

    jobDescription: {
        type: String,
        trim: true,
    },

    workCompleted: {
        confirmedByFarmer: { type: Boolean, default: false },
        confirmedByOwner: { type: Boolean, default: false },
        completedAt: { type: Date },
    },

    //-----------------------------
    // OTP / VERIFICATION (optional)
    //-----------------------------

    verification: {
        startOtp: { type: String },
        endOtp: { type: String },
        isStartVerified: { type: Boolean, default: false },
        isEndVerified: { type: Boolean, default: false },
    },

    //-----------------------------
    // REVIEW & RATING
    //-----------------------------
    review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String },
        reviewedAt: { type: Date },
    },

    //-----------------------------
    // BOOKING TIMELINE LOGS
    //-----------------------------
    timeline: [{
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
    }, ],
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);