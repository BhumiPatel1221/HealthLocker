const jwt = require('jsonwebtoken');

/**
 * Generate a JWT for the given user payload.
 */
const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Verify and decode a JWT.
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
