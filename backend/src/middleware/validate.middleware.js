const { validationResult } = require('express-validator');

const formatErrors = (errors) => {
    return errors.reduce((acc, err) => {
        const field = err.param || err.path || 'general';
        if (!acc[field]) acc[field] = [];
        acc[field].push(err.msg || 'Invalid value');
        return acc;
    }, {});
};

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: formatErrors(errors.array()) });
    }
    return next();
};
