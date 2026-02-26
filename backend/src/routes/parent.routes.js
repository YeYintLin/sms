const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parent.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

// @route   GET /api/parents
// @desc    Get all parents
// @access  Private (Admin, Teacher)
router.get('/', auth, roleCheck(['admin', 'teacher']), parentController.getParents);

// @route   GET /api/parents/:id
// @desc    Get parent by ID
// @access  Private
router.get('/:id', auth, parentController.getParent);

// @route   POST /api/parents
// @desc    Create parent
// @access  Private (Admin)
router.post('/', auth, roleCheck(['admin']), parentController.createParent);

// @route   PUT /api/parents/:id
// @desc    Update parent
// @access  Private (Admin)
router.put('/:id', auth, roleCheck(['admin']), parentController.updateParent);

// @route   DELETE /api/parents/:id
// @desc    Delete parent
// @access  Private (Admin)
router.delete('/:id', auth, roleCheck(['admin']), parentController.deleteParent);

module.exports = router;
