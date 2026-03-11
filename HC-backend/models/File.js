const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
    {
        folder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            required: [true, 'Folder is required'],
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader ID is required'],
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        originalName: {
            type: String,
            required: [true, 'Original file name is required'],
        },
        fileType: {
            type: String,
            required: [true, 'File type is required'],
            enum: {
                values: [
                    'application/pdf',
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'application/dicom',
                    'text/plain',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ],
                message: '{VALUE} is not a supported file type',
            },
        },
        s3Key: {
            type: String,
            required: [true, 'S3 key is required'],
        },
        s3Url: {
            type: String,
            default: null,
        },
        fileSize: {
            type: Number, // bytes
            default: 0,
        },
        // category removed: no system-based categorization
        isReplaced: {
            type: Boolean,
            default: false,
        },
        replacedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);


// Indexes
fileSchema.index({ folder: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ isReplaced: 1 });

module.exports = mongoose.model('File', fileSchema);
