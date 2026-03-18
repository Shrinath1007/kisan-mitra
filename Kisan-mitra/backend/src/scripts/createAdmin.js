require("dotenv").config({ path: "../../.env" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const ADMIN_EMAIL = "admin@kisanmitra.com";
const ADMIN_PASSWORD = "Admin@123";
const ADMIN_NAME = "Main Admin";

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✔ Connected to MongoDB");

        let check = await Admin.findOne({ email: ADMIN_EMAIL });
        if (check) return console.log("⚠ Admin already exists"), process.exit();

        const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        await Admin.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            passwordHash: hash,
            role: "admin",
        });

        console.log("🎉 Admin Added Successfully");
        console.log("LOGIN EMAIL:", ADMIN_EMAIL);
        console.log("PASSWORD:", ADMIN_PASSWORD);
        process.exit();
    } catch (error) {
        console.log("❌ Error:", error.message);
        process.exit();
    }
}

createAdmin();