
const File = require('../models/File');
const Folder = require('../models/Folder');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess, sendCreated } = require('../utils/response');
const { BadRequestError, ForbiddenError, NotFoundError } = require('../utils/AppError');
const { uploadToS3, getSignedDownloadUrl, deleteFromS3 } = require('../services/s3Service');
const { createAuditLog } = require('../services/auditService');


// POST /api/files/upload
const uploadFile = catchAsync(async (req, res) => {
    const { folder } = req.body;
    if (!folder) throw new BadRequestError('Folder is required');
    if (!req.file) throw new BadRequestError('No file provided');
    // Validate folder ownership
    const folderDoc = await Folder.findById(folder);
    if (!folderDoc || folderDoc.owner.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Invalid folder');
    }
    // Upload to S3
    const s3Folder = `patients/${req.user._id}/folders/${folder}`;
    const { s3Key, s3Url } = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        s3Folder
    );
    // Create file record
    const file = await File.create({
        folder,
        uploadedBy: req.user._id,
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        s3Key,
        s3Url,
        fileSize: req.file.size,
    });
    // Audit log
    await createAuditLog({
        userId: req.user._id,
        action: 'FILE_UPLOADED',
        role: req.user.role,
        targetId: file._id,
        targetModel: 'File',
        description: `File uploaded: ${req.file.originalname}`,
        metadata: { folder, fileSize: req.file.size },
        req,
    });
    sendCreated(res, { file }, 'File uploaded successfully');
});

/**
 * POST /api/files/upload-prescription
 * Doctor uploads a prescription for a specific visit.
 * If replacing an old prescription, marks old one as replaced.
 */
const uploadPrescription = catchAsync(async (req, res) => {
    const { visitId, replacesFileId, category } = req.body;

    if (!visitId) {
        throw new BadRequestError('Visit ID is required');
    }

    if (!req.file) {
        throw new BadRequestError('No file provided');
    }

    const visit = await Visit.findById(visitId);
    if (!visit) {
        throw new NotFoundError('Visit not found');
    }

    // Verify doctor permission
    const permission = await AccessPermission.findOne({
        patientId: visit.patientId,
        doctorId: req.user._id,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
        $or: [{ visitId: visit._id }, { visitId: null }],
    });

    if (!permission) {
        throw new ForbiddenError(
            'You do not have valid permission to upload files for this patient',
            'PERMISSION_EXPIRED_OR_REVOKED'
        );
    }

    // Upload to S3
    const folder = `patients/${visit.patientId}/visits/${visitId}/prescriptions`;
    const { s3Key, s3Url } = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        folder
    );

    // Create file record
    const file = await File.create({
        visitId,
        uploadedBy: req.user._id,
        fileName: req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        s3Key,
        s3Url,
        fileSize: req.file.size,
        category: category || 'prescription',
    });

    // If replacing an older file, mark old one
    if (replacesFileId) {
        const oldFile = await File.findById(replacesFileId);
        if (oldFile && oldFile.visitId.toString() === visitId) {
            oldFile.isReplaced = true;
            oldFile.replacedBy = file._id;
            await oldFile.save();

            await createAuditLog({
                userId: req.user._id,
                action: 'FILE_REPLACED',
                role: req.user.role,
                targetId: oldFile._id,
                targetModel: 'File',
                description: `Prescription replaced: ${oldFile.fileName} → ${file.fileName}`,
                metadata: { oldFileId: oldFile._id, newFileId: file._id },
                req,
            });
        }
    }

    // Audit log
    await createAuditLog({
        userId: req.user._id,
        action: 'PRESCRIPTION_UPLOADED',
        role: req.user.role,
        targetId: file._id,
        targetModel: 'File',
        description: `Prescription uploaded: ${req.file.originalname}`,
        metadata: { visitId },
        req,
    });

    sendCreated(res, { file }, 'Prescription uploaded successfully');
});


// GET /api/files/folder/:folderId
const getFolderFiles = catchAsync(async (req, res) => {
    const { folderId } = req.params;
    const folder = await Folder.findById(folderId);
    if (!folder || folder.owner.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Access denied');
    }
    const files = await File.find({ folder: folderId, isDeleted: false })
        .populate('uploadedBy', 'name email role')
        .sort({ createdAt: -1 });
    sendSuccess(res, { files }, 'Files retrieved successfully');
});


// GET /api/files/:id/download
const downloadFile = catchAsync(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file || file.isDeleted) throw new NotFoundError('File not found');
    // Check folder ownership
    const folder = await Folder.findById(file.folder);
    if (!folder || folder.owner.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('Access denied');
    }
    const signedUrl = await getSignedDownloadUrl(file.s3Key);
    await createAuditLog({
        userId: req.user._id,
        action: 'FILE_DOWNLOADED',
        role: req.user.role,
        targetId: file._id,
        targetModel: 'File',
        description: `File downloaded: ${file.fileName}`,
        req,
    });
    sendSuccess(res, { downloadUrl: signedUrl, file }, 'Download URL generated');
});


// DELETE /api/files/:id
const deleteFile = catchAsync(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file || file.isDeleted) throw new NotFoundError('File not found');
    // Only the uploader (patient) can delete
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('You can only delete files you uploaded');
    }
    // Soft delete (keep record for audit trail)
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();
    // Also delete from S3
    try { await deleteFromS3(file.s3Key); } catch (err) { console.error(`⚠️  S3 deletion failed for ${file.s3Key}: ${err.message}`); }
    await createAuditLog({
        userId: req.user._id,
        action: 'FILE_DELETED',
        role: req.user.role,
        targetId: file._id,
        targetModel: 'File',
        description: `File deleted: ${file.fileName}`,
        req,
    });
    sendSuccess(res, null, 'File deleted successfully');
});

module.exports = {
    uploadFile,
    getFolderFiles,
    downloadFile,
    deleteFile,
};
