const AccessLog = require('../models/AccessLog');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { BadRequestError, NotFoundError } = require('../utils/AppError');

/**
 * GET /api/access/logs
 * Get access logs for the patient
 */
const getAccessLogs = catchAsync(async (req, res) => {
    const logs = await AccessLog.find({ userId: req.user.id }).sort('-createdAt');
    sendSuccess(res, { logs }, 'Access logs retrieved successfully');
});
module.exports = {
    getAccessLogs
};
