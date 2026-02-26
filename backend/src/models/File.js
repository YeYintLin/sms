const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        originalName: { type: String, required: true },
        type: { type: String, default: 'FILE' },
        mimeType: { type: String, default: '' },
        size: { type: Number, required: true },
        owner: { type: String, default: '' },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        data: { type: Buffer, select: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model('File', FileSchema);
