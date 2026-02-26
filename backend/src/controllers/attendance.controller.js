const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const {
    getTeacherContext,
    getStudentContext
} = require('../services/classroomContext.service');
const { generateAttendanceReportCsv } = require('../utils/attendanceReport');

const normalizeDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

// @desc    Get attendance by date and grade
// @route   GET /api/attendance
// @access  Private (Admin, Teacher)
exports.getAttendance = async (req, res) => {
    const date = normalizeDate(req.query.date);
    if (!date) return res.status(400).json({ msg: 'Valid date is required' });

    try {
        let grade = req.query.grade || '';
        let classroom = req.query.classroom || '';
        if (req.user.role === 'teacher') {
            const ctx = await getTeacherContext(req.user.id);
            grade = ctx.grade;
            classroom = ctx.classroom || '';
        }
        if (!grade) return res.json({ date, grade: '', classroom: '', records: [] });

        const studentQuery = classroom ? { grade, classroom } : { grade };
        const students = await Student.find(studentQuery).populate('userId', ['name', 'email']);
        const attendanceQuery = classroom ? { date, grade, classroom } : { date, grade };
        const attendance = await Attendance.find(attendanceQuery);

        const byStudent = new Map(attendance.map((a) => [a.student.toString(), a]));
        const records = students.map((s) => {
            const entry = byStudent.get(s._id.toString());
            return {
                studentId: s._id,
                name: s.userId?.name || s.studentId,
                status: entry?.status || 'present',
                remark: entry?.remark || ''
            };
        });

        res.json({ date, grade, classroom, records });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Save attendance for date/grade
// @route   POST /api/attendance
// @access  Private (Admin, Teacher)
exports.saveAttendance = async (req, res) => {
    const { date: dateRaw, grade: gradeRaw, classroom: classroomRaw, records } = req.body;
    const date = normalizeDate(dateRaw);
    if (!date) return res.status(400).json({ msg: 'Valid date is required' });
    if (!Array.isArray(records)) return res.status(400).json({ msg: 'records must be an array' });

    try {
        let grade = gradeRaw || '';
        let classroom = classroomRaw || '';
        if (req.user.role === 'teacher') {
            const ctx = await getTeacherContext(req.user.id);
            grade = ctx.grade;
            classroom = ctx.classroom || '';
        }
        if (!grade) return res.status(400).json({ msg: 'Grade is required' });

        const studentQuery = classroom ? { grade, classroom } : { grade };
        const students = await Student.find(studentQuery);
        const studentIds = new Set(students.map((s) => s._id.toString()));

        const ops = records
            .filter((r) => studentIds.has(String(r.studentId)))
            .map((r) => ({
                updateOne: {
                    filter: { student: r.studentId, date },
                    update: {
                        $set: {
                            grade,
                            classroom,
                            status: r.status,
                            remark: r.remark || '',
                            markedBy: req.user.id
                        }
                    },
                    upsert: true
                }
            }));

        if (ops.length > 0) {
            await Attendance.bulkWrite(ops);
        }

        res.json({ msg: 'Attendance saved', count: ops.length });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Weekly attendance overview (percent present per day)
// @route   GET /api/attendance/weekly
// @access  Private (Admin, Teacher, Student)
exports.getWeeklyOverview = async (req, res) => {
    try {
        let grade = req.query.grade || '';
        let classroom = req.query.classroom || '';
        if (req.user.role === 'teacher') {
            const ctx = await getTeacherContext(req.user.id);
            grade = ctx.grade;
            classroom = ctx.classroom || '';
        } else if (req.user.role === 'student') {
            const ctx = await getStudentContext(req.user.id);
            grade = ctx.grade;
            classroom = ctx.classroom || '';
        }

        const today = normalizeDate(new Date());
        const start = new Date(today);
        start.setDate(start.getDate() - 6);

        let students = [];
        if (grade) {
            const q = classroom ? { grade, classroom } : { grade };
            students = await Student.find(q);
        } else {
            students = await Student.find();
        }
        const studentIds = new Set(students.map((s) => s._id.toString()));
        const total = students.length;

        const records = await Attendance.find({
            date: { $gte: start, $lte: today },
            ...(grade ? { grade } : {}),
            ...(classroom ? { classroom } : {})
        });

        const byDate = new Map();
        for (const r of records) {
            const key = normalizeDate(r.date).toISOString().slice(0, 10);
            if (!byDate.has(key)) byDate.set(key, new Map());
            byDate.get(key).set(r.student.toString(), r.status);
        }

        const days = [];
        for (let i = 0; i < 7; i += 1) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const map = byDate.get(key) || new Map();
            let present = 0;
            for (const id of studentIds) {
                const status = map.get(id) || 'present';
                if (status === 'present') present += 1;
            }
            const percent = total === 0 ? 0 : Math.round((present / total) * 100);
            days.push({
                date: key,
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                percent
            });
        }

        res.json({ grade, classroom, totalStudents: total, days });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Attendance report by student (date range)
// @route   GET /api/attendance/report
// @access  Private (Admin, Teacher)
exports.getStudentReport = async (req, res) => {
    const from = normalizeDate(req.query.from);
    const to = normalizeDate(req.query.to);
    if (!from || !to) return res.status(400).json({ msg: 'Valid from/to dates are required' });
    if (to < from) return res.status(400).json({ msg: 'to must be after from' });

    try {
        let grade = req.query.grade || '';
        let classroom = req.query.classroom || '';
        if (req.user.role === 'teacher') {
            const ctx = await getTeacherContext(req.user.id);
            grade = ctx.grade;
            classroom = ctx.classroom || '';
        }
        if (!grade) return res.json({ grade: '', from, to, rows: [] });

        const studentQuery = classroom ? { grade, classroom } : { grade };
        const studentsList = await Student.find(studentQuery).populate('userId', ['name', 'email']);
        const attendance = await Attendance.find({
            grade,
            ...(classroom ? { classroom } : {}),
            date: { $gte: from, $lte: to }
        });

        const counts = new Map();
        for (const s of studentsList) {
            counts.set(s._id.toString(), { present: 0, absent: 0, late: 0 });
        }

        for (const a of attendance) {
            const key = a.student.toString();
            if (!counts.has(key)) continue;
            const entry = counts.get(key);
            if (a.status === 'present') entry.present += 1;
            if (a.status === 'absent') entry.absent += 1;
            if (a.status === 'late') entry.late += 1;
        }

        const rows = studentsList.map((s) => {
            const entry = counts.get(s._id.toString()) || { present: 0, absent: 0, late: 0 };
            const total = entry.present + entry.absent + entry.late;
            const percent = total === 0 ? 0 : Math.round((entry.present / total) * 100);
            return {
                studentId: s.studentId,
                name: s.userId?.name || s.studentId,
                present: entry.present,
                absent: entry.absent,
                late: entry.late,
                total,
                percent
            };
        });

        if (String(req.query.format).toLowerCase() === 'csv') {
            const { csv, fileName } = generateAttendanceReportCsv({ rows, grade, classroom, from, to });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            return res.send(csv);
        }

        res.json({ grade, from, to, rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
