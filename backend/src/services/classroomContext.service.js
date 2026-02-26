const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');

const getTeacherContext = async (userId) => {
    const teacher = await Teacher.findOne({ userId });
    return {
        teacher,
        grade: teacher?.grade || null,
        classroom: teacher?.classroom || null
    };
};

const getStudentContext = async (userId) => {
    const student = await Student.findOne({ userId });
    return {
        student,
        grade: student?.grade || null,
        classroom: student?.classroom || null
    };
};

const getParentContext = async (userId) => {
    const parent = await Parent.findOne({ userId });
    if (!parent) {
        return { grade: null, classroom: null, studentId: null };
    }
    if (!parent.studentId) {
        return { grade: null, classroom: null, studentId: null };
    }
    const student = await Student.findOne({ studentId: parent.studentId });
    return {
        grade: student?.grade || null,
        classroom: student?.classroom || null,
        studentId: parent.studentId
    };
};

const getUserClassroomContext = async (req) => {
    if (req.user.role === 'teacher') {
        return getTeacherContext(req.user.id);
    }
    if (req.user.role === 'student') {
        return getStudentContext(req.user.id);
    }
    if (req.user.role === 'parent') {
        return getParentContext(req.user.id);
    }
    return { grade: null, classroom: null, studentId: null };
};

module.exports = {
    getTeacherContext,
    getStudentContext,
    getParentContext,
    getUserClassroomContext
};
