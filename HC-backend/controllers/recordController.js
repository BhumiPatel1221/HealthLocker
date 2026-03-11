
const MedicalRecord = require('../models/MedicalRecord');
const Folder = require('../models/Folder');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/AppError');
const { createAuditLog } = require('../services/auditService');
const fs = require('fs');
const path = require('path');


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

    const record = await MedicalRecord.create({
        patientId: req.user.id,
        fileUrl: `/uploads/${req.file.filename}`,
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
    const records = await MedicalRecord.find(filter).sort('-createdAt');
    sendSuccess(res, { records }, 'Records retrieved successfully');
});

// All doctor access logic removed

// DELETE /api/records/:id
const deleteRecord = catchAsync(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) throw new NotFoundError('Record not found');
    if (record.patientId.toString() !== req.user.id.toString()) {
        throw new ForbiddenError('You do not have permission to delete this record');
    }

    // Remove physical file from disk
    if (record.fileUrl) {
        const filePath = path.join(__dirname, '..', record.fileUrl);
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') console.error('File delete error:', err);
        });
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
