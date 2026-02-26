const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');

// @desc    Get students, teachers, and parents
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['student', 'teacher', 'parent'] } }).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user restrictions
// @route   PATCH /api/admin/users/:id/restrictions
// @access  Private (Admin)
exports.updateRestrictions = async (req, res) => {
    try {
        const { isDisabled, bannedUntil, blockedPages, permissionsOverride } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!['student', 'teacher', 'parent'].includes(user.role)) {
            return res.status(400).json({ msg: 'Only student/teacher/parent can be restricted' });
        }

        if (typeof isDisabled === 'boolean') user.isDisabled = isDisabled;
        if (bannedUntil === null || typeof bannedUntil === 'string') {
            user.bannedUntil = bannedUntil ? new Date(bannedUntil) : null;
        }
        if (Array.isArray(blockedPages)) user.blockedPages = blockedPages;
        if (permissionsOverride && typeof permissionsOverride === 'object') {
            user.permissionsOverride = permissionsOverride;
        }

        await user.save();
        res.json({
            _id: user.id,
            role: user.role,
            name: user.name,
            email: user.email,
            isDisabled: user.isDisabled,
            bannedUntil: user.bannedUntil,
            blockedPages: user.blockedPages,
            permissionsOverride: user.permissionsOverride
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete user account
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!['student', 'teacher', 'parent'].includes(user.role)) {
            return res.status(400).json({ msg: 'Only student/teacher/parent accounts can be deleted' });
        }

        if (user.role === 'student') {
            await Student.findOneAndDelete({ userId: user.id });
        } else if (user.role === 'teacher') {
            await Teacher.findOneAndDelete({ userId: user.id });
        } else if (user.role === 'parent') {
            await Parent.findOneAndDelete({ userId: user.id });
        }

        await User.findByIdAndDelete(user.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Reset user password
// @route   PATCH /api/admin/users/:id/password
// @access  Private (Admin)
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || String(newPassword).length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        if (!['student', 'teacher', 'parent'].includes(user.role)) {
            return res.status(400).json({ msg: 'Only student/teacher/parent accounts can be reset' });
        }

        user.password = newPassword;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        res.json({ msg: 'Password reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
