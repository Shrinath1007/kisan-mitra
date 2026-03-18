// src/controllers/machineController.js
const Machine = require("../models/Machine");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// ⭐ Add machine (owner only) - with base64 image support
exports.addMachine = async(req, res) => {
    try {
        console.log("Add machine request received");
        console.log("Request body keys:", Object.keys(req.body));
        console.log("User:", req.user._id);

        const {
            name,
            type,
            pricePerHour,
            model,
            location,
            availability = true,
            specifications = "",
            photos = []
        } = req.body;

        // Validation
        if (!name || !type || !model || !location) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, type, model, location",
            });
        }

        // Process base64 images
        const processedPhotos = [];
        if (photos && Array.isArray(photos) && photos.length > 0) {
            const fs = require('fs');
            const path = require('path');
            
            // Ensure uploads directory exists
            const uploadsDir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            for (let i = 0; i < photos.length; i++) {
                try {
                    const base64Data = photos[i];
                    if (base64Data && base64Data.startsWith('data:image/')) {
                        // Extract image data and extension
                        const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                        if (matches) {
                            const extension = matches[1];
                            const imageData = matches[2];
                            
                            // Generate unique filename
                            const filename = `machine_${Date.now()}_${i}.${extension}`;
                            const filepath = path.join(uploadsDir, filename);
                            
                            // Save base64 image to file
                            fs.writeFileSync(filepath, imageData, 'base64');
                            processedPhotos.push(`/uploads/${filename}`);
                            
                            console.log(`Saved image: ${filename}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error processing image ${i}:`, error);
                }
            }
        }

        // Create machine
        const machine = await Machine.create({
            owner: req.user._id,
            name: name.trim(),
            type,
            pricePerHour: Number(pricePerHour) || 0,
            model: model.trim(),
            photos: processedPhotos,
            location: typeof location === 'string' ? { address: location } : location,
            availability: Boolean(availability),
            specifications: specifications || "",
        });

        console.log("Machine created successfully:", machine._id);
        console.log("Photos saved:", processedPhotos.length);

        res.status(201).json({
            success: true,
            message: "Machine added successfully",
            machine,
        });
    } catch (err) {
        console.error("Add machine error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while adding machine",
            error: err.message,
        });
    }
};

// ⭐ Get machines for owner (detailed, includes booking count)
exports.getOwnerMachines = async(req, res) => {
    try {
        const ownerId = req.user._id;

        const machines = await Machine.find({ owner: ownerId }).sort({
            createdAt: -1,
        });

        // compute booking counts for each machine in parallel
        const machinesWithCounts = await Promise.all(
            machines.map(async(m) => {
                const bookingsCount = await Booking.countDocuments({ machine: m._id });
                return {
                    ...m.toObject(),
                    bookingCount: bookingsCount,
                };
            })
        );

        res.json({
            success: true,
            machines: machinesWithCounts,
        });
    } catch (err) {
        console.error("Get owner machines error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while fetching machines",
        });
    }
};

// ⭐ Get all machines (farmers) with optional filters
exports.getMachines = async(req, res) => {
    try {
        const { type, q, maxPrice } = req.query;
        let filter = {};

        if (type) filter.type = type;
        if (q) filter.name = { $regex: q, $options: "i" };
        if (maxPrice) filter.pricePerHour = { $lte: Number(maxPrice) };

        const machines = await Machine.find(filter)
            .populate("owner", "name phone")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            machines,
        });
    } catch (err) {
        console.error("Get machines error:", err);
        res.status(500).json({
            success: false,
            message: "Server error while fetching machines",
        });
    }
};

// ⭐ Server-side search endpoint
exports.searchMachines = async(req, res) => {
    try {
        const { type, q, maxPrice } = req.query;
        let filter = {};

        if (type) filter.type = type;
        if (q) filter.name = { $regex: q, $options: "i" };
        if (maxPrice) filter.pricePerHour = { $lte: Number(maxPrice) };

        const machines = await Machine.find(filter)
            .populate("owner", "name phone")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            machines,
        });
    } catch (err) {
        console.error("Search machines error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while searching machines",
        });
    }
};

// ⭐ Get single machine details
exports.getMachineById = async(req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid machine ID",
            });
        }

        const machine = await Machine.findById(id).populate(
            "owner",
            "name phone email"
        );

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found",
            });
        }

        const result = machine.toObject();

        // Include booking count if available
        try {
            const count = await Booking.countDocuments({ machine: id });
            result.bookingCount = count;
        } catch (err) {
            result.bookingCount = 0;
        }

        return res.json({
            success: true,
            machine: result,
        });
    } catch (err) {
        console.error("Get machine by id error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching machine details",
        });
    }
};

// ⭐ Update machine (owner only)
exports.updateMachine = async(req, res) => {
    try {
        const { id } = req.params;
        const updates = {};

        const allowed = [
            "name",
            "type",
            "pricePerHour",
            "model",
            "photos",
            "location",
            "availability",
            "specifications",
        ];

        for (const k of allowed) {
            if (req.body[k] !== undefined) {
                if (k === "location" && typeof req.body[k] === "string") {
                    try {
                        updates[k] = JSON.parse(req.body[k]);
                    } catch {
                        updates[k] = { address: req.body[k] };
                    }
                } else {
                    updates[k] = req.body[k];
                }
            }
        }

        // Handle file uploads for photos if any
        if (req.files && req.files.length > 0) {
            updates.photos = req.files.map((file) => `/uploads/${file.filename}`);
        }

        const machine = await Machine.findOne({ _id: id });
        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found",
            });
        }

        // Ownership check
        if (String(machine.owner) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to edit this machine",
            });
        }

        // Apply updates
        Object.assign(machine, updates);
        await machine.save();

        // Include booking count
        const bookingCount = await Booking.countDocuments({ machine: id }).catch(
            () => 0
        );
        const out = machine.toObject();
        out.bookingCount = bookingCount;

        return res.json({
            success: true,
            message: "Machine updated successfully",
            machine: out,
        });
    } catch (err) {
        console.error("Update machine error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while updating machine",
        });
    }
};

// ⭐ Delete machine (owner only)
exports.deleteMachine = async(req, res) => {
    try {
        const { id } = req.params;
        const machine = await Machine.findOne({ _id: id });

        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found",
            });
        }

        if (String(machine.owner) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this machine",
            });
        }

        // Delete associated photos from uploads folder
        if (machine.photos && machine.photos.length > 0) {
            machine.photos.forEach((photo) => {
                const photoPath = path.join(
                    __dirname,
                    "..",
                    photo.replace("/uploads/", "uploads/")
                );
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                }
            });
        }

        // Delete the machine
        await Machine.findByIdAndDelete(id);

        // Optionally delete associated bookings
        await Booking.deleteMany({ machine: id });

        return res.json({
            success: true,
            message: "Machine deleted successfully",
        });
    } catch (err) {
        console.error("Delete machine error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting machine",
        });
    }
};

// ⭐ Get machine booking history (owner view)
exports.getMachineBookings = async(req, res) => {
    try {
        const { id } = req.params;

        const machine = await Machine.findById(id);
        if (!machine) {
            return res.status(404).json({
                success: false,
                message: "Machine not found",
            });
        }

        if (String(machine.owner) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view bookings",
            });
        }

        const bookings = await Booking.find({ machine: id })
            .populate("farmer", "name phone email")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            bookings,
        });
    } catch (err) {
        console.error("Get machine bookings error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching bookings",
        });
    }
};