// ================== MODELS ==================
const Booking = require("../models/Booking");
const Machine = require("../models/Machine");
const Payment = require("../models/Payment");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Admin = require("../models/Admin");
const mongoose = require("mongoose");

// ================== 1) Create Booking ==================
exports.createBooking = async(req, res) => {
    try {
        console.log("createBooking: req.body", req.body);
        const { machineId, startTime, endTime, totalAmount } = req.body;

        // VALIDATION
        if (!machineId || !startTime || !endTime || !totalAmount) {
            return res.status(400).json({
                success: false,
                message: "Please enter all fields: machineId, startTime, endTime, totalAmount",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(machineId)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid machine ID" });
        }

        const machine = await Machine.findById(machineId);
        console.log("createBooking: machine", machine);
        if (!machine)
            return res
                .status(404)
                .json({ success: false, message: "Machine not found" });

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end)
            return res
                .status(400)
                .json({ success: false, message: "End time must be after start" });
        // if (start < new Date())
        //     return res
        //         .status(400)
        //         .json({ success: false, message: "Booking cannot be past time" });

        // CHECK TIME CONFLICTS
        const conflicts = await Booking.find({
            machine: machineId,
            $or: [
                { "date.startDate": { $lt: end, $gte: start } },
                { "date.endDate": { $gt: start, $lte: end } },
                { "date.startDate": { $lt: start }, "date.endDate": { $gt: end } },
            ],
            status: { $in: ["pending", "approved"] },
        });
        console.log("createBooking: conflicts", conflicts);

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Machine is already booked for that time",
            });
        }

        // SAVE BOOKING
        const booking = await Booking.create({
            owner: machine.owner,
            farmer: req.user._id,
            machine: machineId,
            date: {
                startDate: start,
                endDate: end,
            },
            totalAmount,
            status: "pending",
            paymentStatus: "unpaid",
        });

        res
            .status(201)
            .json({ success: true, message: "Booking created", booking });
    } catch (error) {
        console.error("createBooking error:", error);
        res.status(500).json({
            success: false,
            message: "Booking failed",
            error: error.message,
        });
    }
};

// ================== 2) SIMPLE UPI PAYMENT ==================
// When user clicks PAYMENT CONFIRM OK
exports.markBookingAsPaid = async(req, res) => {
    try {
        const { bookingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookingId))
            return res
                .status(400)
                .json({ success: false, message: "Invalid booking ID" });

        const booking = await Booking.findById(bookingId).populate("machine");
        if (!booking)
            return res
                .status(404)
                .json({ success: false, message: "Booking not found" });

        if (booking.paymentStatus === "paid")
            return res.json({ success: true, message: "Payment already completed" });

        // FIND ADMIN
        const admin = await Admin.findOne();
        if (!admin)
            return res
                .status(500)
                .json({ success: false, message: "Admin not found" });

        // SEPARATE PAYMENT SHARES
        const ADMIN_SHARE = booking.totalAmount * 0.1; // 10% commission
        const OWNER_SHARE = booking.totalAmount - ADMIN_SHARE;

        // NEW PAYMENT ENTRY
        const payment = await Payment.create({
            booking: booking._id,
            farmer: booking.farmer,
            recipient: booking.machine.owner,
            amount: booking.totalAmount,
            platformCommission: ADMIN_SHARE,
            status: "released", // no hold, auto release
        });

        // UPDATE ADMIN WALLET
        const adminWallet = await Wallet.findOneAndUpdate({ user: admin._id }, { $inc: { balance: ADMIN_SHARE } }, { new: true, upsert: true });

        // UPDATE OWNER WALLET
        const ownerWallet = await Wallet.findOneAndUpdate({ user: booking.machine.owner }, { $inc: { balance: OWNER_SHARE } }, { new: true, upsert: true });

        // TRANSACTION LOG
        await Transaction.create({
            toUser: booking.machine.owner,
            toWallet: ownerWallet._id,
            amount: OWNER_SHARE,
            type: "payout_release",
            status: "completed",
            payment: payment._id,
            description: "Machine owner payout",
        });

        booking.paymentStatus = "paid";
        booking.payment = payment._id;
        await booking.save();

        res.json({
            success: true,
            message: "UPI Payment Verified ✓ Money Sent Successfully",
            booking,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Payment failed",
            error: error.message,
        });
    }
};

// ================== REMAINING ORIGINAL CONTROLLERS (UNCHANGED) ==================

