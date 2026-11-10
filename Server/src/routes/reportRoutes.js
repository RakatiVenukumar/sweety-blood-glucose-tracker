const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
    getDailyReport,
    getMonthlyReport,
    getPreviousMonthReport
} = require("../controllers/reportController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect);

router.get("/daily", asyncHandler(getDailyReport));
router.get("/monthly", asyncHandler(getMonthlyReport));
router.get("/previous-month", asyncHandler(getPreviousMonthReport));

module.exports = router;
