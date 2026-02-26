const { t } = require('../i18n');

const roleCheck = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                msg: t(req, 'role.unauthorized', { role: req.user.role })
            });
        }
        next();
    };
};

module.exports = roleCheck;
