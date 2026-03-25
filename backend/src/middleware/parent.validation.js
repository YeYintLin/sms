const { body } = require('express-validator');

const validateParentCreate = [
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
    body('parentId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('parentId is required'),
    body('studentId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('studentId is required'),
    body('grade')
        .optional()
        .isString()
        .trim(),
    body('contact')
        .optional()
        .isString()
        .trim(),
    body('birthday')
        .optional()
        .isISO8601()
        .withMessage('Birthday must be a valid date')
        .toDate()
];

const validateParentUpdate = [
    body('name').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
    body('studentId').optional().isString().trim(),
    body('grade').optional().isString().trim(),
    body('contact').optional().isString().trim(),
    body('birthday').optional().isISO8601().withMessage('Birthday must be a valid date').toDate()
];

module.exports = {
    validateParentCreate,
    validateParentUpdate
};
