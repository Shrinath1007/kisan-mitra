// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const payment = require("../controllers/paymentController");

// Test endpoint (no auth required for debugging)
router.get("/test", (req, res) => {
    res.json({ 
        message: "Payment routes working", 
        timestamp: new Date().toISOString(),
        razorpayConfigured: !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET
    });
});

// All other payment routes require authentication
router.use(auth.protect);

// Create payment order for booking (optional duplicate)
router.post("/order/:bookingId", payment.createPaymentOrder);

// Verify payment
router.post("/verify", payment.verifyPayment);

// Create payment order for vacancy
router.post("/order/vacancy", payment.createVacancyPaymentOrder);

// Get payment status
router.get("/status/:bookingId", payment.getPaymentStatus);

module.exports = router;
