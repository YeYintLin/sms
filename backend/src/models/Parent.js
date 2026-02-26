const mongoose = require('mongoose');

const ParentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentId: {
        type: String,
        required: true,
        unique: true
    },
    studentId: {
        type: String,
        default: ''
    },
    grade: {
        type: String,
        default: ''
    },
    contact: {
        type: String,
        default: ''
    },
    birthday: {
        type: Date
    }
});

module.exports = mongoose.model('Parent', ParentSchema);
