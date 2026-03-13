const crypto = require('crypto');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess, sendError } = require('../utils/response');
const { generateToken } = require('../utils/jwt');
const { BadRequestError, UnauthorizedError } = require('../utils/AppError');
const { sendVerificationEmail } = require('../services/emailService');

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = catchAsync(async (req, res) => {
    const { name, email, password, role, medicalRegistrationNumber, hospitalClinicName, mobile } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new BadRequestError('Name is required');
    }
    if (!normalizedEmail) {
        throw new BadRequestError('Email is required');
    }
    if (!password || typeof password !== 'string') {
        throw new BadRequestError('Password is required');
    }
    if (password.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters');
    }

    const safeRole = role || 'patient';

    // Doctor-specific validations
    if (safeRole === 'doctor') {
        if (!medicalRegistrationNumber || typeof medicalRegistrationNumber !== 'string' || !medicalRegistrationNumber.trim()) {
            throw new BadRequestError('Medical Registration Number is required for doctors');
        }
        if (!hospitalClinicName || typeof hospitalClinicName !== 'string' || !hospitalClinicName.trim()) {
            throw new BadRequestError('Hospital / Clinic Name is required for doctors');
        }
        if (!mobile || typeof mobile !== 'string' || !/^\d{10}$/.test(mobile.trim())) {
            throw new BadRequestError('A valid 10-digit mobile number is required for doctors');
        }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        throw new BadRequestError('User already exists');
    }

    const userData = {
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: safeRole,
    };

    if (safeRole === 'doctor') {
        userData.medicalRegistrationNumber = medicalRegistrationNumber.trim();
        userData.hospitalClinicName = hospitalClinicName.trim();
        userData.mobile = mobile.trim();
    }

    const user = await User.create(userData);

    // Generate email verification token (expires in 24 hours; configurable via EMAIL_VERIFY_EXPIRY_HOURS)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiryHours = Number(process.env.EMAIL_VERIFY_EXPIRY_HOURS) || 24;
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send verification email (non-blocking — registration still succeeds if email fails)
    try {
        await sendVerificationEmail(user.email, user.name, verificationToken, expiryHours);
    } catch (emailErr) {
        console.error('Verification email failed to send:', emailErr.message);
    }

    // Do NOT log the user in yet — account is inactive until email is verified.
    sendSuccess(res, {
        email: user.email,
    }, 'Account created successfully. Please check your email to verify your account before logging in.', 201);
});

/**
 * GET /api/auth/verify-email?token=...
 * Verify email address using token sent in registration email
 */
const verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        throw new BadRequestError('Verification token is required');
    }

    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
        throw new BadRequestError('Verification link is invalid or expired.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, null, 'Email verified successfully. Your account is now activated.');
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail || !password) {
        throw new BadRequestError('Please provide email and password');
    }

    // Check user & password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isEmailVerified) {
        throw new UnauthorizedError('Please verify your email first before logging in.');
    }

    const token = generateToken(user);

    sendSuccess(res, {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
        },
    }, 'Login successful');
});

/**
 * GET /api/auth/me
 * Get current user profile (requires JWT)
 */
const getMe = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id).select('-__v');

    sendSuccess(res, { user }, 'Profile retrieved successfully');
});

module.exports = {
    register,
    login,
    getMe,
    verifyEmail,
};
