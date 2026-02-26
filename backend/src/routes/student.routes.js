const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const { validateStudentCreate, validateStudentUpdate } = require('../middleware/student.validation');

// @route   GET /api/students
// @desc    Get all students
// @access  Private (Admin, Teacher, Student, Parent)
router.get('/', auth, roleCheck(['admin', 'teacher', 'student', 'parent']), studentController.getStudents);

// @route   GET /api/students/stats
// @desc    Get student stats
// @access  Private
router.get('/stats', auth, studentController.getStudentStats);

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', auth, studentController.getStudent);

// @route   POST /api/students
// @desc    Create student
// @access  Private (Admin)
router.post('/', auth, roleCheck(['admin']), validateStudentCreate, studentController.createStudent);

// @route   PUT /api/students/:id
// @desc    Update student
// @access  Private (Admin)
router.put('/:id', auth, roleCheck(['admin']), validateStudentUpdate, studentController.updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete student
// @access  Private (Admin)
router.delete('/:id', auth, roleCheck(['admin']), studentController.deleteStudent);

module.exports = router;
