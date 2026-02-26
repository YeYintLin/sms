const Class = require('../models/Class');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
exports.getClasses = async (req, res) => {
    try {
        const classes = await Class.find()
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
