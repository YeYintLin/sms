const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { validateUpdateRestrictions, validateResetPassword } = require('../middleware/admin.validation');
const validate = require('../middleware/validate.middleware');

router.get('/users', auth, roleCheck(['admin']), adminController.getUsers);
router.patch('/users/:id/restrictions', auth, roleCheck(['admin']), validateUpdateRestrictions, validate, adminController.updateRestrictions);
router.patch('/users/:id/password', auth, roleCheck(['admin']), validateResetPassword, validate, adminController.resetPassword);
router.delete('/users/:id', auth, roleCheck(['admin']), adminController.deleteUser);

module.exports = router;
