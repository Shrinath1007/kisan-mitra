const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const Vacancy = require("../models/Vacancy"); // Import Vacancy model
const Payment = require("../models/Payment");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Admin = require("../models/Admin");

// Initialize Razorpay with error handling
let razorpay;
let isDevelopmentMode = false;

try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
        process.env.RAZORPAY_KEY_SECRET !== 'your_real_key_secret_here' &&
        process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_key_secret_placeholder' &&
        process.env.RAZORPAY_KEY_SECRET !== 'your_actual_razorpay_key_secret_here') {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        console.log("✅ Razorpay initialized successfully");
    } else {
        isDevelopmentMode = true;
        console.warn("⚠️ Razorpay credentials not configured - Running in DEVELOPMENT MODE");
        console.log("📝 To enable real payments, set proper RAZORPAY_KEY_SECRET in .env file");
    }
} catch (error) {
    isDevelopmentMode = true;
    console.error("❌ Failed to initialize Razorpay:", error);
    console.log("🔄 Falling back to DEVELOPMENT MODE");
}

// ... (existing user-facing functions: createPaymentOrder, verifyPayment, getPaymentStatus)

exports.createPaymentOrder = async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        console.log(`🔄 Creating payment order for booking: ${bookingId}`);
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.error(`❌ Booking not found: ${bookingId}`);
            return res.status(404).json({ message: "Booking not found" });
        }

        console.log(`📋 Booking found - Amount: ₹${booking.totalAmount}`);

        // Check if Razorpay is initialized
        if (!razorpay || isDevelopmentMode) {
            console.log("🔧 Running in DEVELOPMENT MODE - creating mock order");
            
            // For development: create a mock order
            const mockOrder = {
                id: `order_mock_${Date.now()}`,
                amount: Number(booking.totalAmount) * 100,
                currency: "INR",
                receipt: bookingId,
                status: "created"
            };

            booking.paymentOrderId = mockOrder.id;
            await booking.save();

            console.log(`✅ Mock order created: ${mockOrder.id}`);

            return res.json({ 
                order: mockOrder,
                isDevelopmentMode: true,
                message: "Development mode: Using mock payment system"
            });
        }

        console.log("💳 Creating real Razorpay order");
        
        const order = await razorpay.orders.create({
            amount: Number(booking.totalAmount) * 100,
            currency: "INR",
            receipt: bookingId,
            payment_capture: 1,
        });

        booking.paymentOrderId = order.id;
        await booking.save();

        console.log(`✅ Razorpay order created: ${order.id}`);

        return res.json({ order });
    } catch (err) {
        console.error("❌ Create Order Error:", err);
        return res
            .status(500)
            .json({ message: "Failed to create payment order", error: err.message });
    }
};

