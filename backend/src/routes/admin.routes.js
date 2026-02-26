const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');

router.get('/users', auth, roleCheck(['admin']), adminController.getUsers);
router.patch('/users/:id/restrictions', auth, roleCheck(['admin']), adminController.updateRestrictions);
router.patch('/users/:id/password', auth, roleCheck(['admin']), adminController.resetPassword);
router.delete('/users/:id', auth, roleCheck(['admin']), adminController.deleteUser);

module.exports = router;
