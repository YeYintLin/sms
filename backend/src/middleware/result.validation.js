const { body } = require('express-validator');

const validateResultCreate = [
    body('studentId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('studentId is required'),
    body('term')
        .optional()
        .isString()
        .trim(),
    body('subjects')
        .isArray({ min: 1 })
        .withMessage('subjects must be a non-empty array'),
    body('subjects.*.name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Each subject must have a name'),
    body('subjects.*.score')
        .optional()
        .isNumeric()
        .withMessage('score must be a number')
];

const validateResultUpdate = [
    body('studentId')
        .optional()
        .isString()
        .trim(),
    body('term')
        .optional()
        .isString()
        .trim(),
    body('subjects')
        .optional()
        .isArray({ min: 1 })
        .withMessage('subjects must be a non-empty array'),
    body('subjects.*.name')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Each subject must have a name'),
    body('subjects.*.score')
        .optional()
        .isNumeric()
        .withMessage('score must be a number')
];

module.exports = {
    validateResultCreate,
    validateResultUpdate
};