exports.createVacancyPaymentOrder = async (req, res) => {
    try {
        const { vacancyId } = req.body;
        
        // Check if Razorpay credentials are configured
        if (!razorpay) {
            console.error("Razorpay not initialized - credentials not properly configured");
            return res.status(500).json({ 
                message: "Payment gateway not configured. Please contact administrator.",
                error: "Razorpay credentials missing or invalid"
            });
        }

        const vacancy = await Vacancy.findById(vacancyId);
        if (!vacancy) return res.status(404).json({ message: "Vacancy not found" });

        // Platform fee: Fixed ₹50 for posting a vacancy
        const PLATFORM_FEE = 50;

        const order = await razorpay.orders.create({
            amount: Number(PLATFORM_FEE) * 100, // Convert to paise
            currency: "INR",
            receipt: vacancyId,
            payment_capture: 1,
            notes: {
                type: "vacancy_posting_fee",
                vacancyId: vacancyId,
                farmerId: vacancy.postedBy.toString()
            }
        });

        vacancy.paymentOrderId = order.id;
        await vacancy.save();

        return res.json({ 
            order,
            platformFee: PLATFORM_FEE,
            message: "Pay ₹50 platform fee to activate your vacancy posting"
        });
    } catch (err) {
        console.error("Create Vacancy Order Error:", err);
        return res
            .status(500)
            .json({ message: "Failed to create vacancy payment order", error: err.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId,
            vacancyId,
            type, // 'booking' or 'vacancy'
        } = req.body;

        console.log(`🔄 Verifying payment - Type: ${type}, Order ID: ${razorpay_order_id}`);

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error("❌ Missing payment fields");
            return res.status(400).json({ message: "Missing required payment fields" });
        }

        // Check if this is a development mode payment (mock order)
        const isDevelopmentPayment = razorpay_order_id.startsWith('order_mock_') || 
                                   razorpay_payment_id.startsWith('pay_mock_');

        if (isDevelopmentPayment) {
            console.log("🔧 Processing DEVELOPMENT MODE payment");
        }

        if (!isDevelopmentPayment && razorpay && !isDevelopmentMode) {
            console.log("💳 Verifying real Razorpay signature");
            // Real Razorpay signature verification
            const sign = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(sign)
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                console.error("❌ Invalid Razorpay signature");
                return res.status(400).json({ message: "Invalid signature" });
            }
            console.log("✅ Razorpay signature verified");
        } else if (!isDevelopmentPayment) {
            console.log("⚠️ Skipping signature verification - Development mode");
        }

        if (type === 'booking') {
            if (!bookingId) {
                console.error("❌ Missing bookingId");
                return res.status(400).json({ message: "Missing bookingId" });
            }

            console.log(`📋 Processing booking payment: ${bookingId}`);

            const booking = await Booking.findById(bookingId).populate('machine');
            if (!booking) {
                console.error(`❌ Booking not found: ${bookingId}`);
                return res.status(404).json({ message: "Booking not found" });
            }

            // Assuming a commission of 10% for now
            const PLATFORM_COMMISSION_RATE = 0.10;
            const commission = booking.totalAmount * PLATFORM_COMMISSION_RATE;
            const amountToRecipient = booking.totalAmount - commission;

            console.log(`💰 Payment breakdown - Total: ₹${booking.totalAmount}, Commission: ₹${commission}, To recipient: ₹${amountToRecipient}`);

            const recipientId = booking.machine ? booking.machine.owner : booking.labour;

            const payment = new Payment({
                booking: bookingId,
                farmer: booking.farmer,
                recipient: recipientId,
                amount: booking.totalAmount,
                platformCommission: commission,
                status: 'hold',
                paymentGatewayId: razorpay_payment_id,
            });
            await payment.save();

            booking.paymentStatus = "paid";
            booking.payment = payment._id;
            await booking.save();

            console.log(`✅ Payment record created: ${payment._id}`);

            // Find admin and update their wallet - check both Admin model and User model
            let adminUser = await Admin.findOne({});
            if (!adminUser) {
                adminUser = await User.findOne({ role: 'admin' });
            }
            
            if (adminUser) {
                const adminWallet = await Wallet.findOneAndUpdate({ user: adminUser._id }, { $inc: { balance: commission, heldBalance: amountToRecipient } }, { upsert: true, new: true });
                // Log commission transaction
                await Transaction.create({
                    toUser: adminUser._id,
                    toWallet: adminWallet._id,
                    amount: commission,
                    type: 'commission',
                    status: 'completed',
                    payment: payment._id,
                    description: isDevelopmentPayment ? 'Platform commission from booking (Development Mode)' : 'Platform commission from booking.'
                });
                console.log(`💳 Admin wallet updated - Commission: ₹${commission}`);
            } else {
                console.warn("⚠️ Admin user not found - wallet not updated");
            }

            console.log("✅ Booking payment verification completed");

            return res.json({ 
                message: isDevelopmentPayment ? 
                    "Development payment verified and processed for booking" : 
                    "Payment verified and processed for booking", 
                booking,
                isDevelopmentMode: isDevelopmentPayment
            });

        } else if (type === 'vacancy') {
            // ... (vacancy payment logic remains the same)
            if (!vacancyId) return res.status(400).json({ message: "Missing vacancyId" });

            const vacancy = await Vacancy.findById(vacancyId);
            if (!vacancy) return res.status(404).json({ message: "Vacancy not found" });

            const PLATFORM_FEE = 50; // Must match the amount in createVacancyPaymentOrder

            const payment = new Payment({
                vacancy: vacancyId,
                farmer: vacancy.postedBy,
                amount: PLATFORM_FEE,
                platformCommission: PLATFORM_FEE, // The entire fee is commission
                status: 'completed', // Vacancy posting fee is not held
                paymentGatewayId: razorpay_payment_id,
            });
            await payment.save();

            vacancy.paymentStatus = "paid";
            vacancy.status = "open"; // Activate the vacancy
            vacancy.payment = payment._id;
            await vacancy.save();

            // Find admin and update their wallet - check both Admin model and User model
            let adminUser = await Admin.findOne({});
            if (!adminUser) {
                adminUser = await User.findOne({ role: 'admin' });
            }
            
            if (adminUser) {
                const adminWallet = await Wallet.findOneAndUpdate(
                    { user: adminUser._id }, 
                    { $inc: { balance: PLATFORM_FEE } }, 
                    { upsert: true, new: true }
                );
                
                // Log commission transaction
                await Transaction.create({
                    toUser: adminUser._id,
                    toWallet: adminWallet._id,
                    amount: PLATFORM_FEE,
                    type: 'commission',
                    status: 'completed',
                    payment: payment._id,
                    description: isDevelopmentPayment ? 
                        `Vacancy posting fee for: ${vacancy.title} (Development Mode)` :
                        `Vacancy posting fee for: ${vacancy.title}`
                });
            }

            return res.json({ 
                message: isDevelopmentPayment ?
                    "Development payment verified! Your vacancy is now active and visible to workers." :
                    "Payment verified! Your vacancy is now active and visible to workers.",
                vacancy,
                platformFee: PLATFORM_FEE,
                isDevelopmentMode: isDevelopmentPayment
            });

        } else {
            console.error(`❌ Invalid payment type: ${type}`);
            return res.status(400).json({ message: "Invalid payment type" });
        }

    } catch (err) {
        console.error("❌ Verify Payment Error:", err);
        return res
            .status(500)
            .json({ message: "Payment verification failed", error: err.message });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!bookingId)
            return res.status(400).json({ message: "bookingId required" });

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        return res.json({ status: booking.paymentStatus || "unpaid", booking });
    } catch (err) {
        console.error("Payment Status Error:", err);
        return res
            .status(500)
            .json({ message: "Failed to get payment status", error: err.message });
    }
};


