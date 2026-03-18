// src/controllers/farmerController.js
const Farm = require("../models/Farm");
const Crop = require("../models/Crop");
const Vacancy = require("../models/Vacancy");

exports.createFarm = async(req, res) => {
    try {
        const farm = await Farm.create({
            owner: req.user.id,
            name: req.body.name,
            area: req.body.area,
            soilType: req.body.soilType,
        });
        return res.status(201).json({ farm });
    } catch (err) {
        console.error("Create farm:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.addCrop = async(req, res) => {
    try {
        const crop = await Crop.create({
            farm: req.body.farmId,
            name: req.body.name,
            plantingDate: req.body.plantingDate,
            stage: req.body.stage,
            areaHectares: req.body.areaHectares,
        });
        return res.status(201).json({ crop });
    } catch (err) {
        console.error("Add crop:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getCrops = async(req, res) => {
    try {
        const farms = await Farm.find({ owner: req.user.id }).populate("crops");
        return res.json({ farms });
    } catch (err) {
        console.error("Get crops:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.postVacancy = async(req, res) => {
    try {
        const {
            title,
            description,
            numberOfWorkers,
            wagePerDay,
            startDate,
            numberOfDays,
            location,
            contact
        } = req.body;

        // Validation
        if (!title || !description || !numberOfWorkers || !wagePerDay || !location) {
            return res.status(400).json({ 
                message: "Title, description, number of workers, wage per day, and location are required" 
            });
        }

        const vacancy = await Vacancy.create({
            postedBy: req.user.id,
            title,
            description,
            location,
            contact,
            startDate,
            duration: numberOfDays || 1,
            numWorkers: numberOfWorkers,
            ratePerDay: wagePerDay,
            paymentStatus: "pending" // Initially pending until platform fee is paid
        });
        
        return res.status(201).json({ 
            vacancy,
            message: "Vacancy created successfully. Please pay platform fee to activate."
        });
    } catch (err) {
        console.error("Post vacancy:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getVacancies = async(req, res) => {
    try {
        const vacancies = await Vacancy.find({ postedBy: req.user.id }).sort({
            createdAt: -1,
        });
        return res.json({ vacancies });
    } catch (err) {
        console.error("Get vacancies:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.updateVacancy = async(req, res) => {
    try {
        const { id } = req.params;
        const { numberOfWorkers, numberOfDays } = req.body;

        const vacancy = await Vacancy.findOneAndUpdate({ _id: id, postedBy: req.user.id }, {
            numWorkers: numberOfWorkers,
            duration: numberOfDays,
        }, { new: true });

        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy not found" });
        }

        return res.json({ vacancy });
    } catch (err) {
        console.error("Update vacancy:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.deleteVacancy = async(req, res) => {
    try {
        const { id } = req.params;
        const vacancy = await Vacancy.findOneAndDelete({
            _id: id,
            postedBy: req.user.id,
        });
        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy not found" });
        }
        return res.json({ message: "Vacancy deleted successfully" });
    } catch (err) {
        console.error("Delete vacancy:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getVacanciesWithApplicants = async(req, res) => {
    try {
        const vacancies = await Vacancy.find({ postedBy: req.user.id })
            .populate("applicants.labourId", "name phone email")
            .sort({ createdAt: -1 });

        return res.json({ vacancies });
    } catch (err) {
        console.error("Farmer vacancy error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Accept applicant for a vacancy
exports.acceptApplicant = async(req, res) => {
    try {
        const { vacancyId, labourId } = req.body;

        const vacancy = await Vacancy.findOne({ 
            _id: vacancyId, 
            postedBy: req.user.id 
        });

        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy not found" });
        }

        // Find the applicant
        const applicant = vacancy.applicants.find(
            app => app.labourId.toString() === labourId
        );

        if (!applicant) {
            return res.status(404).json({ message: "Applicant not found" });
        }

        // Update applicant status
        applicant.status = "accepted";
        await vacancy.save();

        return res.json({ 
            message: "Applicant accepted successfully",
            vacancy 
        });
    } catch (err) {
        console.error("Accept applicant error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Reject applicant for a vacancy
exports.rejectApplicant = async(req, res) => {
    try {
        const { vacancyId, labourId } = req.body;

        const vacancy = await Vacancy.findOne({ 
            _id: vacancyId, 
            postedBy: req.user.id 
        });

        if (!vacancy) {
            return res.status(404).json({ message: "Vacancy not found" });
        }

        // Find the applicant
        const applicant = vacancy.applicants.find(
            app => app.labourId.toString() === labourId
        );

        if (!applicant) {
            return res.status(404).json({ message: "Applicant not found" });
        }

        // Update applicant status
        applicant.status = "rejected";
        await vacancy.save();

        return res.json({ 
            message: "Applicant rejected successfully",
            vacancy 
        });
    } catch (err) {
        console.error("Reject applicant error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};