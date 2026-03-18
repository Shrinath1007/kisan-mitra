// src/routes/aiRoutes.js
const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/predict", aiController.predict);
router.get("/labour", aiController.labour);
router.get("/machinery", aiController.machinery);
router.get("/weather-prediction", aiController.weatherPrediction);
router.post("/crop-analysis", aiController.cropAnalysis);

module.exports = router;