// ===============================================
// ADMIN PAYMENT CONTROLLERS
// ===============================================

// @desc    Get all payments currently on hold
// @route   GET /api/admin/payments/incoming
// @access  Private/Admin
exports.getIncomingPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ status: 'hold' })
            .populate('farmer', 'name email')
            .populate('recipient', 'name email');
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Release a payment to a machine owner or labour
// @route   POST /api/admin/payments/release/:id
// @access  Private/Admin
exports.releasePayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment || payment.status !== 'hold') {
            return res.status(404).json({ message: 'Payment not found or already processed.' });
        }

        // Find admin user - check both Admin model and User model
        let adminUser = await Admin.findOne({});
        if (!adminUser) {
            adminUser = await User.findOne({ role: 'admin' });
        }
        
        const adminWallet = await Wallet.findOne({ user: adminUser._id });
        const recipientWallet = await Wallet.findOneAndUpdate(
            { user: payment.recipient },
            { $inc: { balance: payment.amount - payment.platformCommission } },
            { upsert: true, new: true }
        );

        if (adminWallet.heldBalance < (payment.amount - payment.platformCommission)) {
            return res.status(400).json({ message: 'Insufficient funds in admin holding wallet.'});
        }

        adminWallet.heldBalance -= (payment.amount - payment.platformCommission);
        await adminWallet.save();

        payment.status = 'released';
        
        const transaction = await Transaction.create({
            fromUser: adminUser._id,
            toUser: payment.recipient,
            fromWallet: adminWallet._id,
            toWallet: recipientWallet._id,
            amount: payment.amount - payment.platformCommission,
            type: 'payout_release',
            status: 'completed',
            payment: payment._id,
            description: 'Payout to service provider.'
        });

        payment.payoutTransaction = transaction._id;
        await payment.save();

        res.json({ message: 'Payment released successfully.', payment });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get admin's wallet details
// @route   GET /api/admin/wallet
// @access  Private/Admin
exports.getAdminWallet = async (req, res) => {
    try {
        // Find admin user - check both Admin model and User model
        let adminUser = await Admin.findOne({});
        if (!adminUser) {
            adminUser = await User.findOne({ role: 'admin' });
        }
        
        const wallet = await Wallet.findOne({ user: adminUser._id });
        if (!wallet) {
            return res.status(404).json({ message: 'Admin wallet not found.' });
        }
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Dummy withdrawal from admin wallet
// @route   POST /api/admin/wallet/withdraw
// @access  Private/Admin
exports.withdrawFromAdminWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid withdrawal amount.' });
        }

        // Find admin user - check both Admin model and User model
        let adminUser = await Admin.findOne({});
        if (!adminUser) {
            adminUser = await User.findOne({ role: 'admin' });
        }
        
        const wallet = await Wallet.findOne({ user: adminUser._id });

        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance.' });
        }

        wallet.balance -= amount;
        wallet.totalWithdrawn += amount;
        await wallet.save();

        await Transaction.create({
            fromUser: adminUser._id,
            fromWallet: wallet._id,
            amount: amount,
            type: 'withdrawal',
            status: 'completed',
            description: 'Admin withdrawal.'
        });

        res.json({ message: 'Withdrawal successful.', wallet });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all transactions
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('fromUser', 'name email')
            .populate('toUser', 'name email')
            .sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};