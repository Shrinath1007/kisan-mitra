// src/controllers/adminController.js
const User = require("../models/User");
const Admin = require("../models/Admin");
const Machine = require("../models/Machine");
const Payment = require("../models/Payment"); // ✅ for commission / earnings
const Wallet = require("../models/Wallet"); // ✅ for admin wallet
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/* ============= TOKEN GENERATOR ============= */
const generateToken = (id) =>
    jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

/* ============= ADMIN LOGIN (DB BASED) ============= */
exports.adminLogin = async(req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res
                .status(401)
                .json({ success: false, message: "Admin Not Found" });
        }

        const match = await bcrypt.compare(password, admin.passwordHash);
        if (!match) {
            return res
                .status(401)
                .json({ success: false, message: "Wrong Password" });
        }

        return res.json({
            success: true,
            token: generateToken(admin._id),
            admin: { 
                id: admin._id, 
                email: admin.email, 
                name: admin.name,
                role: "admin" // Add the role field
            },
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: err.message,
        });
    }
};

/* ============= FARMERS PANEL ============= */
exports.getFarmers = async(req, res) => {
    try {
        const farmers = await User.find({ role: "farmer" }).select("-passwordHash");
        res.json({ farmers });
    } catch (err) {
        res.status(500).json({ message: "Failed to load farmers" });
    }
};

exports.deleteFarmer = async(req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Farmer Removed" });
    } catch (err) {
        res.status(500).json({ message: "Delete Failed" });
    }
};

/* ============= MACHINES PANEL ============= */
exports.getMachines = async(req, res) => {
    try {
        const machines = await Machine.find().populate("owner", "name phone");
        res.json({ machines });
    } catch (err) {
        res.status(500).json({ message: "Machines Fetch Failed" });
    }
};

exports.deleteMachine = async(req, res) => {
    try {
        await Machine.findByIdAndDelete(req.params.id);
        res.json({ message: "Machine Deleted" });
    } catch (err) {
        res.status(500).json({ message: "Delete Failed" });
    }
};

/* ============= LABOURS PANEL ============= */
exports.getLabours = async(req, res) => {
    try {
        const labours = await User.find({ role: "labour" }).select("-passwordHash");
        res.json({ labours });
    } catch (err) {
        res.status(500).json({ message: "Labour Fetch Failed" });
    }
};

exports.deleteLabour = async(req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Labour Removed" });
    } catch (err) {
        res.status(500).json({ message: "Delete Failed" });
    }
};

/* =========================================================
   💰 ADMIN WALLET  (TOTAL PLATFORM COMMISSION)
   ========================================================= */
// @route  GET /api/admin/wallet
// @access Admin (JWT + role = admin)
exports.getAdminWallet = async(req, res) => {
    try {
        // Get admin user - check both Admin model and User model with admin role
        let adminUser = await Admin.findOne({});
        if (!adminUser) {
            adminUser = await User.findOne({ role: 'admin' });
        }
        
        if (!adminUser) {
            return res.status(404).json({ 
                success: false, 
                message: "Admin user not found" 
            });
        }

        // Get or create admin wallet
        let wallet = await Wallet.findOne({ user: adminUser._id });
        if (!wallet) {
            wallet = await Wallet.create({ 
                user: adminUser._id, 
                balance: 0,
                heldBalance: 0,
                totalWithdrawn: 0
            });
        }

        // Also calculate total commission from all completed payments as backup
        const commissionAgg = await Payment.aggregate([
            { $match: { status: { $in: ["released", "completed"] } } },
            {
                $group: {
                    _id: null,
                    totalCommission: { $sum: "$platformCommission" },
                },
            },
        ]);

        const totalCommissionFromPayments = commissionAgg.length ? commissionAgg[0].totalCommission : 0;

        // Return wallet data with additional commission info
        res.json({ 
            success: true,
            data: {
                balance: wallet.balance,
                heldBalance: wallet.heldBalance,
                totalWithdrawn: wallet.totalWithdrawn,
                totalCommissionFromPayments: totalCommissionFromPayments,
                user: adminUser._id,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt
            }
        });
    } catch (err) {
        console.error("getAdminWallet error:", err);
        res.status(500).json({ 
            success: false, 
            message: "Failed to load wallet",
            error: err.message 
        });
    }
};

/* =========================================================
   📈 EARNINGS STATS  (DAILY / WEEKLY / MONTHLY)
   ========================================================= */
// @route  GET /api/admin/earnings
// @access Admin
exports.getAdminEarnings = async(req, res) => {
    try {
        const now = new Date();

        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [dailyAgg, weeklyAgg, monthlyAgg] = await Promise.all([
            Payment.aggregate([{
                    $match: {
                        status: "released",
                        createdAt: { $gte: startOfToday },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$platformCommission" },
                    },
                },
            ]),
            Payment.aggregate([{
                    $match: {
                        status: "released",
                        createdAt: { $gte: sevenDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$platformCommission" },
                    },
                },
            ]),
            Payment.aggregate([{
                    $match: {
                        status: "released",
                        createdAt: { $gte: thirtyDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$platformCommission" },
                    },
                },
            ]),
        ]);

        res.json({
            daily: (dailyAgg[0] && dailyAgg[0].total) || 0,
            weekly: (weeklyAgg[0] && weeklyAgg[0].total) || 0,
            monthly: (monthlyAgg[0] && monthlyAgg[0].total) || 0,
        });
    } catch (err) {
        console.error("getAdminEarnings error:", err);
        res.status(500).json({ message: "Failed to load earnings" });
    }
};