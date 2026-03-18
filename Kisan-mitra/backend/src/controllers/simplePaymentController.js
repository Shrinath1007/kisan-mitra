const Payment = require("../models/Payment");
const Wallet = require("../models/Wallet");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Vacancy = require("../models/Vacancy");
const Transaction = require("../models/Transaction");

exports.createVacancyUPIPayment = async (req, res) => {
  try {
    const { vacancyId, amount, upiId } = req.body;
    
    if (!upiId || !upiId.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "UPI ID is required" 
      });
    }

    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return res.status(404).json({ 
        success: false, 
        message: "Vacancy not found" 
      });
    }

    // Fixed platform fee
    const PLATFORM_FEE = 50;
    if (amount !== PLATFORM_FEE) {
      return res.status(400).json({ 
        success: false, 
        message: `Platform fee must be ₹${PLATFORM_FEE}` 
      });
    }

    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: "Admin user not found" 
      });
    }

    // Update admin wallet
    let wallet = await Wallet.findOneAndUpdate(
      { user: admin._id },
      { $inc: { balance: PLATFORM_FEE } },
      { new: true, upsert: true }
    );

    // Create payment record
    const payment = await Payment.create({
      vacancy: vacancyId,
      farmer: req.user._id,
      recipient: admin._id,
      amount: PLATFORM_FEE,
      platformCommission: PLATFORM_FEE,
      status: "completed",
      paymentMethod: "UPI",
      upiId: upiId
    });

    // Create transaction record
    await Transaction.create({
      fromUser: req.user._id,
      toUser: admin._id,
      toWallet: wallet._id,
      amount: PLATFORM_FEE,
      type: "platform_fee",
      status: "completed",
      payment: payment._id,
      description: `Vacancy posting fee for: ${vacancy.title}`
    });

    // Update vacancy status
    vacancy.paymentStatus = "paid";
    vacancy.status = "open"; // Activate the vacancy
    vacancy.payment = payment._id;
    await vacancy.save();

    return res.json({
      success: true,
      message: "Payment successful! Your vacancy is now active and visible to workers.",
      payment,
      vacancy: {
        id: vacancy._id,
        title: vacancy.title,
        status: vacancy.status,
        paymentStatus: vacancy.paymentStatus
      }
    });
  } catch (err) {
    console.error("UPI Vacancy Payment Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Payment processing failed. Please try again." 
    });
  }
};

exports.createUPIPayment = async (req, res) => {
  try {
    const { bookingId, amount, screenshot } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking Not Found" });

    // (100% goes to admin wallet — no commission for now)
    let admin = await User.findOne({ role: "admin" });
    let wallet = await Wallet.findOneAndUpdate(
      { user: admin._id },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    // Create payment record
    const payment = await Payment.create({
      booking: bookingId,
      farmer: req.user._id,
      recipient: admin._id,
      amount,
      status: "released",
      screenshot,
    });

    booking.paymentStatus = "Paid";
    await booking.save();

    return res.json({
      success: true,
      message: "UPI Payment Recorded Successfully",
      payment,
      wallet,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Payment Failed" });
  }
};

exports.getAllPaymentsAdmin = async (req, res) => {
  const data = await Payment.find().populate("farmer", "name email");
  res.json(data);
};

exports.getAdminWallet = async (req, res) => {
  const admin = await User.findOne({ role: "admin" });
  const wallet = await Wallet.findOne({ user: admin._id });
  res.json(wallet || { balance: 0 });
};

exports.getMyPayments = async (req, res) => {
  const payments = await Payment.find({ farmer: req.user._id });
  res.json(payments);
};
