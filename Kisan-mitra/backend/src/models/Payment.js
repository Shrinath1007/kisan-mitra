const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    vacancy: { type: mongoose.Schema.Types.ObjectId, ref: "Vacancy" },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true },
    platformCommission: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["hold", "released", "failed", "refunded", "completed"],
      default: "hold",
    },
    paymentGatewayId: { type: String }, // From Razorpay, etc.
    paymentMethod: { type: String, enum: ["Razorpay", "UPI", "Cash"], default: "Razorpay" },
    upiId: { type: String }, // For UPI payments
    screenshot: { type: String }, // For payment proof
    payoutTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);