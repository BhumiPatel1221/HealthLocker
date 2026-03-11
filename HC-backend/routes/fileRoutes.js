const express = require('express');
const router = express.Router();
const {
    uploadFile,
    getFolderFiles,
    downloadFile,
    deleteFile,
} = require('../controllers/fileController');
const verifyJWT = require('../middleware/verifyJWT');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// All file routes require authentication
router.use(verifyJWT);

// Patient uploads a file to a folder
router.post('/upload', roleMiddleware('patient'), upload.single('file'), uploadFile);

// List files in a folder
router.get('/folder/:folderId', roleMiddleware('patient'), getFolderFiles);

// Get signed download URL
router.get('/:id/download', downloadFile);

// Patient deletes a file (within 10 min)
router.delete('/:id', roleMiddleware('patient'), deleteFile);

module.exports = router;
