const express = require('express');
const router = express.Router();
const {
    grantAccess,
    revokeAccess,
    getAccessLogs,
    requestAccess,
    getSharedRecords,
    getAccessStatus
} = require('../controllers/accessController');
const verifyJWT = require('../middleware/verifyJWT');
const restrictTo = require('../middleware/restrictTo');

router.use(verifyJWT);

// Shared Patient/Doctor accessible through role restriction within controllers or route-level
// grantAccess and revokeAccess routes removed as per user request.
router.get('/logs', restrictTo('patient'), getAccessLogs);

// Doctor access routes removed as per user request.

module.exports = router;
