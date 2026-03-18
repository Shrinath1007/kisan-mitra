const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const simplePayment = require("../controllers/simplePaymentController");

router.post(
  "/upi/vacancy-payment",
  protect,
  simplePayment.createVacancyUPIPayment
);
router.post("/upi/pay", protect, simplePayment.createUPIPayment);
router.get("/upi/history", protect, simplePayment.getMyPayments); // optional for farmer
router.get("/admin/payments", simplePayment.getAllPaymentsAdmin); // no protect for now
router.get("/admin/wallet", simplePayment.getAdminWallet);

module.exports = router;
