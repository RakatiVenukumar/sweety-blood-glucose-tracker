const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const AppError = require("../utils/AppError");
const {
    DEFAULT_TIMEZONE,
    assertRequestBody,
    validateName,
    validateEmail,
    validatePassword,
    validateTimezone
} = require("../utils/validators");

const register = async (req, res, next) => {
    try {
        assertRequestBody(req.body);
        const { name, email, password, timezone } = req.body;

        if (name === undefined || email === undefined || password === undefined) {
            throw new AppError(
                "Name, email and password are required",
                400
            );
        }

        const trimmedName = validateName(name);
        const normalizedEmail = validateEmail(email);
        validatePassword(password);
        const userTimezone = timezone === undefined
            ? DEFAULT_TIMEZONE
            : validateTimezone(timezone);

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
        assertRequestBody(req.body);
        const { email, password } = req.body;

        if (email === undefined || password === undefined) {
            throw new AppError("Email and password are required", 400);
        }

        const normalizedEmail = validateEmail(email);
        validatePassword(password);

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