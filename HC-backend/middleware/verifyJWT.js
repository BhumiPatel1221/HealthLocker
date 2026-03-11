const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware: Verify JWT for protected routes.
 *
 * Expects: Authorization: Bearer <jwt_token>
 * Attaches: req.user (full Mongoose document)
 */
const verifyJWT = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No authentication token provided', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = verifyToken(token);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Token has expired. Please login again.', 'TOKEN_EXPIRED');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Invalid token. Please login again.', 'INVALID_TOKEN');
        }
        throw new UnauthorizedError('Authentication failed', 'AUTH_FAILED');
    }

    // Fetch fresh user data
    const user = await User.findById(decoded.id);
    if (!user) {
        throw new UnauthorizedError('User no longer exists', 'USER_NOT_FOUND');
    }

    if (user.isSuspended) {
        throw new UnauthorizedError(
            'Your account has been suspended. Contact admin for assistance.',
            'ACCOUNT_SUSPENDED'
        );
    }

    req.user = user;
    next();
});

module.exports = verifyJWT;
