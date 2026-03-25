const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const resultController = require('../controllers/result.controller');
const { validateResultCreate, validateResultUpdate } = require('../middleware/result.validation');
const validate = require('../middleware/validate.middleware');

// @route   GET /api/results
// @desc    Get exam results
// @access  Private
router.get('/', auth, resultController.getResults);
router.post('/', auth, roleCheck(['admin', 'teacher']), validateResultCreate, validate, resultController.createResult);
router.put('/:id', auth, roleCheck(['admin', 'teacher']), validateResultUpdate, validate, resultController.updateResult);
router.delete('/:id', auth, roleCheck(['admin']), resultController.deleteResult);

module.exports = router;
