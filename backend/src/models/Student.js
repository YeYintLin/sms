const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true // Link to User for auth
    },
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    grade: {
        type: String,
        required: true
    },
    classroom: {
        type: String,
        default: ''
    },
    age: {
        type: Number
    },
    birthday: {
        type: Date
    },
    contact: {
        type: String
    },
    address: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('Student', StudentSchema);
