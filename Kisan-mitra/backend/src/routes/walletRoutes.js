const express = require("express");
const router = express.Router();
const { getWallet, payWithWallet } = require("../controllers/walletController");
const { protect } = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");

router.use(protect);

// All roles can view their wallet
router.get("/", getWallet);

// Farmer can pay using wallet balance
router.post("/pay/:bookingId", role(["farmer"]), payWithWallet);

module.exports = router;
