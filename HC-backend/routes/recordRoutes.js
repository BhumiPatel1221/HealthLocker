const express = require('express');
const router = express.Router();
const {
    uploadRecord,
    getMyRecords,
    deleteRecord,
} = require('../controllers/recordController');
const verifyJWT = require('../middleware/verifyJWT');
const restrictTo = require('../middleware/restrictTo');
const upload = require('../middleware/upload');

router.use(verifyJWT);

// Patient routes
router.post('/upload', restrictTo('patient'), upload.single('file'), uploadRecord);
router.get('/my-records', restrictTo('patient'), getMyRecords);
router.delete('/:id', restrictTo('patient'), deleteRecord);

// All doctor-related routes have been removed as per user request.

module.exports = router;
