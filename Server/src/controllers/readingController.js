const { withTransaction } = require("../config/db");
const AppError = require("../utils/AppError");
const {
    assertRequestBody,
    validateReadingDate,
    validateTimeSlot,
    validateGlucoseValue,
    validateUuid
} = require("../utils/validators");

const getUserTimezone = async (client, userId) => {
    const result = await client.query(
        "SELECT timezone FROM public.users WHERE id = $1",
        [userId]
    );

    if (result.rows.length === 0) {
        throw new AppError("Authenticated user was not found", 401);
    }

    return result.rows[0].timezone;
};

const validateReadingBody = (body) => {
    assertRequestBody(body);

    const { reading_date, time_slot, glucose_value } = body;

    if (
        reading_date === undefined ||
        time_slot === undefined ||
        glucose_value === undefined
    ) {
        throw new AppError(
            "Reading date, time slot and glucose value are required",
            400
        );
    }

    return { reading_date, time_slot, glucose_value };
};

const validateReadingFields = (fields, timezone) => {
    validateReadingDate(fields.reading_date, timezone);
    validateTimeSlot(fields.time_slot);
    validateGlucoseValue(fields.glucose_value);
};

const getTimeSlotLabel = (timeSlot) => timeSlot
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const createReading = async (req, res, next) => {
    try {
        const fields = validateReadingBody(req.body);

        const result = await withTransaction(
            async (client) => {
                const timezone = await getUserTimezone(client, req.user.id);
                validateReadingFields(fields, timezone);

                return client.query(
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
                        fields.reading_date,
                        fields.time_slot,
                        fields.glucose_value
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
        if (error.code === "23505") {
            return next(
                new AppError(
                    `You already have an ${getTimeSlotLabel(
                        req.body.time_slot
                    )} reading for this date.`,
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
            (client) =>
                client.query(
                    `SELECT
                        id,
                        reading_date,
                        time_slot,
                        glucose_value,
                        created_at,
                        updated_at
                     FROM public.glucose_readings
                     ORDER BY reading_date DESC, created_at DESC`
                ),
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
        const id = validateUuid(req.params.id, "reading ID");

        const result = await withTransaction(
            (client) =>
                client.query(
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
                ),
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
        const id = validateUuid(req.params.id, "reading ID");
        const fields = validateReadingBody(req.body);

        const result = await withTransaction(
            async (client) => {
                const timezone = await getUserTimezone(client, req.user.id);
                validateReadingFields(fields, timezone);

                return client.query(
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
                    [
                        fields.reading_date,
                        fields.time_slot,
                        fields.glucose_value,
                        id
                    ]
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
                    `You already have an ${getTimeSlotLabel(
                        req.body.time_slot
                    )} reading for this date.`,
                    409
                )
            );
        }

        next(error);
    }
};

const deleteReading = async (req, res, next) => {
    try {
        const id = validateUuid(req.params.id, "reading ID");

        const result = await withTransaction(
            (client) =>
                client.query(
                    `DELETE FROM public.glucose_readings
                     WHERE id = $1
                     RETURNING id`,
                    [id]
                ),
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
