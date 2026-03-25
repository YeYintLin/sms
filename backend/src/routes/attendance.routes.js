const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const attendanceController = require('../controllers/attendance.controller');
const { validateAttendanceQuery, validateAttendanceSave, validateAttendanceReport } = require('../middleware/attendance.validation');
const validate = require('../middleware/validate.middleware');

// @route   GET /api/attendance
router.get('/', auth, roleCheck(['admin', 'teacher']), validateAttendanceQuery, validate, attendanceController.getAttendance);

// @route   GET /api/attendance/weekly
router.get('/weekly', auth, attendanceController.getWeeklyOverview);

// @route   POST /api/attendance
router.post('/', auth, roleCheck(['admin', 'teacher']), validateAttendanceSave, validate, attendanceController.saveAttendance);

// @route   GET /api/attendance/report
router.get('/report', auth, roleCheck(['admin', 'teacher']), validateAttendanceReport, validate, attendanceController.getStudentReport);

module.exports = router;
