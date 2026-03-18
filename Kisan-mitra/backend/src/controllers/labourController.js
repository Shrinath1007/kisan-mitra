const Vacancy = require("../models/Vacancy");
const User = require("../models/User");
const WorkHistory = require("../models/WorkHistory");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const Payment = require("../models/Payment");
const availabilityCalculator = require("../services/availabilityCalculator");


exports.getLabourProfile = async(req, res) => {
    try {
        const labour = await User.findById(req.user.id).select("-password");
        if (!labour) {
            return res.status(404).json({ message: "Labour not found" });
        }

        // Calculate dynamic availability
        const availabilityData = await availabilityCalculator.calculateAvailability(req.user.id);
        
        // Create enhanced profile with calculated availability
        const enhancedProfile = {
            ...labour.toObject(),
            calculatedAvailability: {
                isAvailable: availabilityData.isAvailable,
                reason: availabilityData.reason,
                workSchedule: availabilityData.workSchedule,
                nextAvailableDate: availabilityData.nextAvailableDate,
                lastCalculated: new Date()
            }
        };

        // If user has manual override, respect it but still provide calculated data
        if (labour.manualOverride !== undefined && labour.manualOverride === true) {
            enhancedProfile.availability = labour.manualStatus || false;
            enhancedProfile.calculatedAvailability.manualOverride = true;
            enhancedProfile.calculatedAvailability.manualStatus = labour.manualStatus;
        } else {
            // Use calculated availability
            enhancedProfile.availability = availabilityData.isAvailable;
        }

        res.json(enhancedProfile);
    } catch (err) {
        console.error("Get labour profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateLabourProfile = async(req, res) => {
    try {
        const { name, skills, availability, expectedRate, manualOverride, manualStatus } = req.body;
        
        const updateData = { name, skills, expectedRate };
        
        // Handle manual override
        if (manualOverride !== undefined) {
            updateData.manualOverride = manualOverride;
            if (manualOverride && manualStatus !== undefined) {
                updateData.manualStatus = manualStatus;
            }
        } else if (availability !== undefined) {
            // Legacy support - if availability is provided without manual override, treat as manual override
            updateData.manualOverride = true;
            updateData.manualStatus = availability;
        }

        const updatedLabour = await User.findByIdAndUpdate(
            req.user.id, 
            updateData, 
            { new: true }
        ).select("-password");
        
        if (!updatedLabour) {
            return res.status(404).json({ message: "Labour not found" });
        }

        // Calculate dynamic availability for the response
        const availabilityData = await availabilityCalculator.calculateAvailability(req.user.id);
        
        // Create enhanced profile with calculated availability
        const enhancedProfile = {
            ...updatedLabour.toObject(),
            calculatedAvailability: {
                isAvailable: availabilityData.isAvailable,
                reason: availabilityData.reason,
                workSchedule: availabilityData.workSchedule,
                nextAvailableDate: availabilityData.nextAvailableDate,
                lastCalculated: new Date()
            }
        };

        // Apply manual override if active
        if (updatedLabour.manualOverride === true) {
            enhancedProfile.availability = updatedLabour.manualStatus || false;
            enhancedProfile.calculatedAvailability.manualOverride = true;
            enhancedProfile.calculatedAvailability.manualStatus = updatedLabour.manualStatus;
        } else {
            enhancedProfile.availability = availabilityData.isAvailable;
        }

        res.json(enhancedProfile);
    } catch (err) {
        console.error("Update labour profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getWorkHistory = async(req, res) => {
    try {
        const workHistory = await WorkHistory.find({ labour: req.user.id })
            .populate("farmer", "name")
            .populate("vacancy");
        res.json({ history: workHistory });
    } catch (err) {
        console.error("Get work history error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getVacancies = async(req, res) => {
    try {
        const currentDate = new Date();
        
        const vacancies = await Vacancy.find({
                status: { $ne: "cancelled" },
            })
            .populate("postedBy", "name phone")
            .sort({ createdAt: -1 });

        // Add expiration logic to each vacancy
        const vacanciesWithExpiration = vacancies.map(vacancy => {
            const vacancyObj = vacancy.toObject();
            
            // Check if job is expired based on start date only
            if (vacancyObj.startDate) {
                const startDate = new Date(vacancyObj.startDate);
                const gracePeriodEnd = new Date(startDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days grace period after start date
                
                vacancyObj.expirationDate = startDate;
                vacancyObj.isExpired = currentDate > startDate;
                vacancyObj.isInGracePeriod = currentDate > startDate && currentDate <= gracePeriodEnd;
                vacancyObj.shouldHide = currentDate > gracePeriodEnd;
                
                // Calculate days until expiration (start date)
                const timeDiff = startDate.getTime() - currentDate.getTime();
                vacancyObj.daysUntilExpiration = Math.ceil(timeDiff / (1000 * 3600 * 24));
            } else {
                // Handle missing dates
                vacancyObj.expirationDate = null;
                vacancyObj.isExpired = false;
                vacancyObj.isInGracePeriod = false;
                vacancyObj.shouldHide = false;
                vacancyObj.daysUntilExpiration = null;
            }
            
            return vacancyObj;
        });

        // Filter out jobs that should be hidden (past grace period)
        const visibleVacancies = vacanciesWithExpiration.filter(v => !v.shouldHide);

        return res.json({ vacancies: visibleVacancies });
    } catch (err) {
        console.error("Get vacancies error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.apply = async(req, res) => {
    try {
        const { vacancyId } = req.body;
        const labourId = req.user.id;

        const vacancy = await Vacancy.findById(vacancyId);
        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy not found" });
        }

        // Check if job is expired based on start date only
        const currentDate = new Date();
        if (vacancy.startDate) {
            const startDate = new Date(vacancy.startDate);
            
            if (currentDate > startDate) {
                return res.status(400).json({ 
                    message: "This job has expired (start date has passed) and is no longer accepting applications",
                    isExpired: true,
                    expirationDate: startDate
                });
            }
        }

        // If vacancy already filled
        if (vacancy.applicants.length >= vacancy.numWorkers) {
            vacancy.status = "filled";
            await vacancy.save();
            return res.status(400).json({ message: "Vacancy is full" });
        }

        // Check if already applied
        const alreadyApplied = vacancy.applicants.some(
            (app) => app.labourId.toString() === labourId.toString()
        );

        if (alreadyApplied) {
            return res.status(400).json({ message: "You have already applied" });
        }

        // Add new applicant
        vacancy.applicants.push({ labourId, status: "pending" });

        // Update status automatically
        vacancy.updateStatus();
        await vacancy.save();

        return res.json({
            success: true,
            message: "Applied successfully",
            vacancy,
        });
    } catch (err) {
        console.error("Apply Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.payout = async (req, res) => {
    try {
        const { vacancyId, labourId } = req.body;
        const farmerId = req.user.id;

        const vacancy = await Vacancy.findById(vacancyId);
        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy not found" });
        }

        if (vacancy.postedBy.toString() !== farmerId.toString()) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const applicant = vacancy.applicants.find(app => app.labourId.toString() === labourId.toString());
        if (!applicant || applicant.status !== 'accepted') {
            return res.status(400).json({ message: "Labour not accepted for this vacancy" });
        }

        const payment = await Payment.findOne({ vacancy: vacancyId });
        if (!payment || payment.status !== 'completed') {
            return res.status(400).json({ message: "Payment for this vacancy is not completed or already processed" });
        }

        const adminUser = await User.findOne({ role: 'admin' });
        const adminWallet = await Wallet.findOne({ user: adminUser._id });
        const labourWallet = await Wallet.findOneAndUpdate(
            { user: labourId },
            { $inc: { balance: payment.amount } },
            { upsert: true, new: true }
        );

        if (adminWallet.balance < payment.amount) {
            return res.status(400).json({ message: 'Insufficient funds in admin wallet.'});
        }

        adminWallet.balance -= payment.amount;
        await adminWallet.save();

        payment.status = 'released';
        await payment.save();
        
        await Transaction.create({
            fromUser: adminUser._id,
            toUser: labourId,
            fromWallet: adminWallet._id,
            toWallet: labourWallet._id,
            amount: payment.amount,
            type: 'payout_release',
            status: 'completed',
            payment: payment._id,
            description: 'Payout to labour for vacancy.'
        });

        res.json({ message: 'Payment released successfully.' });

    } catch (error) {
        console.error("Payout Error:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.acceptApplicant = async (req, res) => {
    try {
        const { vacancyId, applicantId } = req.body;
        const vacancy = await Vacancy.findOneAndUpdate(
            { _id: vacancyId, "applicants.labourId": applicantId },
            { $set: { "applicants.$.status": "accepted" } },
            { new: true }
        );
        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy or applicant not found" });
        }
        res.json(vacancy);
    } catch (error) {
        console.error("Accept Applicant Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.rejectApplicant = async (req, res) => {
    try {
        const { vacancyId, applicantId } = req.body;
        const vacancy = await Vacancy.findOneAndUpdate(
            { _id: vacancyId, "applicants.labourId": applicantId },
            { $set: { "applicants.$.status": "rejected" } },
            { new: true }
        );
        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy or applicant not found" });
        }
        res.json(vacancy);
    } catch (error) {
        console.error("Reject Applicant Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};