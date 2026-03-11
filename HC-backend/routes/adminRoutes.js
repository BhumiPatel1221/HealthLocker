const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    // verifyDoctor, (doctor logic removed)
    getSystemLogs
} = require('../controllers/adminController');
const verifyJWT = require('../middleware/verifyJWT');
const restrictTo = require('../middleware/restrictTo');

router.use(verifyJWT, restrictTo('admin'));

router.get('/users', getAllUsers);
// router.patch('/verify-doctor', verifyDoctor); (doctor logic removed)
router.get('/system-logs', getSystemLogs);

module.exports = router;
