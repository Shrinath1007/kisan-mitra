const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const bookingController = require("../controllers/bookingController");

// ================= MIDDLEWARE =================
router.use(auth.protect); // All routes require login

// ================= FARMER ROUTES =================

// Create booking (Farmer)
router.post("/create", role(["farmer"]), bookingController.createBooking);

// Confirm Manual UPI Payment
router.post(
    "/pay/:bookingId",
    role(["farmer"]),
    bookingController.markBookingAsPaid
);

// Get farmer booking history
router.get("/history", role(["farmer"]), bookingController.getMyBookings);

// ================= OWNER ROUTES =================

// Get all bookings for owner's machines
router.get("/owner", role(["owner"]), bookingController.getOwnerBookings);

// Get booking statistics for owner dashboard + earnings
router.get(
    "/owner/stats",
    role(["owner"]),
    bookingController.getOwnerBookingStats
);

// Get bookings only for one machine (Owner and Farmer can view)
router.get(
    "/machine/:machineId",
    role(["owner", "farmer"]),
    bookingController.getMachineBookings
);

// Update booking status (Approve/Reject/Complete)
router.put(
    "/:bookingId/status",
    role(["owner"]),
    bookingController.updateBookingStatus
);

// ================= RATING & REVIEW ROUTES =================

// Submit rating/review (Farmer only, after completed booking)
router.post(
    "/:bookingId/review",
    role(["farmer"]),
    bookingController.submitReview
);

// Get ratings for owner's machines
router.get(
    "/owner/ratings",
    role(["owner"]),
    bookingController.getOwnerRatings
);

module.exports = router;