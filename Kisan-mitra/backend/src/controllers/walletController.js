const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Admin = require("../models/Admin");
const mongoose = require("mongoose");

// @desc    Get user wallet (all roles)
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        user: req.user._id,
        balance: 0,
        heldBalance: 0,
        totalWithdrawn: 0,
      });
    }

    res.status(200).json({ success: true, data: wallet });
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Pay for a booking using wallet balance
// @route   POST /api/wallet/pay/:bookingId
// @access  Private (Farmer)
exports.payWithWallet = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(bookingId).populate("machine");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Ensure this farmer owns the booking
    if (booking.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (booking.paymentStatus === "paid") {
      return res.json({ success: true, message: "Already paid" });
    }

    // Get farmer wallet
    const farmerWallet = await Wallet.findOne({ user: req.user._id });
    if (!farmerWallet || farmerWallet.balance < booking.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Required: ₹${booking.totalAmount}, Available: ₹${farmerWallet?.balance || 0}`,
      });
    }

    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(500).json({ success: false, message: "Admin not found" });
    }

    const ADMIN_SHARE = booking.totalAmount * 0.1;
    const OWNER_SHARE = booking.totalAmount - ADMIN_SHARE;

    // Deduct from farmer wallet
    await Wallet.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { balance: -booking.totalAmount } }
    );

    // Credit admin wallet
    await Wallet.findOneAndUpdate(
      { user: admin._id },
      { $inc: { balance: ADMIN_SHARE } },
      { upsert: true }
    );

    // Credit owner wallet
    const ownerWallet = await Wallet.findOneAndUpdate(
      { user: booking.machine.owner },
      { $inc: { balance: OWNER_SHARE } },
      { new: true, upsert: true }
    );

    // Create payment record
    const payment = await Payment.create({
      booking: booking._id,
      farmer: booking.farmer,
      recipient: booking.machine.owner,
      amount: booking.totalAmount,
      platformCommission: ADMIN_SHARE,
      status: "released",
    });

    // Log transaction
    await Transaction.create({
      fromUser: req.user._id,
      toUser: booking.machine.owner,
      toWallet: ownerWallet._id,
      amount: booking.totalAmount,
      type: "booking_payment",
      status: "completed",
      booking: booking._id,
      payment: payment._id,
      description: "Booking paid via wallet",
    });

    booking.paymentStatus = "paid";
    booking.payment = payment._id;
    await booking.save();

    res.json({
      success: true,
      message: "Payment successful via wallet",
      booking,
      walletBalance: farmerWallet.balance - booking.totalAmount,
    });
  } catch (error) {
    console.error("Wallet pay error:", error);
    res.status(500).json({ success: false, message: "Payment failed", error: error.message });
  }
};
