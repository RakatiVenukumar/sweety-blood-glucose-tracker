const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const protect = (req, res, next) => {
    try {
        // 1. Read Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError(
                "Authentication required. Please provide a valid token.",
                401
            );
        }

        // 2. Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            throw new AppError("Authentication token is missing", 401);
        }

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach authenticated user information
        if (!decoded.sub) {
            throw new AppError("Invalid authentication token", 401);
        }

        req.user = {
            id: decoded.sub
        };

        // 5. Continue to protected route
        next();

    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return next(new AppError("Authentication token has expired", 401));
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return next(new AppError("Invalid authentication token", 401));
        }

        next(error);
    }
};

module.exports = { protect };