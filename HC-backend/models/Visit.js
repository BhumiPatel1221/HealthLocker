const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Patient ID is required'],
        },
        // doctorId removed
        visitDate: {
            type: Date,
            required: [true, 'Visit date is required'],
        },
        title: {
            type: String,
            required: [true, 'Visit title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        notes: {
            type: String,
            default: '',
            maxlength: [5000, 'Notes cannot exceed 5000 characters'],
        },
        diagnosis: {
            type: String,
            default: '',
        },
        hospitalName: {
            type: String,
            default: '',
        },
        visitType: {
            type: String,
            enum: ['checkup', 'emergency', 'follow-up', 'surgery', 'lab-test', 'other'],
            default: 'checkup',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
visitSchema.index({ patientId: 1, visitDate: -1 });

module.exports = mongoose.model('Visit', visitSchema);
