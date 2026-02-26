const Teacher = require('../models/Teacher');
const User = require('../models/User');
const Student = require('../models/Student');
const Parent = require('../models/Parent');

const getUserClassroomContext = async (req) => {
    if (req.user.role === 'teacher') {
        const teacher = await Teacher.findOne({ userId: req.user.id });
        return {
            grade: teacher?.grade || null,
            classroom: teacher?.classroom || null
        };
    }
    if (req.user.role === 'student') {
        const student = await Student.findOne({ userId: req.user.id });
        return {
            grade: student?.grade || null,
            classroom: student?.classroom || null
        };
    }
    if (req.user.role === 'parent') {
        const parent = await Parent.findOne({ userId: req.user.id });
        if (!parent?.studentId) return { grade: null, classroom: null };
        const student = await Student.findOne({ studentId: parent.studentId });
        return {
            grade: student?.grade || null,
            classroom: student?.classroom || null
        };
    }
    return { grade: null, classroom: null };
};

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
exports.getTeachers = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'teacher' || req.user.role === 'student' || req.user.role === 'parent') {
            const { grade, classroom } = await getUserClassroomContext(req);
            if (!grade) return res.json([]);
            query = classroom ? { grade, classroom } : { grade };
        }
        const teachers = await Teacher.find(query).populate('userId', ['name', 'email']);
        res.json(teachers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Private
exports.getTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).populate('userId', ['name', 'email']);
        if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });
        if (req.user.role === 'teacher' || req.user.role === 'student' || req.user.role === 'parent') {
            const { grade, classroom } = await getUserClassroomContext(req);
            if (!grade || teacher.grade !== grade) {
                return res.status(403).json({ msg: 'Not authorized to view this teacher' });
            }
            if (classroom && teacher.classroom !== classroom) {
                return res.status(403).json({ msg: 'Not authorized to view this teacher' });
            }
        }
        res.json(teacher);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create new teacher (and user)
// @route   POST /api/teachers
// @access  Private (Admin)
exports.createTeacher = async (req, res) => {
    const { name, email, password, subject, grade, classroom, experience, contact, birthday } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({
            name,
            email,
            password,
            role: 'teacher'
        });

        await user.save();

        const teacher = new Teacher({
            userId: user.id,
            subject,
            grade,
            classroom,
            experience,
            contact,
            birthday: birthday ? new Date(birthday) : undefined
        });

        await teacher.save();
        res.json(teacher);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private (Admin)
exports.updateTeacher = async (req, res) => {
    const { name, email, subject, grade, classroom, experience, contact, birthday } = req.body;
    const teacherFields = {};
    if (subject) teacherFields.subject = subject;
    if (grade) teacherFields.grade = grade;
    if (classroom !== undefined) teacherFields.classroom = classroom;
    if (experience) teacherFields.experience = experience;
    if (contact) teacherFields.contact = contact;
    if (birthday !== undefined) teacherFields.birthday = birthday ? new Date(birthday) : null;

    try {
        let teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

        // Update User model if name or email is provided
        if (name || email) {
            const userFields = {};
            if (name) userFields.name = name;
            if (email) userFields.email = email;
            await User.findByIdAndUpdate(teacher.userId, { $set: userFields });
        }

        teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { $set: teacherFields },
            { new: true }
        ).populate('userId', ['name', 'email']);
        res.json(teacher);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private (Admin)
exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

        await User.findByIdAndDelete(teacher.userId);
        await Teacher.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Teacher removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
