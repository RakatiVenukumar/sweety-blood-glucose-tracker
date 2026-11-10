// Phase 3 - Backend Foundation
// Step 3.8 - Express Middleware Configuration

require("dotenv").config();

const healthRoutes = require("./src/routes/healthRoutes");
const notFound = require("./src/middleware/notFound");
const errorHandler = require("./src/middleware/errorHandler");
const authRoutes = require("./src/routes/authRoutes");
const readingRoutes = require("./src/routes/readingRoutes");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { pool, withTransaction } = require("./src/config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security headers
app.use(helmet());

// 2. CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// 3. Parse incoming JSON requests
app.use(express.json({ limit: "10kb" }));

// 4. Parse URL-encoded requests
app.use(express.urlencoded({ extended: true, limit: "10kb" }));


app.use("/api/health", healthRoutes); 

app.use("/api/auth", authRoutes);

app.use("/api/readings", readingRoutes);

// Handle requests to undefined routes
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);


// Start server
app.listen(PORT, () => {
    console.log(`Sweety backend running on port ${PORT}`);
});