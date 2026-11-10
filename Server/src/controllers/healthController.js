// Step 3.10 - Health Check Controller

const { pool } = require("../config/db");

const getHealth = async (req, res, next) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            success: true,
            message: "Sweety backend is healthy",
            services: {
                server: "running",
                database: "connected"
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getHealth };