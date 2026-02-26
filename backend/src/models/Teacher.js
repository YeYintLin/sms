const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    grade: {
        type: String,
        required: true
    },
    classroom: {
        type: String,
        default: ''
    },
    experience: {
        type: String
    },
    birthday: {
        type: Date
    },
    contact: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Teacher', TeacherSchema);
