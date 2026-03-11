const express = require('express');
const router = express.Router();
const { getMyLogs, getAccessLogs } = require('../controllers/auditController');
const verifyJWT = require('../middleware/verifyJWT');

// All log routes require authentication
router.use(verifyJWT);

// Patient views own audit logs
router.get('/my-logs', getMyLogs);

// Patient views who accessed their data
router.get('/access-logs', getAccessLogs);

module.exports = router;
