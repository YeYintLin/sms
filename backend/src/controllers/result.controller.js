const ExamResult = require('../models/ExamResult');
const Student = require('../models/Student');
const {
    getTeacherContext
} = require('../services/classroomContext.service');
const { buildResultQuery } = require('../services/resultContext.service');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSubjects = (subjects = []) =>
    (Array.isArray(subjects) ? subjects : [])
        .filter((s) => s && typeof s.name === 'string' && s.name.trim())
        .map((s) => {
            const score = Number(s.score);
            return {
                name: s.name.trim(),
                score: Number.isFinite(score) ? score : 0
            };
        });

const assertTeacherCanAccessStudent = (ctx, student) => {
    if (!ctx.teacher) return 'Teacher profile not found';
    if (!student) return 'Student not found';
    if (student.grade !== ctx.grade) return 'Access denied for this grade';
    if (ctx.classroom && student.classroom !== ctx.classroom) return 'Access denied for this classroom';
    return null;
};

// @desc    Get exam results
// @route   GET /api/results
// @access  Private
exports.getResults = async (req, res) => {
    try {        
        const gradeQuery = (req.query.grade || '').trim();
        const termQuery = (req.query.term || '').trim();
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limitParam = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 0;
        const skip = limit > 0 ? (page - 1) * limit : 0;

        const resultContext = await buildResultQuery({
            user: req.user,
            gradeQuery,
            termQuery
        });
        if (resultContext.error) {
            return res.status(resultContext.status).json({ msg: resultContext.error });
        }

        const total = await ExamResult.countDocuments(resultContext.query);
        const query = ExamResult.find(resultContext.query)
            .populate({ path: 'student', populate: { path: 'userId', select: 'name email' } })
            .sort({ updatedAt: -1, createdAt: -1 });

        if (limit > 0) {
            query.skip(skip).limit(limit);
        }

        const results = await query;
        const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

        return res.json({
            data: results,
            meta: {
                total,
                page,
                limit,
                totalPages,
                grade: resultContext.metaGrade || gradeQuery || null,
                term: resultContext.metaTerm || termQuery || null
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create exam result
// @route   POST /api/results
// @access  Private (Admin, Teacher)
exports.createResult = async (req, res) => {
    try {
        const { studentId, term, subjects } = req.body;
        const normalizedId = String(studentId || '').trim();
        if (!normalizedId) return res.status(400).json({ msg: 'studentId is required' });

        const normalizedSubjects = normalizeSubjects(subjects);
        if (normalizedSubjects.length === 0) {
            return res.status(400).json({ msg: 'At least one valid subject is required' });
        }

        const student = await Student.findOne({
            studentId: { $regex: `^${escapeRegex(normalizedId)}$`, $options: 'i' }
        });
        if (!student) return res.status(404).json({ msg: 'Student not found by studentId' });

        if (req.user.role === 'teacher') {
            const ctx = await getTeacherContext(req.user.id);
            const denied = assertTeacherCanAccessStudent(ctx, student);
            if (denied) {
                return res.status(403).json({ msg: denied });
            }
        }

        const result = await ExamResult.findOneAndUpdate(
            { student: student._id, term: String(term || 'Term 1').trim() || 'Term 1' },
            {
                $set: {
                    student: student._id,
                    grade: student.grade,
                    term: String(term || 'Term 1').trim() || 'Term 1',
                    subjects: normalizedSubjects
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).populate({ path: 'student', populate: { path: 'userId', select: 'name email' } });

        return res.status(201).json(result);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
};

// @desc    Update exam result
// @route   PUT /api/results/:id
// @access  Private (Admin, Teacher)
exports.updateResult = async (req, res) => {
    try {
        const { studentId, term, subjects } = req.body;
        const result = await ExamResult.findById(req.params.id);
        if (!result) return res.status(404).json({ msg: 'Result not found' });

        let student = await Student.findById(result.student);

        if (studentId && String(studentId).trim()) {
            const targetStudent = await Student.findOne({
                studentId: { $regex: `^${escapeRegex(String(studentId).trim())}$`, $options: 'i' }
            });
            if (!targetStudent) return res.status(404).json({ msg: 'Student not found by studentId' });
            student = targetStudent;
            result.student = targetStudent._id;
            result.grade = targetStudent.grade;
        }

        if (req.user.role === 'teacher') {
            const ctx = await getTeacherContext(req.user.id);
            const denied = assertTeacherCanAccessStudent(ctx, student);
            if (denied) {
                return res.status(403).json({ msg: denied });
            }
        }

        if (typeof term === 'string' && term.trim()) {
            result.term = term.trim();
        }

        if (subjects !== undefined) {
            const normalizedSubjects = normalizeSubjects(subjects);
            if (normalizedSubjects.length === 0) {
                return res.status(400).json({ msg: 'At least one valid subject is required' });
            }
            result.subjects = normalizedSubjects;
        }

        await result.save();
        const updated = await ExamResult.findById(result._id).populate({
            path: 'student',
            populate: { path: 'userId', select: 'name email' }
        });
        return res.json(updated);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
};

// @desc    Delete exam result
// @route   DELETE /api/results/:id
// @access  Private (Admin)
exports.deleteResult = async (req, res) => {
    try {
        const result = await ExamResult.findById(req.params.id);
        if (!result) return res.status(404).json({ msg: 'Result not found' });

        await result.deleteOne();
        return res.json({ msg: 'Result removed' });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
};
