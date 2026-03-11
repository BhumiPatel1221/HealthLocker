const { admin } = require('../config/firebase');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateToken } = require('../utils/jwt');
const { createAuditLog } = require('../services/auditService');

/**
 * Middleware: Verify Firebase ID Token
 *
 * Flow:
 * 1. Extract Firebase ID token from Authorization header
 * 2. Verify with Firebase Admin SDK
 * 3. Find or create user in MongoDB
 * 4. Generate backend JWT
 * 5. Attach user to req.user
 */
const verifyFirebaseToken = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No authentication token provided', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    // Verify Firebase ID token
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
        throw new UnauthorizedError('Invalid or expired Firebase token', 'INVALID_FIREBASE_TOKEN');
    }

    const { uid, email, name, picture } = decodedToken;

    // Find existing user or create new one
    let user = await User.findOne({ firebaseUid: uid });
    let isNewUser = false;

    if (!user) {
        isNewUser = true;
        user = await User.create({
            firebaseUid: uid,
            email: email || `${uid}@firebase.user`,
            name: name || email?.split('@')[0] || 'User',
            profilePicture: picture || null,
            role: 'patient', // Default role
        });

        // Log registration
        await createAuditLog({
            userId: user._id,
            action: 'USER_REGISTER',
            role: user.role,
            targetId: user._id,
            targetModel: 'User',
            description: `New user registered: ${user.email}`,
            req,
        });
    }

    // Check suspension
    if (user.isSuspended) {
        throw new UnauthorizedError(
            'Your account has been suspended. Contact admin for assistance.',
            'ACCOUNT_SUSPENDED'
        );
    }

    // Generate backend JWT
    const jwtToken = generateToken(user);

    // Attach to request
    req.user = user;
    req.jwtToken = jwtToken;
    req.isNewUser = isNewUser;

    // Log login
    if (!isNewUser) {
        await createAuditLog({
            userId: user._id,
            action: 'USER_LOGIN',
            role: user.role,
            targetId: user._id,
            targetModel: 'User',
            description: `User logged in: ${user.email}`,
            req,
        });
    }

    next();
});

module.exports = verifyFirebaseToken;
