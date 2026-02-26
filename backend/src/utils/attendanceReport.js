const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const normalizeSegment = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return 'All';
    return text.replace(/\s+/g, '_');
};

const generateAttendanceReportCsv = ({ rows, grade, classroom, from, to }) => {
    const safe = escapeCsvValue;
    const generatedAt = new Date().toLocaleString('en-US', { hour12: true });
    const dateRange = `${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}`;
    const selectedGrade = grade || 'All Grades';
    const selectedClassroom = classroom || 'All Classrooms';

    const header = ['No', 'Student ID', 'Student Name', 'Present', 'Absent', 'Late', 'Total', 'Attendance %'];
    const lines = [
        [safe('ATTENDANCE REPORT')].join(','),
        [safe('Generated At'), safe(generatedAt)].join(','),
        [safe('Date Range'), safe(dateRange)].join(','),
        [safe('Grade'), safe(selectedGrade)].join(','),
        [safe('Classroom'), safe(selectedClassroom)].join(','),
        [],
        header.map(safe).join(','),
        ...rows.map((r, idx) =>
            [
                idx + 1,
                safe(r.studentId),
                safe(r.name),
                r.present,
                r.absent,
                r.late,
                r.total,
                safe(`${r.percent}%`)
            ].join(',')
        )
    ];

    const gradeSegment = normalizeSegment(selectedGrade);
    const classroomSegment = normalizeSegment(selectedClassroom);
    const fileName = `attendance_report_${gradeSegment}_${classroomSegment}_${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv`;

    return {
        csv: `\uFEFF${lines.join('\r\n')}`,
        fileName
    };
};

module.exports = {
    generateAttendanceReportCsv
};
