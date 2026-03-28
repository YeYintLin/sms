const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const { t } = require('../i18n');

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { name, email, password, role, parentName, registerNumber, dateOfBirth, grade, subject, contact, classroom, experience } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: t(req, 'auth.user_exists') });
        }

        const allowedPublicRoles = ['student', 'teacher'];
        const safeRole = allowedPublicRoles.includes(role) ? role : 'student';

        user = new User({
            name,
            email,
            password,
            role: safeRole,
            parentName: typeof parentName === 'string' ? parentName.trim() : '',
            registerNumber: typeof registerNumber === 'string' ? registerNumber.trim() : '',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
        });

        await user.save();
        try {
            if (safeRole === 'student') {
                const studentId = typeof registerNumber === 'string' ? registerNumber.trim() : '';
                const studentGrade = typeof grade === 'string' ? grade.trim() : '';
                if (!studentId || !studentGrade) {
                    throw new Error('Student registration requires registerNumber and grade');
                }
                const student = new Student({
                    userId: user.id,
                    studentId,
                    grade: studentGrade,
                    classroom: typeof classroom === 'string' ? classroom.trim() : '',
                    birthday: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    contact: typeof contact === 'string' ? contact.trim() : ''
                });
                await student.save();
            }

            if (safeRole === 'teacher') {
                const teacherGrade = typeof grade === 'string' ? grade.trim() : '';
                const teacherSubject = typeof subject === 'string' ? subject.trim() : '';
                const teacherContact = typeof contact === 'string' ? contact.trim() : '';
                if (!teacherGrade || !teacherSubject || !teacherContact) {
                    throw new Error('Teacher registration requires grade, subject, and contact');
                }
                const teacher = new Teacher({
                    userId: user.id,
                    subject: teacherSubject,
                    grade: teacherGrade,
                    classroom: typeof classroom === 'string' ? classroom.trim() : '',
                    experience: typeof experience === 'string' ? experience.trim() : '',
                    contact: teacherContact,
                    birthday: dateOfBirth ? new Date(dateOfBirth) : undefined
                });
                await teacher.save();
            }
        } catch (profileErr) {
            await User.findByIdAndDelete(user.id);
            return res.status(400).json({ msg: profileErr.message || 'Profile creation failed' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 360000 * 1000
                });
                res.json({ role: user.role, name: user.name });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!password || String(password).length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: t(req, 'auth.invalid_credentials') });
        }

        if (user.lockUntil && user.lockUntil > new Date()) {
            return res.status(429).json({
                msg: t(req, 'auth.account_locked_until', {
                    date: user.lockUntil.toISOString()
                })
            });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
                user.failedLoginAttempts = 0;
                await user.save();
                return res.status(429).json({
                    msg: t(req, 'auth.account_locked_until', {
                        date: user.lockUntil.toISOString()
                    })
                });
            }
            await user.save();
            return res.status(400).json({ msg: t(req, 'auth.invalid_credentials') });
        }

        if (user.failedLoginAttempts || user.lockUntil) {
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
            await user.save();
        }

        if ((user.role === 'student' || user.role === 'teacher') && user.isDisabled) {
            return res.status(403).json({ msg: t(req, 'auth.account_disabled') });
        }

        if ((user.role === 'student' || user.role === 'teacher') && user.bannedUntil && user.bannedUntil > new Date()) {
            return res.status(403).json({
                msg: t(req, 'auth.banned_until', { date: user.bannedUntil.toISOString() })
            });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 360000 * 1000
                });
                res.json({
                    role: user.role,
                    name: user.name,
                    restrictions: {
                        isDisabled: user.isDisabled,
                        bannedUntil: user.bannedUntil,
                        blockedPages: user.blockedPages || [],
                        permissionsOverride: user.permissionsOverride || {}
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    Get logged in user with profile data
// @route   GET /api/auth/me
// @access  Private
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: t(req, 'auth.user_not_found') });
        }

        let profileData = null;

        if (user.role === 'student') {
            profileData = await Student.findOne({ userId: user.id });
        } else if (user.role === 'teacher') {
            profileData = await Teacher.findOne({ userId: user.id });
        }

        res.json({
            ...user._doc,
            profile: profileData
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    Update logged in user profile data
// @route   PUT /api/auth/me
// @access  Private
exports.updateUser = async (req, res) => {
    try {
        const { name, avatarUrl, coverUrl, email, contact, department } = req.body;

        const update = {};
        const isStaff = ['admin', 'teacher'].includes(req.user.role);
        if (typeof name === 'string' && name.trim().length > 0) {
            update.name = name.trim();
        }
        if (typeof avatarUrl === 'string') {
            update.avatarUrl = avatarUrl.trim();
        }
        if (typeof coverUrl === 'string') {
            update.coverUrl = coverUrl.trim();
        }
        if (isStaff) {
            if (typeof email === 'string' && email.trim().length > 0) {
                update.email = email.trim();
            }
            if (typeof department === 'string') {
                update.department = department.trim();
            }
        }
        if (typeof contact === 'string') {
            update.contact = contact.trim();
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: update },
            { new: true, runValidators: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({ msg: t(req, 'auth.user_not_found') });
        }

        let profileData = null;
        if (user.role === 'student') {
            if (typeof contact === 'string') {
                await Student.findOneAndUpdate(
                    { userId: user.id },
                    { $set: { contact: contact.trim() } },
                    { new: true }
                );
            }
            profileData = await Student.findOne({ userId: user.id });
        } else if (user.role === 'teacher') {
            if (typeof contact === 'string') {
                await Teacher.findOneAndUpdate(
                    { userId: user.id },
                    { $set: { contact: contact.trim() } },
                    { new: true }
                );
            }
            profileData = await Teacher.findOne({ userId: user.id });
        }

        res.json({
            ...user._doc,
            profile: profileData
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    Logout user (clear auth cookie)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.status(204).send();
};