exports.getOwnerBookings = async (req, res) => {
    try {
        const ownerId = req.user._id;
        const { status, paymentStatus } = req.query;

        // Find all machines owned by the current user
        const machines = await Machine.find({ owner: ownerId }).select('_id');
        const machineIds = machines.map(m => m._id);

        // AUTO-UPDATE: Mark approved bookings as completed if end date has passed
        const currentDate = new Date();
        await Booking.updateMany(
            {
                machine: { $in: machineIds },
                status: 'approved',
                'date.endDate': { $lt: currentDate }
            },
            {
                $set: { status: 'completed' }
            }
        );

        let query = { machine: { $in: machineIds } };
        if (status) {
            query.status = status;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Find all bookings for those machines
        const bookings = await Booking.find(query)
            .populate('farmer', 'name email phone')
            .populate('machine', 'name model pricePerHour photos')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            bookings,
        });
    } catch (error) {
        console.error("Error in getOwnerBookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get owner bookings",
            error: error.message,
        });
    }
};
exports.getMachineBookings = async (req, res) => {
    try {
        const { machineId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(machineId)) {
            return res.status(400).json({ success: false, message: "Invalid machine ID" });
        }

        // Verify machine exists
        const machine = await Machine.findById(machineId);
        if (!machine) {
            return res.status(404).json({ success: false, message: "Machine not found" });
        }

        // Get all bookings for this machine (farmers can see to avoid conflicts)
        const bookings = await Booking.find({ machine: machineId })
            .populate('farmer', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, bookings });
    } catch (error) {
        console.error("Error in getMachineBookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get machine bookings",
            error: error.message,
        });
    }
};
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid booking ID" });
        }

        if (!['approved', 'rejected', 'completed', 'cancelled'].includes(status.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const booking = await Booking.findById(bookingId).populate('machine');

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // Check if the owner is updating the status of their machine's booking
        const machine = await Machine.findById(booking.machine);
        if (machine.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        // ================== REFUND ON REJECTION ==================
        if (status.toLowerCase() === 'rejected' && booking.paymentStatus === 'paid') {
            // Refund full amount back to farmer's wallet
            const farmerWallet = await Wallet.findOneAndUpdate(
                { user: booking.farmer },
                { $inc: { balance: booking.totalAmount } },
                { new: true, upsert: true }
            );

            // Log refund transaction
            await Transaction.create({
                fromUser: booking.machine.owner,
                toUser: booking.farmer,
                toWallet: farmerWallet._id,
                amount: booking.totalAmount,
                type: "refund",
                status: "completed",
                booking: booking._id,
                description: `Refund for rejected booking - ${booking.machine.name || 'Machine'}`,
            });

            // Mark payment as refunded
            booking.paymentStatus = "refunded";
        }
        // ================== END REFUND ==================
        
        if (status.toLowerCase() === 'completed') {
            if (booking.paymentStatus !== "paid") {
                const admin = await Admin.findOne();
                if (!admin) {
                    return res.status(500).json({ success: false, message: "Admin not found" });
                }

                const ADMIN_SHARE = booking.totalAmount * 0.1;
                const OWNER_SHARE = booking.totalAmount - ADMIN_SHARE;

                const payment = await Payment.create({
                    booking: booking._id,
                    farmer: booking.farmer,
                    recipient: booking.machine.owner,
                    amount: booking.totalAmount,
                    platformCommission: ADMIN_SHARE,
                    status: "released",
                });

                const adminWallet = await Wallet.findOneAndUpdate({ user: admin._id }, { $inc: { balance: ADMIN_SHARE } }, { new: true, upsert: true });
                const ownerWallet = await Wallet.findOneAndUpdate({ user: booking.machine.owner }, { $inc: { balance: OWNER_SHARE } }, { new: true, upsert: true });

                await Transaction.create({
                    toUser: booking.machine.owner,
                    toWallet: ownerWallet._id,
                    amount: OWNER_SHARE,
                    type: "payout_release",
                    status: "completed",
                    payment: payment._id,
                    description: "Machine owner payout",
                });

                booking.paymentStatus = "paid";
                booking.payment = payment._id;
            }
        }

        booking.status = status.toLowerCase();
        await booking.save();

        res.status(200).json({ success: true, message: "Booking status updated", booking });
    } catch (error) {
        console.error("Error in updateBookingStatus:", error);
        res.status(500).json({
            success: false,
            message: "Backend error: " + error.message,
            error: error.message,
        });
    }
};
exports.getOwnerBookingStats = async (req, res) => {
    try {
        const ownerId = req.user._id;

        const machines = await Machine.find({ owner: ownerId }).select('_id');
        const machineIds = machines.map(m => m._id);

        const totalBookings = await Booking.countDocuments({ machine: { $in: machineIds } });
        const pending = await Booking.countDocuments({ machine: { $in: machineIds }, status: 'pending' });
        const approved = await Booking.countDocuments({ machine: { $in: machineIds }, status: 'approved' });
        const completed = await Booking.countDocuments({ machine: { $in: machineIds }, status: 'completed' });

        const earnings = await Booking.aggregate([
            { $match: { machine: { $in: machineIds }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalEarnings = earnings.length > 0 ? earnings[0].total : 0;
        const ownerShare = totalEarnings * 0.9; // Assuming 10% commission

        res.status(200).json({
            success: true,
            stats: {
                totalBookings,
                pending,
                approved,
                completed,
                totalRevenue: ownerShare,
            }
        });
    } catch (error) {
        console.error("Error in getOwnerBookingStats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get booking stats",
            error: error.message,
        });
    }
};
exports.getMyBookings = async (req, res) => {
    try {
        const farmerId = req.user._id;

        const bookings = await Booking.find({ farmer: farmerId })
            .populate('machine', 'name model type pricePerHour photos owner')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            bookings,
        });
    } catch (error) {
        console.error("Error in getMyBookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get your bookings",
            error: error.message,
        });
    }
};

// ================== RATING & REVIEW CONTROLLERS ==================

exports.submitReview = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { rating, comment } = req.body;
        const farmerId = req.user._id;

        // Validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        // Find booking
        const booking = await Booking.findById(bookingId).populate('machine');
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if farmer owns this booking
        if (booking.farmer.toString() !== farmerId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only review your own bookings"
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: "You can only review completed bookings"
            });
        }

        // Check if already reviewed
        if (booking.review && booking.review.rating) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this booking"
            });
        }

        // Add review
        booking.review = {
            rating: parseInt(rating),
            comment: comment || "",
            reviewedAt: new Date()
        };

        await booking.save();

        res.status(200).json({
            success: true,
            message: "Review submitted successfully",
            review: booking.review
        });

    } catch (error) {
        console.error("Error in submitReview:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit review",
            error: error.message
        });
    }
};

