const { body, query } = require('express-validator');

const validateAttendanceQuery = [
    query('date')
        .exists()
        .withMessage('date is required')
        .bail()
        .isISO8601()
        .withMessage('date must be a valid ISO date'),
    query('grade')
        .optional()
        .isString()
        .trim(),
    query('classroom')
        .optional()
        .isString()
        .trim()
];

const validateAttendanceSave = [
    body('date')
        .exists()
        .withMessage('date is required')
        .bail()
        .isISO8601()
        .withMessage('date must be a valid ISO date'),
    body('grade')
        .optional()
        .isString()
        .trim(),
    body('classroom')
        .optional()
        .isString()
        .trim(),
    body('records')
        .isArray()
        .withMessage('records must be an array'),
    body('records.*.studentId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('studentId is required'),
    body('records.*.status')
        .optional()
        .isIn(['present', 'absent', 'late'])
        .withMessage('status must be present, absent, or late'),
    body('records.*.remark')
        .optional()
        .isString()
        .trim()
];

const validateAttendanceReport = [
    query('from')
        .exists()
        .withMessage('from is required')
        .bail()
        .isISO8601()
        .withMessage('from must be a valid ISO date'),
    query('to')
        .exists()
        .withMessage('to is required')
        .bail()
        .isISO8601()
        .withMessage('to must be a valid ISO date'),
    query('grade')
        .optional()
        .isString()
        .trim(),
    query('classroom')
        .optional()
        .isString()
        .trim(),
    query('format')
        .optional()
        .isString()
        .trim()
];

module.exports = {
    validateAttendanceQuery,
    validateAttendanceSave,
    validateAttendanceReport
};
