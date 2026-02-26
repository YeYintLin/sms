const { resolveLangFromReq } = require('../i18n');

module.exports = (req, _res, next) => {
    req.lang = resolveLangFromReq(req);
    next();
};

