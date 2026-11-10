const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const AppError = require("../utils/AppError");

const register = async (req, res, next) => {
    try {
        const { name, email, password, timezone } = req.body;

        // 1. Validate required fields
        if (!name || !email || !password) {
            throw new AppError(
                "Name, email and password are required",
                400
            );
        }

        // 2. Normalize and validate name and email
        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (trimmedName.length < 2 || trimmedName.length > 100) {
            throw new AppError(
                "Name must contain between 2 and 100 characters",
                400
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            normalizedEmail.length > 255 ||
            !emailRegex.test(normalizedEmail)
        ) {
            throw new AppError("Please provide a valid email address", 400);
        }

        // 3. Validate password
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

        // 4. Validate timezone
        const userTimezone = timezone || "Asia/Kolkata";

        try {
            new Intl.DateTimeFormat("en-US", {
                timeZone: userTimezone
            });
        } catch {
            throw new AppError("Please provide a valid timezone", 400);
        }

        // 5. Check whether email already exists
        const existingUser = await pool.query(
            "SELECT id FROM public.users WHERE LOWER(email) = $1",
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            throw new AppError("An account with this email already exists", 409);
        }

        // 6. Hash password
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 7. Create user
        const result = await pool.query(
            `INSERT INTO public.users
                (name, email, password_hash, timezone)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, timezone, created_at`,
            [trimmedName, normalizedEmail, passwordHash, userTimezone]
        );

        const user = result.rows[0];

        // 8. Generate JWT
        const token = jwt.sign(
            { sub: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        // 9. Return response
        res.status(201).json({
            success: true,
            message: "Account registered successfully",
            token,
            user
        });

    } catch (error) {
        // Handle duplicate email race conditions
        if (error.code === "23505") {
            return next(
                new AppError("An account with this email already exists", 409)
            );
        }

        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validate required fields
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            throw new AppError("Email and password are required", 400);
        }

        // 2. Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // 3. Find user
        const result = await pool.query(
            `SELECT id, name, email, password_hash, timezone, created_at
             FROM public.users
             WHERE LOWER(email) = $1`,
            [normalizedEmail]
        );

        // Use a generic error to avoid revealing whether an email exists
        if (result.rows.length === 0) {
            throw new AppError("Invalid email or password", 401);
        }

        const user = result.rows[0];

        // 4. Compare submitted password with stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }

        // 5. Generate JWT
        const token = jwt.sign(
            { sub: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        // 6. Return safe user details
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                timezone: user.timezone,
                created_at: user.created_at
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { register, login };