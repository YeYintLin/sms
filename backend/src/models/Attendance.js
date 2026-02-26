const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
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
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late'],
            required: true
        },
        remark: {
            type: String,
            default: ''
        },
        markedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ grade: 1, classroom: 1, date: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
