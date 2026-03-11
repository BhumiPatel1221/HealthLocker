const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        recordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicalRecord',
            default: null,
        },
        action: {
            type: String,
            required: [true, 'Action is required'],
        },
    },
    {
        timestamps: true,
    }
);

accessLogSchema.index({ userId: 1 });
accessLogSchema.index({ recordId: 1 });

module.exports = mongoose.model('AccessLog', accessLogSchema);
