// Step 3.9 - Centralized Error Handler

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    // Handle malformed JSON request bodies
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        statusCode = 400;
        message = "Invalid JSON request body";
    }

    // Log detailed errors on the server
    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        status: statusCode >= 500 ? "error" : "fail",
        message:
            statusCode >= 500 && process.env.NODE_ENV === "production"
                ? "Something went wrong. Please try again later."
                : message
    });
};

module.exports = errorHandler;
