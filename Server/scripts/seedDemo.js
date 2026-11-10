require("dotenv").config();

const bcrypt = require("bcrypt");
const { pool } = require("../src/config/db");

const demoEmail = process.env.DEMO_USER_EMAIL || "demo@sweety.local";
const demoPassword = process.env.DEMO_USER_PASSWORD || "SweetyDemo123!";
const demoName = process.env.DEMO_USER_NAME || "Sweety Demo";
const demoTimezone = process.env.DEMO_USER_TIMEZONE || "Asia/Kolkata";
const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

const demoReadings = [
    { readingDate: "2026-11-06", timeSlot: "morning", glucoseValue: 108 },
    { readingDate: "2026-11-06", timeSlot: "after_breakfast", glucoseValue: 126 },
    { readingDate: "2026-11-06", timeSlot: "after_lunch", glucoseValue: 118 },
    { readingDate: "2026-11-06", timeSlot: "after_dinner", glucoseValue: 112 },
    { readingDate: "2026-11-07", timeSlot: "morning", glucoseValue: 101 },
    { readingDate: "2026-11-07", timeSlot: "after_lunch", glucoseValue: 121 },
    { readingDate: "2026-11-08", timeSlot: "morning", glucoseValue: 110 },
    { readingDate: "2026-11-08", timeSlot: "after_dinner", glucoseValue: 116 },
    { readingDate: "2026-11-09", timeSlot: "morning", glucoseValue: 104 },
    { readingDate: "2026-11-09", timeSlot: "after_breakfast", glucoseValue: 129 },
    { readingDate: "2026-11-10", timeSlot: "morning", glucoseValue: 106 },
    { readingDate: "2026-11-10", timeSlot: "after_lunch", glucoseValue: 119 }
];

async function seedDemo() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const passwordHash = await bcrypt.hash(demoPassword, saltRounds);
        const existingUser = await client.query(
            "SELECT id FROM public.users WHERE LOWER(email) = LOWER($1)",
            [demoEmail]
        );

        let userId;
        if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id;
            await client.query(
                `UPDATE public.users
                 SET name = $1, password_hash = $2, timezone = $3
                 WHERE id = $4`,
                [demoName, passwordHash, demoTimezone, userId]
            );
        } else {
            const result = await client.query(
                `INSERT INTO public.users (name, email, password_hash, timezone)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [demoName, demoEmail.toLowerCase(), passwordHash, demoTimezone]
            );
            userId = result.rows[0].id;
        }

        await client.query(
            "SELECT set_config('app.current_user_id', $1, true)",
            [userId]
        );

        for (const reading of demoReadings) {
            await client.query(
                `INSERT INTO public.glucose_readings
                    (user_id, reading_date, time_slot, glucose_value)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (user_id, reading_date, time_slot)
                 DO UPDATE SET glucose_value = EXCLUDED.glucose_value`,
                [
                    userId,
                    reading.readingDate,
                    reading.timeSlot,
                    reading.glucoseValue
                ]
            );
        }

        await client.query("COMMIT");

        console.log("Demo data seeded successfully.");
        console.log(`Email: ${demoEmail}`);
        console.log(`Password: ${demoPassword}`);
        console.log(`Readings: ${demoReadings.length}`);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedDemo().catch((error) => {
    console.error("Unable to seed demo data:", error.message);
    process.exitCode = 1;
});
