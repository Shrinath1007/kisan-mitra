// src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { adminProtect } = require("../middlewares/adminAuthMiddleware");

/* ===== ADMIN LOGIN (NO AUTH REQUIRED) ===== */
router.post("/login", adminController.adminLogin);

/* ====== BELOW ALL NEED ADMIN JWT TOKEN ====== */
router.use(adminProtect);

/* ===== USERS ===== */
router.get("/farmers", adminController.getFarmers);
router.delete("/farmer/:id", adminController.deleteFarmer);

/* ===== MACHINES ===== */
router.get("/machines", adminController.getMachines);
router.delete("/machine/:id", adminController.deleteMachine);

/* ===== LABOURS ===== */
router.get("/labours", adminController.getLabours);
router.delete("/labour/:id", adminController.deleteLabour);

/* ===== 💰 WALLET & EARNINGS ===== */
router.get("/wallet", adminController.getAdminWallet);
router.get("/earnings", adminController.getAdminEarnings);

module.exports = router;