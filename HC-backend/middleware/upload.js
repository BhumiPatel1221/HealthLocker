const multer = require('multer');
const { AppError } = require('../utils/AppError');

/**
 * Multer configuration for file uploads.
 * Files are stored in memory (Buffer) before being uploaded to S3.
 */

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/dicom',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024; // MB → bytes

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new AppError(
                `File type '${file.mimetype}' is not allowed. Supported: ${ALLOWED_MIME_TYPES.join(', ')}`,
                400,
                'UNSUPPORTED_FILE_TYPE'
            ),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5, // Max 5 files per request
    },
});

module.exports = upload;
