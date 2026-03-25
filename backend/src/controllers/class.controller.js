const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ userId: req.user.id });
            if (!teacher) return res.json([]);
            query = { teacher: teacher._id };
        } else if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user.id });
            if (!student) return res.json([]);
            query = { students: student._id };
        } else if (req.user.role === 'parent') {
            const parent = await Parent.findOne({ userId: req.user.id });
            if (!parent?.studentId) return res.json([]);
            const student = await Student.findOne({ studentId: parent.studentId });
            if (!student) return res.json([]);
            query = { students: student._id };
        }

        const classes = await Class.find(query)
            .populate({ path: 'teacher', populate: { path: 'userId', select: 'name email' } })
            .populate('students', ['studentId', 'grade']);
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Private
exports.getClass = async (req, res) => {
    try {
        const classData = await Class.findById(req.params.id)
            .populate('teacher')
            .populate('students');
        if (!classData) return res.status(404).json({ msg: 'Class not found' });
        if (req.user.role === 'teacher') {
            const teacher = await Teacher.findOne({ userId: req.user.id });
            const classTeacherId = classData.teacher?._id ? classData.teacher._id.toString() : classData.teacher?.toString();
            if (!teacher || classTeacherId !== teacher._id.toString()) {
                return res.status(403).json({ msg: 'Not authorized to view this class' });
            }
        } else if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user.id });
            const allowed = student && classData.students.some((s) => {
                const id = s?._id ? s._id.toString() : s?.toString();
                return id === student._id.toString();
            });
            if (!allowed) {
                return res.status(403).json({ msg: 'Not authorized to view this class' });
            }
        } else if (req.user.role === 'parent') {
            const parent = await Parent.findOne({ userId: req.user.id });
            if (!parent?.studentId) {
                return res.status(403).json({ msg: 'Not authorized to view this class' });
            }
            const student = await Student.findOne({ studentId: parent.studentId });
            const allowed = student && classData.students.some((s) => {
                const id = s?._id ? s._id.toString() : s?.toString();
                return id === student._id.toString();
            });
            if (!allowed) {
                return res.status(403).json({ msg: 'Not authorized to view this class' });
            }
        }
        res.json(classData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create class
// @route   POST /api/classes
// @access  Private (Admin)
exports.createClass = async (req, res) => {
    const { name, teacher, students, schedule } = req.body;

    try {
        const newClass = new Class({
            name,
            teacher,
            students,
            schedule
        });

        const classData = await newClass.save();
        res.json(classData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update class (Assign teacher/students)
// @route   PUT /api/classes/:id
// @access  Private (Admin)
exports.updateClass = async (req, res) => {
    const { name, teacher, students, schedule } = req.body;
    const classFields = {};
    if (name) classFields.name = name;
    if (teacher) classFields.teacher = teacher;
    if (students) classFields.students = students; // Expecting array of Student ObjectIds
    if (schedule) classFields.schedule = schedule;

    try {
        let classData = await Class.findById(req.params.id);
        if (!classData) return res.status(404).json({ msg: 'Class not found' });

        classData = await Class.findByIdAndUpdate(
            req.params.id,
            { $set: classFields },
            { new: true }
        );
        res.json(classData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
exports.deleteClass = async (req, res) => {
    try {
        let classData = await Class.findById(req.params.id);
        if (!classData) return res.status(404).json({ msg: 'Class not found' });

        await Class.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Class removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
