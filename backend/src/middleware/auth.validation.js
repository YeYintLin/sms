const { body } = require('express-validator');

const validateRegister = [
    body('name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['student', 'teacher'])
        .withMessage('Role must be student or teacher'),
    body('grade')
        .if(body('role').isIn(['student', 'teacher']))
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Grade is required'),
    body('registerNumber')
        .if(body('role').equals('student'))
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Register number is required'),
    body('subject')
        .if(body('role').equals('teacher'))
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Subject is required'),
    body('contact')
        .if(body('role').equals('teacher'))
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Contact is required'),
    body('parentName')
        .optional()
        .isString()
        .trim(),
    body('registerNumber')
        .optional()
        .isString()
        .trim(),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('dateOfBirth must be a valid date')
        .toDate()
];

const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),
    body('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

const validateUpdateUser = [
    body('name').optional().isString().trim(),
    body('avatarUrl').optional().isString().trim(),
    body('coverUrl').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
    body('contact').optional().isString().trim(),
    body('department').optional().isString().trim()
];

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateUser
};
