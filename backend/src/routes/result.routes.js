const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const resultController = require('../controllers/result.controller');

// @route   GET /api/results
// @desc    Get exam results
// @access  Private
router.get('/', auth, resultController.getResults);
router.post('/', auth, roleCheck(['admin', 'teacher']), resultController.createResult);
router.put('/:id', auth, roleCheck(['admin', 'teacher']), resultController.updateResult);
router.delete('/:id', auth, roleCheck(['admin']), resultController.deleteResult);

module.exports = router;
