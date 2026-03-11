const mongoose = require('mongoose');

const accessPermissionSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Patient ID is required'],
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Doctor ID is required'],
        },
        // null means full access to all visits; a specific ObjectId restricts to one visit
        visitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Visit',
            default: null,
        },
        expiresAt: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        isRevoked: {
            type: Boolean,
            default: false,
        },
        grantedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

accessPermissionSchema.index({ patientId: 1, doctorId: 1 });
accessPermissionSchema.index({ doctorId: 1, isRevoked: 1, expiresAt: 1 });

module.exports = mongoose.model('AccessPermission', accessPermissionSchema);
