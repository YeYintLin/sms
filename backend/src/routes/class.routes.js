const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { validateClassCreate, validateClassUpdate } = require('../middleware/class.validation');
const validate = require('../middleware/validate.middleware');

router.get('/', auth, classController.getClasses);
router.get('/:id', auth, roleCheck(['admin', 'teacher', 'student', 'parent']), classController.getClass);

router.post('/', auth, roleCheck(['admin']), validateClassCreate, validate, classController.createClass);
router.put('/:id', auth, roleCheck(['admin']), validateClassUpdate, validate, classController.updateClass);
router.delete('/:id', auth, roleCheck(['admin']), classController.deleteClass);

module.exports = router;
