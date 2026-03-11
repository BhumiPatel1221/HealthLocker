const express = require('express');
const router = express.Router();
const {
    uploadRecord,
    getMyRecords,
    deleteRecord,
} = require('../controllers/recordController');
const verifyJWT = require('../middleware/verifyJWT');
const restrictTo = require('../middleware/restrictTo');
const multer = require('multer');
const path = require('path');

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and images are allowed'));
        }
    }
});

router.use(verifyJWT);

// Patient routes
router.post('/upload', restrictTo('patient'), upload.single('file'), uploadRecord);
router.get('/my-records', restrictTo('patient'), getMyRecords);
router.delete('/:id', restrictTo('patient'), deleteRecord);

// All doctor-related routes have been removed as per user request.

module.exports = router;
