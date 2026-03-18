const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const farmer = require("../controllers/farmerController");

// FIXED MIDDLEWARE SETUP
router.use(protect);
router.use(role(["farmer"]));

// Routes
router.post("/farm", farmer.createFarm);
router.post("/crop", farmer.addCrop);
router.get("/crops", farmer.getCrops);
router.post("/vacancy", farmer.postVacancy);
router.get("/vacancies", farmer.getVacancies);
router.patch("/vacancy/:id", farmer.updateVacancy);
router.delete("/vacancy/:id", farmer.deleteVacancy);
router.get("/vacancies/applicants", farmer.getVacanciesWithApplicants);
router.post("/applicants/accept", farmer.acceptApplicant);
router.post("/applicants/reject", farmer.rejectApplicant);

module.exports = router;
