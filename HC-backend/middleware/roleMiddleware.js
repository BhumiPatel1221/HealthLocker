const { ForbiddenError } = require('../utils/AppError');
const { createAuditLog } = require('../services/auditService');

/**
 * Middleware factory: Restrict access to specific roles.
 *
 * Usage: roleMiddleware('doctor')            — single role
 *        roleMiddleware('patient', 'doctor')  — multiple roles
 *
 * Must be used AFTER verifyJWT middleware (req.user must exist).
 */
const roleMiddleware = (...allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Authentication required', 'AUTH_REQUIRED'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            // Log unauthorized access attempt
            await createAuditLog({
                userId: req.user._id,
                action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                role: req.user.role,
                description: `User with role '${req.user.role}' attempted to access a route restricted to: ${allowedRoles.join(', ')}`,
                metadata: {
                    attemptedRoute: req.originalUrl,
                    method: req.method,
                },
                req,
            });

            return next(
                new ForbiddenError(
                    `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
                    'INSUFFICIENT_ROLE'
                )
            );
        }

        next();
    };
};

module.exports = roleMiddleware;
