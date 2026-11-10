// Step 3.10 - Health Check Route

const express = require("express");
const { getHealth } = require("../controllers/healthController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/", asyncHandler(getHealth));

module.exports = router;