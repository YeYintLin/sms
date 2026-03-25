const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { validateTeacherCreate, validateTeacherUpdate } = require('../middleware/teacher.validation');
const validate = require('../middleware/validate.middleware');

// Public or Private? Let's keep it private for now
router.get('/', auth, teacherController.getTeachers);
router.get('/:id', auth, teacherController.getTeacher);

// Only Admin can manage teachers
router.post('/', auth, roleCheck(['admin']), validateTeacherCreate, validate, teacherController.createTeacher);
router.put('/:id', auth, roleCheck(['admin']), validateTeacherUpdate, validate, teacherController.updateTeacher);
router.delete('/:id', auth, roleCheck(['admin']), teacherController.deleteTeacher);

module.exports = router;
