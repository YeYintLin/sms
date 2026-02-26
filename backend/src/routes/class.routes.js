const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

router.get('/', auth, classController.getClasses);
router.get('/:id', auth, classController.getClass);

router.post('/', auth, roleCheck(['admin']), classController.createClass);
router.put('/:id', auth, roleCheck(['admin']), classController.updateClass);
router.delete('/:id', auth, roleCheck(['admin']), classController.deleteClass);

module.exports = router;
