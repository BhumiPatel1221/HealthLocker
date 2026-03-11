
const MedicalRecord = require('../models/MedicalRecord');
const Folder = require('../models/Folder');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/AppError');
const { createAuditLog } = require('../services/auditService');
const { uploadToS3, getSignedDownloadUrl, deleteFromS3 } = require('../services/s3Service');


// POST /api/records/upload
const uploadRecord = catchAsync(async (req, res) => {
    if (!req.file) throw new BadRequestError('Please upload a file');
    const { folder, description } = req.body;
    if (!folder) throw new BadRequestError('Folder is required');
    const folderDoc = await Folder.findById(folder);
    if (!folderDoc || folderDoc.owner.toString() !== req.user.id.toString()) {
        throw new ForbiddenError('Invalid folder');
    }
    // Derive human-readable file type from mimetype
    const mimeMap = {
        'application/pdf': 'PDF',
        'image/jpeg': 'JPEG',
        'image/jpg': 'JPEG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'image/webp': 'WEBP',
        'image/svg+xml': 'SVG',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    };
    const fileType = mimeMap[req.file.mimetype] ||
        (req.file.mimetype.startsWith('image/') ? 'IMAGE' : 'FILE');

    // Upload to S3
    const s3Folder = `patients/${req.user.id}/records/${folder}`;
    const { s3Key, s3Url } = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        s3Folder
    );

    const record = await MedicalRecord.create({
        patientId: req.user.id,
        fileUrl: s3Url,
        s3Key,
        folder,
        description,
        fileType,
        uploadedAt: new Date(),
    });
    await createAuditLog({ userId: req.user.id, action: 'RECORD_UPLOADED', role: req.user.role, targetId: record._id, targetModel: 'MedicalRecord', description: `Record uploaded to folder: ${folderDoc.name}`, req });
    sendSuccess(res, { record }, 'Record uploaded successfully');
});


// GET /api/records/my-records
const getMyRecords = catchAsync(async (req, res) => {
    const { folder } = req.query;
    const filter = { patientId: req.user.id };
    if (folder) filter.folder = folder;
    const records = await MedicalRecord.find(filter).sort('-createdAt').lean();

    // Generate signed URLs for S3-backed records so the browser can access them
    const recordsWithUrls = await Promise.all(
        records.map(async (record) => {
            if (record.s3Key) {
                try {
                    record.fileUrl = await getSignedDownloadUrl(record.s3Key, 900);
                } catch (err) {
                    console.error('Signed URL error for record', record._id, err.message);
                }
            }
            return record;
        })
    );

    sendSuccess(res, { records: recordsWithUrls }, 'Records retrieved successfully');
});

// All doctor access logic removed

// DELETE /api/records/:id
const deleteRecord = catchAsync(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) throw new NotFoundError('Record not found');
    if (record.patientId.toString() !== req.user.id.toString()) {
        throw new ForbiddenError('You do not have permission to delete this record');
    }

    // Remove file from S3
    if (record.s3Key) {
        try {
            await deleteFromS3(record.s3Key);
        } catch (err) {
            console.error('S3 delete error:', err);
        }
    }

    await record.deleteOne();
    await createAuditLog({
        userId: req.user.id,
        action: 'RECORD_DELETED',
        role: req.user.role,
        targetId: record._id,
        targetModel: 'MedicalRecord',
        description: `Record deleted: ${record.description || record._id}`,
        req,
    });
    sendSuccess(res, null, 'Record deleted successfully');
});

module.exports = {
    uploadRecord,
    getMyRecords,
    deleteRecord,
};
