const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/logs/my-logs
 * Patient views their own audit logs
 */
const getMyLogs = catchAsync(async (req, res) => {
    const { page = 1, limit = 30, action } = req.query;

    const query = { userId: req.user._id };
    if (action) query.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        AuditLog.countDocuments(query),
    ]);

    sendSuccess(res, {
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    }, 'Audit logs retrieved successfully');
});

/**
 * GET /api/logs/access-logs
 * Patient views who accessed their data
 */
const getAccessLogs = catchAsync(async (req, res) => {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find logs where the target is the patient's data
    const [logs, total] = await Promise.all([
        AuditLog.find({
            action: { $in: ['VISIT_VIEWED', 'FILE_DOWNLOADED', 'ACCESS_GRANTED', 'ACCESS_REVOKED'] },
            $or: [
                { userId: req.user._id },
                { 'metadata.patientId': req.user._id.toString() },
            ],
        })
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        AuditLog.countDocuments({
            action: { $in: ['VISIT_VIEWED', 'FILE_DOWNLOADED', 'ACCESS_GRANTED', 'ACCESS_REVOKED'] },
            $or: [
                { userId: req.user._id },
                { 'metadata.patientId': req.user._id.toString() },
            ],
        }),
    ]);

    sendSuccess(res, {
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    }, 'Access logs retrieved successfully');
});

module.exports = {
    getMyLogs,
    getAccessLogs,
};
