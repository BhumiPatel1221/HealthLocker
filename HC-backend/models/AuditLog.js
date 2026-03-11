const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        action: {
            type: String,
            required: [true, 'Action is required'],
            enum: [
                // Auth
                'USER_LOGIN',
                'USER_REGISTER',
                // Visit
                'VISIT_CREATED',
                'VISIT_VIEWED',
                // File
                'FILE_UPLOADED',
                'FILE_DOWNLOADED',
                'FILE_DELETED',
                'FILE_REPLACED',
                'PRESCRIPTION_UPLOADED',
                // Access
                'ACCESS_GRANTED',
                'ACCESS_REVOKED',
                'ACCESS_EXPIRED',
                // System
                'SUSPICIOUS_ACTIVITY',
                'UNAUTHORIZED_ACCESS_ATTEMPT',
            ],
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null, // The resource being acted upon
        },
        targetModel: {
            type: String,
            enum: ['User', 'Visit', 'File', 'AccessPermission', null],
            default: null,
        },
        role: {
            type: String,
            enum: ['patient'],
            required: true,
        },
        description: {
            type: String,
            default: '',
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true, // createdAt acts as timestamp
    }
);

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: -1 }); // For log browsing

module.exports = mongoose.model('AuditLog', auditLogSchema);
