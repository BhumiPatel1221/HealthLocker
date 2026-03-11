const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 *
 * @param {Object} params
 * @param {string} params.userId       - ID of the user performing the action
 * @param {string} params.action       - Action enum value
 * @param {string} params.role         - Role of the user
 * @param {string} [params.targetId]   - ID of the resource acted upon
 * @param {string} [params.targetModel]- Model name of the target
 * @param {string} [params.description]- Human-readable description
 * @param {Object} [params.metadata]   - Additional data
 * @param {Object} [params.req]        - Express request object (for IP & UA)
 */
const createAuditLog = async ({
    userId,
    action,
    role,
    targetId = null,
    targetModel = null,
    description = '',
    metadata = {},
    req = null,
}) => {
    try {
        const logEntry = {
            userId,
            action,
            role,
            targetId,
            targetModel,
            description,
            metadata,
            ipAddress: req
                ? req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip
                : null,
            userAgent: req ? req.headers['user-agent'] : null,
        };

        await AuditLog.create(logEntry);
    } catch (error) {
        // Audit log failures should never crash the main flow
        console.error(`⚠️  Audit log creation failed: ${error.message}`);
    }
};

module.exports = { createAuditLog };
