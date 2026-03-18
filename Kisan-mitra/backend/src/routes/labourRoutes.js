const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const role = require("../middlewares/roleMiddleware");
const labour = require("../controllers/labourController");

// Labour specific routes
const labourRouter = express.Router();
labourRouter.use(auth.protect, role(["labour"]));
labourRouter.get("/profile", labour.getLabourProfile);
labourRouter.put("/profile", labour.updateLabourProfile);
labourRouter.get("/work-history", labour.getWorkHistory);
labourRouter.get("/vacancies", labour.getVacancies);
labourRouter.post("/apply", labour.apply);

// Farmer specific routes for labour management
const farmerRouter = express.Router();
farmerRouter.use(auth.protect, role(["farmer"]));
farmerRouter.post("/pay", labour.payout);
farmerRouter.post('/applicants/accept', labour.acceptApplicant);
farmerRouter.post('/applicants/reject', labour.rejectApplicant);


router.use(labourRouter);
router.use(farmerRouter);

module.exports = router;

