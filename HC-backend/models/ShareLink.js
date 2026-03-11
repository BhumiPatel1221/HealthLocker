const mongoose = require('mongoose');
const shareLinkSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
    },
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        default: null,
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
    },
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalRecord',
        default: null,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    password: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    revoked: {
        type: Boolean,
        default: false,
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});
// token index is already created by unique: true in the schema field definition
shareLinkSchema.index({ expiresAt: 1 });
module.exports = mongoose.model('ShareLink', shareLinkSchema);