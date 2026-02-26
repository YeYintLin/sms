const Student = require('../models/Student');
const User = require('../models/User');
const { getUserClassroomContext } = require('../services/classroomContext.service');

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin, Teacher)
exports.getStudents = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limitParam = Number.parseInt(req.query.limit, 10);
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;
        const skip = (page - 1) * limit;
        let query = {};
        if (req.user.role === 'teacher' || req.user.role === 'student' || req.user.role === 'parent') {
            const { grade, classroom, studentId } = await getUserClassroomContext(req);
            if (req.user.role === 'parent') {
                if (!studentId) {
                    return res.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
                }
                query = { studentId };
            } else {
                if (!grade) {
                    return res.json({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
                }
                query = classroom ? { grade, classroom } : { grade };
            }
        } else if (req.user.role === 'admin') {
            const gradeFilter = (req.query.gradeFilter || '').trim();
            const classroomFilter = (req.query.classroomFilter || '').trim();
            if (gradeFilter) {
                query.grade = gradeFilter;
            }
            if (classroomFilter) {
                query.classroom = classroomFilter;
            }
        }

        const [total, students] = await Promise.all([
            Student.countDocuments(query),
            Student.find(query)
                .populate('userId', ['name', 'email'])
                .skip(skip)
                .limit(limit)
        ]);

        const totalPages = limit === 0 ? 0 : Math.max(1, Math.ceil(total / limit));

        res.json({
            data: students,
            meta: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id }).populate('userId', ['name', 'email']);

        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }
        if (req.user.role === 'teacher' || req.user.role === 'student' || req.user.role === 'parent') {
            const { grade, classroom, studentId } = await getUserClassroomContext(req);
            if (req.user.role === 'parent') {
                if (!studentId || student.studentId !== studentId) {
                    return res.status(403).json({ msg: 'Not authorized to view this student' });
                }
            } else if (!grade || student.grade !== grade) {
                return res.status(403).json({ msg: 'Not authorized to view this student' });
            }
            if (req.user.role !== 'parent' && classroom && student.classroom !== classroom) {
                return res.status(403).json({ msg: 'Not authorized to view this student' });
            }
        }
        res.json(student);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin)
exports.createStudent = async (req, res) => {
    const { name, email, password, studentId, grade, classroom, contact, address, age, birthday } = req.body;

    try {
        // 1. Create User
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password, // In real app, generate random password or send via email
            role: 'student'
        });

        await user.save();

        // 2. Create Student Profile
        const student = new Student({
            userId: user.id,
            studentId,
            grade,
            classroom,
            age: age ? parseInt(age) : undefined,
            contact,
            address,
            birthday: birthday ? new Date(birthday) : undefined
        });

        await student.save();

        res.json(student);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin)
exports.updateStudent = async (req, res) => {
    const { name, email, grade, classroom, contact, address, age, birthday } = req.body;

    // Build student object
    const studentFields = {};
    if (grade) studentFields.grade = grade;
    if (classroom !== undefined) studentFields.classroom = classroom;
    if (address !== undefined) studentFields.address = address;
    if (age !== undefined) studentFields.age = parseInt(age);
    if (contact !== undefined) studentFields.contact = contact;
    if (birthday !== undefined) studentFields.birthday = birthday ? new Date(birthday) : null;

    try {
        let student = await Student.findOne({ studentId: req.params.id });
        if (!student) return res.status(404).json({ msg: 'Student not found' });

        // Update User model if name or email is provided
        if (name || email) {
            const userFields = {};
            if (name) userFields.name = name;
            if (email) userFields.email = email;
            await User.findByIdAndUpdate(student.userId, { $set: userFields });
        }

        student = await Student.findOneAndUpdate(
            { studentId: req.params.id },
            { $set: studentFields },
            { new: true }
        ).populate('userId', ['name', 'email']);

        res.json(student);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });

        if (!student) return res.status(404).json({ msg: 'Student not found' });

        // Remove User and Student
        await User.findByIdAndDelete(student.userId);
        await Student.findOneAndDelete({ studentId: req.params.id });

        res.json({ msg: 'Student removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get student stats
// @route   GET /api/students/stats
// @access  Private
exports.getStudentStats = async (req, res) => {
    try {
        const total = await Student.countDocuments();
        const byGradeAgg = await Student.aggregate([
            { $group: { _id: '$grade', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const byGrade = byGradeAgg.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        res.json({ total, byGrade });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
