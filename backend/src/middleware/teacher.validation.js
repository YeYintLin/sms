const { body } = require('express-validator');

const validateTeacherCreate = [
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
    body('subject')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Subject is required'),
    body('grade')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Grade is required'),
    body('contact')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Contact is required'),
    body('classroom')
        .optional()
        .isString()
        .trim(),
    body('experience')
        .optional()
        .isString()
        .trim(),
    body('birthday')
        .optional()
        .isISO8601()
        .withMessage('Birthday must be a valid date')
        .toDate()
];

const validateTeacherUpdate = [
    body('name').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
    body('subject').optional().isString().trim(),
    body('grade').optional().isString().trim(),
    body('contact').optional().isString().trim(),
    body('classroom').optional().isString().trim(),
    body('experience').optional().isString().trim(),
    body('birthday').optional().isISO8601().withMessage('Birthday must be a valid date').toDate()
];

module.exports = {
    validateTeacherCreate,
    validateTeacherUpdate
};
