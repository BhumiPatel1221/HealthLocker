const { ForbiddenError } = require('../utils/AppError');

/**
 * Middleware: Restrict access to specific roles.
 * Must be used AFTER verifyJWT.
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError('You do not have permission to perform this action'));
        }
        next();
    };
};

module.exports = restrictTo;
