const { AppError } = require('../utils/AppError');

/**
 * Global error handling middleware.
 *
 * Catches all errors thrown or passed via next(err) and returns
 * a consistent JSON response.
 */
const errorHandler = (err, req, res, _next) => {
    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errorCode = err.errorCode || 'INTERNAL_ERROR';

    // ---- Mongoose Errors ----

    // Validation Error
    if (err.name === 'ValidationError' && err.errors) {
        statusCode = 422;
        errorCode = 'VALIDATION_ERROR';
        const messages = Object.values(err.errors).map((e) => e.message);
        message = messages.join('. ');
    }

    // Duplicate Key Error
    if (err.code === 11000) {
        statusCode = 409;
        errorCode = 'DUPLICATE_KEY';
        const field = Object.keys(err.keyValue).join(', ');
        message = `Duplicate value for field(s): ${field}`;
    }

    // Cast Error (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
        statusCode = 400;
        errorCode = 'INVALID_ID';
        message = `Invalid value for ${err.path}: ${err.value}`;
    }

    // ---- JWT Errors ----
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorCode = 'INVALID_TOKEN';
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorCode = 'TOKEN_EXPIRED';
        message = 'Token has expired';
    }

    // ---- Multer Errors ----
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        errorCode = 'FILE_TOO_LARGE';
        message = `File size exceeds the maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || 10}MB`;
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        errorCode = 'UNEXPECTED_FILE_FIELD';
        message = 'Unexpected file field in upload';
    }

    // ---- Log server errors ----
    if (statusCode >= 500) {
        console.error('🔥 SERVER ERROR:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
        });
    }

    // Response
    const response = {
        success: false,
        message,
        errorCode,
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
