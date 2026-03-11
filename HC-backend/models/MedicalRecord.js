const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Patient ID is required'],
        },
        fileUrl: {
            type: String,
            required: [true, 'File URL is required'],
        },
        s3Key: {
            type: String,
        },
        folder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Folder',
            required: [true, 'Folder is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        fileType: {
            type: String,
            trim: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ folder: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
