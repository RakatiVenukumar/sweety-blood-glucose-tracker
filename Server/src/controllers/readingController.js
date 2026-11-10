const { withTransaction } = require("../config/db");
const AppError = require("../utils/AppError");

const createReading = async (req, res, next) => {
    try {
        const { reading_date, time_slot, glucose_value } = req.body;

        // 1. Validate required fields
        if (!reading_date || !time_slot || glucose_value === undefined) {
            throw new AppError(
                "Reading date, time slot and glucose value are required",
                400
            );
        }

        // 2. Validate date format
        if (
            typeof reading_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
        ) {
            throw new AppError(
                "Reading date must use YYYY-MM-DD format",
                400
            );
        }

        const parsedDate = new Date(`${reading_date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== reading_date
        ) {
            throw new AppError("Please provide a valid reading date", 400);
        }

        // 3. Prevent future dates
        const today = new Date().toISOString().slice(0, 10);

        if (reading_date > today) {
            throw new AppError(
                "Future reading dates are not allowed",
                400
            );
        }

        // 4. Validate time slot
        const allowedSlots = [
            "morning",
            "after_breakfast",
            "after_lunch",
            "after_dinner"
        ];

        if (
            typeof time_slot !== "string" ||
            !allowedSlots.includes(time_slot)
        ) {
            throw new AppError("Invalid glucose reading time slot", 400);
        }

        // 5. Validate glucose value
        if (
            !Number.isInteger(glucose_value) ||
            glucose_value < 40 ||
            glucose_value > 600
        ) {
            throw new AppError(
                "Glucose value must be an integer between 40 and 600",
                400
            );
        }

        // 6. Insert reading within the authenticated user's RLS context
        const result = await withTransaction(
            async (client) => {
                return await client.query(
                    `INSERT INTO public.glucose_readings
                        (user_id, reading_date, time_slot, glucose_value)
                     VALUES ($1, $2, $3, $4)
                     RETURNING
                        id,
                        reading_date,
                        time_slot,
                        glucose_value,
                        created_at,
                        updated_at`,
                    [
                        req.user.id,
                        reading_date,
                        time_slot,
                        glucose_value
                    ]
                );
            },
            req.user.id
        );

        res.status(201).json({
            success: true,
            message: "Glucose reading created successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        // Handle duplicate date and time-slot combinations
        if (error.code === "23505") {
            return next(
                new AppError(
                    "A reading already exists for this date and time slot",
                    409
                )
            );
        }

        next(error);
    }
};

const getAllReadings = async (req, res, next) => {
    try {
        const result = await withTransaction(
            async (client) => {
                return await client.query(
                    `SELECT
                        id,
                        reading_date,
                        time_slot,
                        glucose_value,
                        created_at,
                        updated_at
                     FROM public.glucose_readings
                     ORDER BY reading_date DESC, created_at DESC`
                );
            },
            req.user.id
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        next(error);
    }
};

const getReadingById = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate UUID format
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(id)) {
            throw new AppError("Invalid reading ID", 400);
        }

        const result = await withTransaction(
            async (client) => {
                return await client.query(
                    `SELECT
                        id,
                        reading_date,
                        time_slot,
                        glucose_value,
                        created_at,
                        updated_at
                     FROM public.glucose_readings
                     WHERE id = $1`,
                    [id]
                );
            },
            req.user.id
        );

        if (result.rows.length === 0) {
            throw new AppError("Glucose reading not found", 404);
        }

        res.status(200).json({
            success: true,
            reading: result.rows[0]
        });

    } catch (error) {
        next(error);
    }
};

const updateReading = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reading_date, time_slot, glucose_value } = req.body;

        // Validate reading ID
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(id)) {
            throw new AppError("Invalid reading ID", 400);
        }

        // Validate required fields
        if (
            !reading_date ||
            !time_slot ||
            glucose_value === undefined
        ) {
            throw new AppError(
                "Reading date, time slot and glucose value are required",
                400
            );
        }

        // Validate date format
        if (
            typeof reading_date !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(reading_date)
        ) {
            throw new AppError(
                "Reading date must use YYYY-MM-DD format",
                400
            );
        }

        const parsedDate = new Date(`${reading_date}T00:00:00Z`);

        if (
            Number.isNaN(parsedDate.getTime()) ||
            parsedDate.toISOString().slice(0, 10) !== reading_date
        ) {
            throw new AppError("Please provide a valid reading date", 400);
        }

        const today = new Date().toISOString().slice(0, 10);

        if (reading_date > today) {
            throw new AppError("Future reading dates are not allowed", 400);
        }

        // Validate time slot
        const allowedSlots = [
            "morning",
            "after_breakfast",
            "after_lunch",
            "after_dinner"
        ];

        if (
            typeof time_slot !== "string" ||
            !allowedSlots.includes(time_slot)
        ) {
            throw new AppError("Invalid glucose reading time slot", 400);
        }

        // Validate glucose value
        if (
            !Number.isInteger(glucose_value) ||
            glucose_value < 40 ||
            glucose_value > 600
        ) {
            throw new AppError(
                "Glucose value must be an integer between 40 and 600",
                400
            );
        }

        const result = await withTransaction(
            async (client) => {
                return await client.query(
                    `UPDATE public.glucose_readings
                     SET
                        reading_date = $1,
                        time_slot = $2,
                        glucose_value = $3
                     WHERE id = $4
                     RETURNING
                        id,
                        reading_date,
                        time_slot,
                        glucose_value,
                        created_at,
                        updated_at`,
                    [reading_date, time_slot, glucose_value, id]
                );
            },
            req.user.id
        );

        if (result.rows.length === 0) {
            throw new AppError("Glucose reading not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Glucose reading updated successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return next(
                new AppError(
                    "A reading already exists for this date and time slot",
                    409
                )
            );
        }

        next(error);
    }
};

const deleteReading = async (req, res, next) => {
    try {
        const { id } = req.params;

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(id)) {
            throw new AppError("Invalid reading ID", 400);
        }

        const result = await withTransaction(
            async (client) => {
                return await client.query(
                    `DELETE FROM public.glucose_readings
                     WHERE id = $1
                     RETURNING id`,
                    [id]
                );
            },
            req.user.id
        );

        if (result.rows.length === 0) {
            throw new AppError("Glucose reading not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Glucose reading deleted successfully",
            deletedId: result.rows[0].id
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createReading,
    getAllReadings,
    getReadingById,
    updateReading,
    deleteReading
};