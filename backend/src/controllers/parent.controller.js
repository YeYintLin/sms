const Parent = require('../models/Parent');
const User = require('../models/User');

// @desc    Get all parents
// @route   GET /api/parents
// @access  Private (Admin, Teacher)
exports.getParents = async (req, res) => {
    try {
        const parents = await Parent.find().populate('userId', ['name', 'email']);
        res.json(parents);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get parent by ID
// @route   GET /api/parents/:id
// @access  Private
exports.getParent = async (req, res) => {
    try {
        const parent = await Parent.findOne({ parentId: req.params.id }).populate('userId', ['name', 'email']);
        if (!parent) return res.status(404).json({ msg: 'Parent not found' });
        if (req.user.role === 'parent' && parent.userId && parent.userId._id.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to view this parent' });
        }
        res.json(parent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create new parent
// @route   POST /api/parents
// @access  Private (Admin)
exports.createParent = async (req, res) => {
    const { name, email, password, parentId, studentId, grade, contact, birthday } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({
            name,
            email,
            password,
            role: 'parent'
        });
        await user.save();

        const parent = new Parent({
            userId: user.id,
            parentId,
            studentId,
            grade,
            contact,
            birthday: birthday ? new Date(birthday) : undefined
        });
        await parent.save();

        res.json(parent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update parent
// @route   PUT /api/parents/:id
// @access  Private (Admin)
exports.updateParent = async (req, res) => {
    const { name, email, studentId, grade, contact, birthday } = req.body;

    const parentFields = {};
    if (studentId !== undefined) parentFields.studentId = studentId;
    if (grade !== undefined) parentFields.grade = grade;
    if (contact !== undefined) parentFields.contact = contact;
    if (birthday !== undefined) parentFields.birthday = birthday ? new Date(birthday) : null;

    try {
        let parent = await Parent.findOne({ parentId: req.params.id });
        if (!parent) return res.status(404).json({ msg: 'Parent not found' });

        if (name || email) {
            const userFields = {};
            if (name) userFields.name = name;
            if (email) userFields.email = email;
            await User.findByIdAndUpdate(parent.userId, { $set: userFields });
        }

        parent = await Parent.findOneAndUpdate(
            { parentId: req.params.id },
            { $set: parentFields },
            { new: true }
        ).populate('userId', ['name', 'email']);

        res.json(parent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete parent
// @route   DELETE /api/parents/:id
// @access  Private (Admin)
exports.deleteParent = async (req, res) => {
    try {
        const parent = await Parent.findOne({ parentId: req.params.id });
        if (!parent) return res.status(404).json({ msg: 'Parent not found' });

        await User.findByIdAndDelete(parent.userId);
        await Parent.findOneAndDelete({ parentId: req.params.id });
        res.json({ msg: 'Parent removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
