// src/routes/machineRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const machineController = require("../controllers/machineController");
const fs = require("fs");
const path = require("path");

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads", { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    ),
});

const upload = multer({ storage });

// ================= PUBLIC ROUTES =================
router.get("/", machineController.getMachines);
router.get("/search", machineController.searchMachines);

// ================= REQUIRE LOGIN BELOW =================
router.use(protect);

// ================= MACHINE OWNER ROUTES =================
router.get(
  "/my",
  role(["owner", "farmer"]),
  machineController.getOwnerMachines
);
router.get(
  "/my-machines",
  role(["owner", "farmer"]),
  machineController.getOwnerMachines
);

router.post(
  "/add",
  role(["owner", "farmer"]),
  upload.array("photos", 10),
  machineController.addMachine
);

router.put(
  "/:id",
  role(["owner", "farmer"]),
  machineController.updateMachine
);
router.delete(
  "/:id",
  role(["owner", "farmer"]),
  machineController.deleteMachine
);

// ================= PUBLIC SINGLE MACHINE =================
router.get("/:id", machineController.getMachineById);

module.exports = router;
