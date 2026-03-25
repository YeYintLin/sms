const { body } = require('express-validator');

const validateUpdateRestrictions = [
    body('isDisabled')
        .optional()
        .isBoolean()
        .withMessage('isDisabled must be a boolean'),
    body('bannedUntil')
        .optional({ nullable: true })
        .custom((value) => value === null || !Number.isNaN(Date.parse(value)))
        .withMessage('bannedUntil must be a valid date or null'),
    body('blockedPages')
        .optional()
        .isArray()
        .withMessage('blockedPages must be an array'),
    body('blockedPages.*')
        .optional()
        .isString()
        .trim(),
    body('permissionsOverride')
        .optional()
        .isObject()
        .withMessage('permissionsOverride must be an object')
];

const validateResetPassword = [
    body('newPassword')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
];

module.exports = {
    validateUpdateRestrictions,
    validateResetPassword
};
