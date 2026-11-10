// Step 3.6 - PostgreSQL Connection and Transaction Management

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// PostgreSQL DATE values are date-only values, not UTC timestamps.
const types = require("pg").types;
types.setTypeParser(1082, (value) => value);

// Load Supabase root certificate
const caCertificate = fs.readFileSync(
    path.join(__dirname, "..", "..", "certs", "prod-supabase.cer"),
    "utf8"
);

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        ca: caCertificate,
        rejectUnauthorized: true
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// Handle unexpected idle connection errors
pool.on("error", (error) => {
    console.error("Unexpected database pool error:", error.message);
});

// Reusable transaction manager
async function withTransaction(callback, userId = null) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Set authenticated user context for RLS
        if (userId) {
            await client.query(
                "SELECT set_config('app.current_user_id', $1, true)",
                [userId]
            );
        }

        const result = await callback(client);

        await client.query("COMMIT");

        return result;

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    withTransaction
};