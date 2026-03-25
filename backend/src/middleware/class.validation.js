const { body } = require('express-validator');

const validateClassCreate = [
    body('name')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    body('teacher')
        .optional()
        .isMongoId()
        .withMessage('teacher must be a valid id'),
    body('students')
        .optional()
        .isArray()
        .withMessage('students must be an array'),
    body('students.*')
        .optional()
        .isMongoId()
        .withMessage('Each student id must be valid'),
    body('schedule')
        .optional()
        .isString()
        .trim()
];

const validateClassUpdate = [
    body('name')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Name must not be empty'),
    body('teacher')
        .optional()
        .isMongoId()
        .withMessage('teacher must be a valid id'),
    body('students')
        .optional()
        .isArray()
        .withMessage('students must be an array'),
    body('students.*')
        .optional()
        .isMongoId()
        .withMessage('Each student id must be valid'),
    body('schedule')
        .optional()
        .isString()
        .trim()
];

module.exports = {
    validateClassCreate,
    validateClassUpdate
};
