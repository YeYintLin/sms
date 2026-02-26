const messages = {
    en: {
        common: {
            server_error: 'Server Error'
        },
        auth: {
            user_exists: 'User already exists',
            invalid_credentials: 'Invalid Credentials',
            account_disabled: 'Account disabled',
            banned_until: 'Banned until {{date}}',
            account_locked_until: 'Too many failed attempts. Try again after {{date}}',
            too_many_requests: 'Too many requests. Please try again later.',
            user_not_found: 'User not found',
            no_token: 'No token, authorization denied',
            invalid_token: 'Token is not valid'
        },
        role: {
            unauthorized: 'Role {{role}} is not authorized to access this resource'
        },
        ai: {
            messages_array_required: 'messages must be an array',
            ask_grade: 'Which grade do you want the attendance result for? [action:Attendance]',
            missing_grade: 'I could not find your grade. Please contact admin. [action:Attendance]',
            attendance_summary: 'Attendance for {{grade}}{{classroom}} on {{date}}: {{percent}}% present ({{present}}/{{total}}). Absent: {{absent}}. Late: {{late}}. [action:Attendance]',
            none: 'None',
            service_error: 'AI service error'
        }
    },
    mm: {
        common: {
            server_error: 'ဆာဗာ အမှားဖြစ်ပွားပါသည်'
        },
        auth: {
            user_exists: 'အသုံးပြုသူ ရှိပြီးသားဖြစ်သည်',
            invalid_credentials: 'အကောင့်အချက်အလက် မမှန်ကန်ပါ',
            account_disabled: 'အကောင့်ပိတ်ထားပါသည်',
            banned_until: '{{date}} အထိ အသုံးပြုခွင့်ပိတ်ထားသည်',
            account_locked_until: 'မှားယွင်းဝင်ရောက်မှုများလွန်းနေပါသည်။ {{date}} နောက်ပိုင်း ပြန်ကြိုးစားပါ။',
            too_many_requests: 'တောင်းဆိုမှုများလွန်းနေပါသည်။ နောက်မှ ပြန်ကြိုးစားပါ။',
            user_not_found: 'အသုံးပြုသူ မတွေ့ပါ',
            no_token: 'တိုကင် မရှိသဖြင့် အတည်ပြုခွင့် မရပါ',
            invalid_token: 'တိုကင် မမှန်ကန်ပါ'
        },
        role: {
            unauthorized: 'ဤရင်းမြစ်ကို {{role}} အခန်းကဏ္ဍဖြင့် အသုံးပြုခွင့်မရှိပါ'
        },
        ai: {
            messages_array_required: 'messages သည် array ဖြစ်ရမည်',
            ask_grade: 'ဘယ်တန်း၏ တက်ရောက်မှုရလဒ်ကို လိုချင်ပါသလဲ? [action:Attendance]',
            missing_grade: 'သင့်တန်းအချက်အလက် မတွေ့ပါ။ admin ကိုဆက်သွယ်ပါ။ [action:Attendance]',
            attendance_summary: '{{date}} တွင် {{grade}}{{classroom}} ၏ တက်ရောက်မှု: {{percent}}% ({{present}}/{{total}})။ ပျက်ကွက်: {{absent}}။ နောက်ကျ: {{late}}။ [action:Attendance]',
            none: 'မရှိ',
            service_error: 'AI ဝန်ဆောင်မှု အမှားဖြစ်ပွားပါသည်'
        }
    }
};

const DEFAULT_LANG = 'en';

const interpolate = (template, params = {}) => {
    return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => String(params[key] ?? ''));
};

const getByPath = (obj, path) => {
    return String(path)
        .split('.')
        .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

const normalizeLang = (langRaw) => {
    const value = String(langRaw || '').toLowerCase();
    if (value.startsWith('my') || value.startsWith('mm')) return 'mm';
    return DEFAULT_LANG;
};

const resolveLangFromReq = (req) => {
    const byHeader = req.header('x-lang');
    if (byHeader) return normalizeLang(byHeader);
    const acceptLanguage = req.header('accept-language');
    return normalizeLang(acceptLanguage);
};

const t = (req, key, params = {}) => {
    const lang = req?.lang || resolveLangFromReq(req);
    const localized = getByPath(messages[lang], key);
    const fallback = getByPath(messages[DEFAULT_LANG], key);
    const value = localized ?? fallback ?? key;
    return typeof value === 'string' ? interpolate(value, params) : value;
};

module.exports = {
    t,
    resolveLangFromReq
};
