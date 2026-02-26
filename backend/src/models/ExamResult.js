const mongoose = require('mongoose');

const ExamResultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    grade: {
        type: String,
        required: true
    },
    subjects: [
        {
            name: { type: String, required: true },
            score: { type: Number, required: true }
        }
    ],
    term: {
        type: String,
        default: 'Term 1'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ExamResult', ExamResultSchema);
