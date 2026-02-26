const File = require('../models/File');
const User = require('../models/User');
const { t } = require('../i18n');

const getTypeFromFile = (file) => {
    const mime = (file.mimetype || '').toLowerCase();
    const name = (file.originalname || '').toLowerCase();
    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'IMG';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'PDF';
    if (mime.includes('word') || /\.(doc|docx)$/.test(name)) return 'DOC';
    if (mime.includes('excel') || /\.(xls|xlsx|csv)$/.test(name)) return 'XLS';
    return 'FILE';
};

const canAccessFile = (req, file) => {
    if (!req.user || !file) return false;
    if (req.user.role === 'admin') return true;
    return String(file.uploadedBy) === String(req.user.id);
};

// @desc    Get all files
// @route   GET /api/files
// @access  Private
exports.getFiles = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { uploadedBy: req.user.id };
        const files = await File.find(query).sort({ createdAt: -1 });
        res.json(files);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    Upload a file
// @route   POST /api/files
// @access  Private
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id).select('name');
        const displayName = typeof req.body.name === 'string' && req.body.name.trim().length > 0
            ? req.body.name.trim()
            : req.file.originalname;

        const fileDoc = new File({
            name: displayName,
            originalName: req.file.originalname,
            type: getTypeFromFile(req.file),
            mimeType: req.file.mimetype || '',
            size: req.file.size,
            owner: user ? user.name : 'Unknown',
            uploadedBy: req.user.id,
            data: req.file.buffer
        });

        const saved = await fileDoc.save();
        const response = saved.toObject();
        delete response.data;
        res.json(response);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    Download a file
// @route   GET /api/files/:id/download
// @access  Private
exports.downloadFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id).select('+data');
        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }
        if (!canAccessFile(req, file)) {
            return res.status(403).json({ msg: 'Not authorized to access this file' });
        }

        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.send(file.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    View a file in browser
// @route   GET /api/files/:id/view
// @access  Private
exports.viewFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id).select('+data');
        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }
        if (!canAccessFile(req, file)) {
            return res.status(403).json({ msg: 'Not authorized to access this file' });
        }

        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
        res.send(file.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};

// @desc    Delete a file
// @route   DELETE /api/files/:id
// @access  Private
exports.deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) {
            return res.status(404).json({ msg: 'File not found' });
        }
        if (!canAccessFile(req, file)) {
            return res.status(403).json({ msg: 'Not authorized to delete this file' });
        }

        await File.findByIdAndDelete(req.params.id);
        res.json({ msg: 'File deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'common.server_error') });
    }
};
