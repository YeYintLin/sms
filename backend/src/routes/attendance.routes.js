const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/role.middleware');
const attendanceController = require('../controllers/attendance.controller');

// @route   GET /api/attendance
router.get('/', auth, roleCheck(['admin', 'teacher']), attendanceController.getAttendance);

// @route   GET /api/attendance/weekly
router.get('/weekly', auth, attendanceController.getWeeklyOverview);

// @route   POST /api/attendance
router.post('/', auth, roleCheck(['admin', 'teacher']), attendanceController.saveAttendance);

// @route   GET /api/attendance/report
router.get('/report', auth, roleCheck(['admin', 'teacher']), attendanceController.getStudentReport);

module.exports = router;
