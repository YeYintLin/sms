const Student = require('../models/Student');
const { getTeacherContext } = require('./classroomContext.service');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildResultQuery = async ({ user, gradeQuery, termQuery }) => {
    const role = user.role;
    if (role === 'admin') {
        const query = {};
        if (gradeQuery) query.grade = gradeQuery;
        if (termQuery) query.term = termQuery;
        return { query, metaGrade: gradeQuery || null, metaTerm: termQuery || null };
    }

    if (role === 'teacher') {
        const ctx = await getTeacherContext(user.id);
        if (!ctx.teacher) {
            return { error: 'Teacher profile not found', status: 404 };
        }

        if (gradeQuery && gradeQuery !== ctx.grade) {
            return { error: 'Access denied for this grade', status: 403 };
        }

        const grade = ctx.grade;
        if (!grade) {
            return { error: 'Teacher grade not configured', status: 403 };
        }

        const query = { grade };
        if (termQuery) query.term = termQuery;

        if (ctx.classroom) {
            const students = await Student.find({ grade, classroom: ctx.classroom }).select('_id');
            const studentIds = students.map((s) => s._id);
            query.student = { $in: studentIds };
        }

        return { query, metaGrade: grade, metaTerm: termQuery || null };
    }

    if (role === 'student') {
        const student = await Student.findOne({ userId: user.id });
        if (!student) return { error: 'Student profile not found', status: 404 };

        if (gradeQuery && gradeQuery !== student.grade) {
            return { error: 'Access denied for this grade', status: 403 };
        }

        const query = { student: student._id };
        if (termQuery) query.term = termQuery;

        return { query, metaGrade: student.grade, metaTerm: termQuery || null };
    }

    return { error: 'Access denied', status: 403 };
};

module.exports = {
    buildResultQuery
};
