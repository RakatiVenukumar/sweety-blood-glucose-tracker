const AppError = require("./AppError");

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const ALLOWED_TIME_SLOTS = [
    "morning",
    "after_breakfast",
    "after_lunch",
    "after_dinner"
];
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const assertRequestBody = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError("Request body must be a JSON object", 400);
    }
};

const validateName = (name) => {
    if (typeof name !== "string") {
        throw new AppError("Name must be a string", 400);
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
        throw new AppError(
            "Name must contain between 2 and 100 characters",
            400
        );
    }

    return trimmedName;
};

const validateEmail = (email) => {
    if (typeof email !== "string") {
        throw new AppError("Email must be a string", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
        normalizedEmail.length > 255 ||
        !EMAIL_PATTERN.test(normalizedEmail)
    ) {
        throw new AppError("Please provide a valid email address", 400);
    }

    return normalizedEmail;
};

const validatePassword = (password) => {
    if (
        typeof password !== "string" ||
        password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72
    ) {
        throw new AppError(
            "Password must be at least 8 characters and no more than 72 bytes",
            400
        );
    }

    return password;
};

const validateUuid = (value, fieldName = "ID") => {
    if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
        throw new AppError(`Invalid ${fieldName}`, 400);
    }

    return value;
};

const validateDate = (readingDate) => {
    if (
        typeof readingDate !== "string" ||
        !DATE_PATTERN.test(readingDate)
    ) {
        throw new AppError("Reading date must use YYYY-MM-DD format", 400);
    }

    const parsedDate = new Date(`${readingDate}T00:00:00Z`);

    if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== readingDate
    ) {
        throw new AppError("Please provide a valid reading date", 400);
    }

    return readingDate;
};

const getTodayInTimezone = (timezone) => {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts
            .filter(({ type }) => type !== "literal")
            .map(({ type, value }) => [type, value])
    );

    return `${values.year}-${values.month}-${values.day}`;
};

const validateReadingDate = (readingDate, timezone) => {
    const validDate = validateDate(readingDate);

    if (validDate > getTodayInTimezone(timezone)) {
        throw new AppError("Future reading dates are not allowed", 400);
    }

    return validDate;
};

const validateTimeSlot = (timeSlot) => {
    if (
        typeof timeSlot !== "string" ||
        !ALLOWED_TIME_SLOTS.includes(timeSlot)
    ) {
        throw new AppError("Invalid glucose reading time slot", 400);
    }

    return timeSlot;
};

const validateGlucoseValue = (glucoseValue) => {
    if (
        !Number.isInteger(glucoseValue) ||
        glucoseValue < 40 ||
        glucoseValue > 600
    ) {
        throw new AppError(
            "Glucose value must be an integer between 40 and 600",
            400
        );
    }

    return glucoseValue;
};

const validateTimezone = (timezone) => {
    if (typeof timezone !== "string" || !timezone.trim()) {
        throw new AppError("Please provide a valid timezone", 400);
    }

    const normalizedTimezone = timezone.trim();

    try {
        new Intl.DateTimeFormat("en-US", {
            timeZone: normalizedTimezone
        });
    } catch {
        throw new AppError("Please provide a valid timezone", 400);
    }

    return normalizedTimezone;
};

module.exports = {
    DEFAULT_TIMEZONE,
    assertRequestBody,
    validateName,
    validateEmail,
    validatePassword,
    validateUuid,
    validateDate,
    validateReadingDate,
    validateTimeSlot,
    validateGlucoseValue,
    validateTimezone
};
