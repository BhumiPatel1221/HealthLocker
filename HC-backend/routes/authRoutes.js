const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail } = require('../controllers/authController');
const verifyJWT = require('../middleware/verifyJWT');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);

// Protected routes (JWT required)
router.get('/me', verifyJWT, getMe);

module.exports = router;
