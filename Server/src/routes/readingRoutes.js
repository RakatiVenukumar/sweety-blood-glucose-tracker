const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const {
    createReading,
    getAllReadings,
    getReadingById,
    updateReading,
    deleteReading
} = require("../controllers/readingController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(protect);

router.post("/", asyncHandler(createReading));
router.get("/", asyncHandler(getAllReadings));
router.get("/:id", asyncHandler(getReadingById));
router.put("/:id", asyncHandler(updateReading));
router.delete("/:id", asyncHandler(deleteReading));

module.exports = router;