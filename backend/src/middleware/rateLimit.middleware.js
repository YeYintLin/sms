const { t } = require('../i18n');

const buckets = new Map();

const now = () => Date.now();

const makeIpKey = (prefix, req) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return `${prefix}:${ip}`;
};

const createRateLimiter = ({ prefix, windowMs, max, keyResolver, messageKey = 'auth.too_many_requests' }) => {
    return (req, res, next) => {
        const key = keyResolver ? keyResolver(prefix, req) : makeIpKey(prefix, req);
        const current = buckets.get(key);
        const ts = now();

        if (!current || current.resetAt <= ts) {
            buckets.set(key, { count: 1, resetAt: ts + windowMs });
            return next();
        }

        current.count += 1;
        if (current.count > max) {
            const retryAfterSeconds = Math.ceil((current.resetAt - ts) / 1000);
            res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
            return res.status(429).json({ msg: t(req, messageKey) });
        }

        return next();
    };
};

const authLoginRateLimit = createRateLimiter({
    prefix: 'auth:login',
    windowMs: 15 * 60 * 1000,
    max: 20
});

const authRegisterRateLimit = createRateLimiter({
    prefix: 'auth:register',
    windowMs: 15 * 60 * 1000,
    max: 10
});

const uploadRateLimit = createRateLimiter({
    prefix: 'files:upload',
    windowMs: 10 * 60 * 1000,
    max: 30,
    keyResolver: (prefix, req) => {
        const userId = req.user?.id || 'anonymous';
        return `${prefix}:${userId}`;
    }
});

module.exports = {
    authLoginRateLimit,
    authRegisterRateLimit,
    uploadRateLimit
};
