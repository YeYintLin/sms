const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const isPresentString = (value) => typeof value === 'string' && value.trim().length > 0;
const isOptionalString = (value) => value === undefined || (typeof value === 'string' && value.trim().length > 0);

const normalizeDate = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildErrors = (checks) => {
    const errors = [];
    for (const check of checks) {
        if (!check.predicate()) {
            errors.push({ field: check.field, message: check.message });
        }
    }
    return errors;
};

const respondIfInvalid = (req, res, errors) => {
    if (errors.length === 0) {
        return null;
    }
    return res.status(400).json({
        errors: errors.reduce((acc, { field, message }) => {
            acc[field] = acc[field] || [];
            acc[field].push(message);
            return acc;
        }, {})
    });
};

const validateStudentCreate = (req, res, next) => {
    const { name, email, password, grade, studentId, birthday } = req.body;

    const errors = buildErrors([
        {
            field: 'name',
            message: 'Name is required',
            predicate: () => isPresentString(name)
        },
        {
            field: 'email',
            message: 'A valid email is required',
            predicate: () => typeof email === 'string' && emailRegex.test(email)
        },
        {
            field: 'password',
            message: 'Password must be at least 6 characters',
            predicate: () => typeof password === 'string' && password.length >= 6
        },
        {
            field: 'grade',
            message: 'Grade is required',
            predicate: () => isPresentString(grade)
        },
        {
            field: 'studentId',
            message: 'Student ID is required',
            predicate: () => isPresentString(studentId)
        },
        {
            field: 'birthday',
            message: 'Birthday must be a valid date',
            predicate: () => birthday === undefined || normalizeDate(birthday) !== null
        }
    ]);

    if (respondIfInvalid(req, res, errors)) {
        return;
    }

    next();
};

const validateStudentUpdate = (req, res, next) => {
    const { name, email, grade, classroom, contact, age, birthday } = req.body;

    const errors = buildErrors([
        {
            field: 'name',
            message: 'If provided, name must be filled in',
            predicate: () => name === undefined || isPresentString(name)
        },
        {
            field: 'email',
            message: 'If provided, email must be valid',
            predicate: () => email === undefined || (typeof email === 'string' && emailRegex.test(email))
        },
        {
            field: 'grade',
            message: 'If provided, grade must not be empty',
            predicate: () => grade === undefined || isPresentString(grade)
        },
        {
            field: 'classroom',
            message: 'If provided, classroom must not be empty',
            predicate: () => classroom === undefined || isOptionalString(classroom)
        },
        {
            field: 'contact',
            message: 'If provided, contact must not be empty',
            predicate: () => contact === undefined || isOptionalString(contact)
        },
        {
            field: 'age',
            message: 'If provided, age must be a number',
            predicate: () => age === undefined || !Number.isNaN(Number(age))
        },
        {
            field: 'birthday',
            message: 'If provided, birthday must be a valid date',
            predicate: () => birthday === undefined || normalizeDate(birthday) !== null
        }
    ]).filter((item) => item !== undefined);

    if (respondIfInvalid(req, res, errors)) {
        return;
    }

    next();
};

module.exports = {
    validateStudentCreate,
    validateStudentUpdate
};