exports.getOwnerRatings = async (req, res) => {
    try {
        const ownerId = req.user._id;

        // Find all machines owned by the current user
        const machines = await Machine.find({ owner: ownerId }).select('_id name model');
        const machineIds = machines.map(m => m._id);

        // Find all completed bookings with reviews for owner's machines
        const bookingsWithReviews = await Booking.find({
            machine: { $in: machineIds },
            status: 'completed',
            'review.rating': { $exists: true, $ne: null }
        })
        .populate('farmer', 'name')
        .populate('machine', 'name model')
        .sort({ 'review.reviewedAt': -1 });

        // Calculate overall statistics
        const totalReviews = bookingsWithReviews.length;
        let totalRating = 0;
        
        const reviews = bookingsWithReviews.map(booking => {
            totalRating += booking.review.rating;
            return {
                id: booking._id,
                farmerName: booking.farmer.name,
                machineName: `${booking.machine.name} - ${booking.machine.model}`,
                rating: booking.review.rating,
                comment: booking.review.comment || "",
                date: booking.review.reviewedAt,
                bookingDate: booking.date
            };
        });

        const averageRating = totalReviews > 0 ? (totalRating / totalReviews) : 0;

        // Rating distribution
        const ratingDistribution = {
            5: bookingsWithReviews.filter(b => b.review.rating === 5).length,
            4: bookingsWithReviews.filter(b => b.review.rating === 4).length,
            3: bookingsWithReviews.filter(b => b.review.rating === 3).length,
            2: bookingsWithReviews.filter(b => b.review.rating === 2).length,
            1: bookingsWithReviews.filter(b => b.review.rating === 1).length,
        };

        res.status(200).json({
            success: true,
            data: {
                averageRating: parseFloat(averageRating.toFixed(1)),
                totalReviews,
                ratingDistribution,
                reviews
            }
        });

    } catch (error) {
        console.error("Error in getOwnerRatings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get ratings",
            error: error.message
        });
    }
};