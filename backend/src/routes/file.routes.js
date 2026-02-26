const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { uploadRateLimit } = require('../middleware/rateLimit.middleware');

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png'
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png']);

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const isAllowed = ALLOWED_MIME_TYPES.has(mime) && ALLOWED_EXTENSIONS.has(ext);

    if (!isAllowed) {
        const err = new Error('Invalid file type. Allowed: PDF, DOC/DOCX, JPG, PNG.');
        err.statusCode = 400;
        return cb(err);
    }

    return cb(null, true);
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

// @route   GET /api/files
// @desc    Get all files
// @access  Private (Admin, Teacher)
router.get('/', auth, roleCheck(['admin', 'teacher']), fileController.getFiles);

// @route   POST /api/files
// @desc    Upload a file
// @access  Private (Admin, Teacher)
router.post('/', auth, roleCheck(['admin', 'teacher']), uploadRateLimit, upload.single('file'), fileController.uploadFile);

// @route   GET /api/files/:id/download
// @desc    Download a file
// @access  Private (Admin, Teacher)
router.get('/:id/download', auth, roleCheck(['admin', 'teacher']), fileController.downloadFile);

// @route   GET /api/files/:id/view
// @desc    View a file
// @access  Private (Admin, Teacher)
router.get('/:id/view', auth, roleCheck(['admin', 'teacher']), fileController.viewFile);

// @route   DELETE /api/files/:id
// @desc    Delete a file
// @access  Private (Admin, Teacher)
router.delete('/:id', auth, roleCheck(['admin', 'teacher']), fileController.deleteFile);

router.use((err, req, res, next) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ msg: 'File is too large. Max size is 10MB.' });
        }
        return res.status(400).json({ msg: err.message || 'File upload failed.' });
    }

    if (err.statusCode) {
        return res.status(err.statusCode).json({ msg: err.message });
    }

    return res.status(500).json({ msg: t(req, 'common.server_error') });
});

module.exports = router;
