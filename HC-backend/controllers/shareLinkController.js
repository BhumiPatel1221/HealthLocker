const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ShareLink = require('../models/ShareLink');
const File = require('../models/File');
const Folder = require('../models/Folder');
const MedicalRecord = require('../models/MedicalRecord');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess, sendCreated } = require('../utils/response');
const { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } = require('../utils/AppError');
const { getSignedDownloadUrl } = require('../services/s3Service');
const { createAuditLog } = require('../services/auditService');

/**
 * POST /api/share
 * Create a secure shareable link for a file or folder.
 * Protected — requires JWT.
 */
const createShareLink = catchAsync(async (req, res) => {
    const { fileId, folderId, recordId, expiresAt: expiresAtRaw, password } = req.body;

    const targets = [fileId, folderId, recordId].filter(Boolean);
    if (targets.length === 0) {
        throw new BadRequestError('Provide one of: fileId, folderId, or recordId');
    }
    if (targets.length > 1) {
        throw new BadRequestError('Provide only one of fileId, folderId, or recordId');
    }

    // Validate expiresAt — must be a valid future datetime
    if (!expiresAtRaw) {
        throw new BadRequestError('expiresAt is required');
    }
    const expiresAt = new Date(expiresAtRaw);
    if (isNaN(expiresAt.getTime())) {
        throw new BadRequestError('Invalid expiresAt datetime');
    }
    if (expiresAt <= new Date()) {
        throw new BadRequestError('Expiry datetime must be in the future');
    }

    // Validate ownership
    if (fileId) {
        const file = await File.findById(fileId);
        if (!file) throw new NotFoundError('File not found');
        if (file.uploadedBy.toString() !== req.user._id.toString()) {
            throw new ForbiddenError('You do not own this file');
        }
    }
    if (folderId) {
        const folder = await Folder.findById(folderId);
        if (!folder) throw new NotFoundError('Folder not found');
        if (folder.owner.toString() !== req.user._id.toString()) {
            throw new ForbiddenError('You do not own this folder');
        }
    }
    if (recordId) {
        const record = await MedicalRecord.findById(recordId);
        if (!record) throw new NotFoundError('Record not found');
        if (record.patientId.toString() !== req.user._id.toString()) {
            throw new ForbiddenError('You do not own this record');
        }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim()) {
        hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    const shareLink = await ShareLink.create({
        token,
        fileId: fileId || null,
        folderId: folderId || null,
        recordId: recordId || null,
        expiresAt,
        password: hashedPassword,
        ownerId: req.user._id,
    });

    // Audit log
    await createAuditLog({
        userId: req.user._id,
        action: 'SHARE_LINK_CREATED',
        role: req.user.role,
        targetId: shareLink._id,
        targetModel: 'ShareLink',
        description: `Share link created for ${fileId ? 'file' : folderId ? 'folder' : 'record'} ${fileId || folderId || recordId}`,
        metadata: { expiresAt, passwordProtected: !!hashedPassword },
        req,
    });

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${token}`;

    return sendCreated(res, {
        token,
        shareUrl,
        expiresAt,
        passwordProtected: !!hashedPassword,
        fileId: fileId || null,
        folderId: folderId || null,
        recordId: recordId || null,
    }, 'Share link created successfully');
});

/**
 * GET /api/share/access/:token
 * Access a shared resource by token (public endpoint).
 * Optional: ?password=<plain-text> query param for password-protected links.
 */
const accessShareLink = catchAsync(async (req, res) => {
    const { token } = req.params;
    const password = req.query.password || req.body.password;

    const shareLink = await ShareLink.findOne({ token });

    if (!shareLink) throw new NotFoundError('Share link not found or has expired');
    if (shareLink.revoked) throw new ForbiddenError('This share link has been revoked');
    if (new Date() > shareLink.expiresAt) throw new ForbiddenError('This link has expired');

    // Password check
    if (shareLink.password) {
        if (!password) {
            return res.status(401).json({
                success: false,
                message: 'This link is password protected',
                errorCode: 'PASSWORD_REQUIRED',
                passwordRequired: true,
            });
        }
        const isMatch = await bcrypt.compare(String(password), shareLink.password);
        if (!isMatch) throw new UnauthorizedError('Incorrect password', 'INVALID_PASSWORD');
    }

    let responseData = {
        type: shareLink.fileId ? 'file' : shareLink.recordId ? 'record' : 'folder',
        expiresAt: shareLink.expiresAt,
        passwordProtected: !!shareLink.password,
    };

    if (shareLink.fileId) {
        const file = await File.findById(shareLink.fileId).lean();
        if (!file) throw new NotFoundError('The shared file no longer exists');

        // Generate a fresh pre-signed URL (15 min)
        const signedUrl = await getSignedDownloadUrl(file.s3Key, 900);

        responseData.file = {
            _id: file._id,
            fileName: file.originalName || file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            signedUrl,
            uploadedAt: file.createdAt,
        };
    } else if (shareLink.recordId) {
        const record = await MedicalRecord.findById(shareLink.recordId).lean();
        if (!record) throw new NotFoundError('The shared record no longer exists');

        // Use signed URL if the record has an S3 key, otherwise fall back to stored URL
        let fileUrl;
        if (record.s3Key) {
            fileUrl = await getSignedDownloadUrl(record.s3Key, 900);
        } else {
            const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';
            fileUrl = record.fileUrl.startsWith('http')
                ? record.fileUrl
                : `${backendBase}${record.fileUrl}`;
        }

        responseData.record = {
            _id: record._id,
            fileName: record.description || 'Medical Record',
            fileType: record.fileType,
            fileUrl,
            uploadedAt: record.uploadedAt || record.createdAt,
        };
    } else {
        const folder = await Folder.findById(shareLink.folderId).lean();
        if (!folder) throw new NotFoundError('The shared folder no longer exists');

        // Fetch all files in the folder with signed URLs
        const files = await File.find({ folder: shareLink.folderId }).lean();
        const filesWithUrls = await Promise.all(
            files.map(async (f) => ({
                _id: f._id,
                fileName: f.originalName || f.fileName,
                fileType: f.fileType,
                fileSize: f.fileSize,
                signedUrl: await getSignedDownloadUrl(f.s3Key, 900),
                uploadedAt: f.createdAt,
            }))
        );

        responseData.folder = {
            _id: folder._id,
            name: folder.name,
            files: filesWithUrls,
        };
    }

    return sendSuccess(res, responseData, 'Share link accessed successfully');
});

/**
 * DELETE /api/share/:token
 * Revoke a share link. Only the owner can revoke.
 * Protected — requires JWT.
 */
const revokeShareLink = catchAsync(async (req, res) => {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token });
    if (!shareLink) throw new NotFoundError('Share link not found');
    if (shareLink.ownerId.toString() !== req.user._id.toString()) {
        throw new ForbiddenError('You do not own this share link');
    }

    shareLink.revoked = true;
    await shareLink.save();

    await createAuditLog({
        userId: req.user._id,
        action: 'SHARE_LINK_REVOKED',
        role: req.user.role,
        targetId: shareLink._id,
        targetModel: 'ShareLink',
        description: `Share link revoked: ${token.slice(0, 8)}...`,
        metadata: {},
        req,
    });

    return sendSuccess(res, null, 'Share link revoked successfully');
});

/**
 * GET /api/share
 * List all share links created by the authenticated user.
 * Protected — requires JWT.
 */
const listShareLinks = catchAsync(async (req, res) => {
    const shareLinks = await ShareLink.find({ ownerId: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';

    const enriched = shareLinks.map((link) => ({
        _id: link._id,
        token: link.token,
        shareUrl: `${frontendBase}/share/${link.token}`,
        fileId: link.fileId,
        folderId: link.folderId,
        recordId: link.recordId,
        expiresAt: link.expiresAt,
        revoked: link.revoked,
        passwordProtected: !!link.password,
        createdAt: link.createdAt,
        isExpired: new Date() > link.expiresAt,
    }));

    return sendSuccess(res, { shareLinks: enriched });
});

module.exports = {
    createShareLink,
    accessShareLink,
    revokeShareLink,
    listShareLinks,
};
