const User = require('../models/User');
const AccessLog = require('../models/AccessLog');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { NotFoundError } = require('../utils/AppError');

/**
 * GET /api/admin/users
 * Get all users
 */
const getAllUsers = catchAsync(async (req, res) => {
    const users = await User.find().select('-__v');
    sendSuccess(res, { users }, 'Users retrieved successfully');
});

/**
 * PATCH /api/admin/verify-doctor
 * Verify a doctor
 */
const verifyDoctor = catchAsync(async (req, res) => {
    const { doctorId, isVerified } = req.body;

    const user = await User.findByIdAndUpdate(
        doctorId,
        { isVerified },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new NotFoundError('Doctor not found');
    }

    sendSuccess(res, { user }, `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`);
});

/**
 * GET /api/admin/system-logs
 * Get system-wide logs
 */
const getSystemLogs = catchAsync(async (req, res) => {
    const logs = await AccessLog.find()
        .populate('userId', 'name role')
        .sort('-createdAt')
        .limit(100);
    sendSuccess(res, { logs }, 'System logs retrieved successfully');
});

module.exports = {
    getAllUsers,
    verifyDoctor,
    getSystemLogs
};
