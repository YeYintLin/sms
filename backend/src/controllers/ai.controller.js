const axios = require('axios');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const {
    getTeacherContext
} = require('../services/classroomContext.service');
const { t } = require('../i18n');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest';

const normalizeDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

const parseDateFromText = (text) => {
    if (!text) return null;
    const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
        const d = normalizeDate(`${iso[1]}-${iso[2]}-${iso[3]}`);
        if (d) return d;
    }
    const us = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (us) {
        const mm = us[1].padStart(2, '0');
        const dd = us[2].padStart(2, '0');
        const d = normalizeDate(`${us[3]}-${mm}-${dd}`);
        if (d) return d;
    }
    return null;
};

const parseGradeFromText = (text) => {
    if (!text) return null;
    const kg = text.match(/\bkg\b/i);
    if (kg) return 'KG';
    const grade = text.match(/\bgrade\s*(\d{1,2})\b/i);
    if (grade) return `Grade ${grade[1]}`;
    return null;
};

const getAttendanceSummary = async ({ date, grade, classroom }) => {
    const studentQuery = classroom ? { grade, classroom } : { grade };
    const students = await Student.find(studentQuery).populate('userId', ['name']);
    const attendanceQuery = classroom ? { date, grade, classroom } : { date, grade };
    const attendance = await Attendance.find(attendanceQuery);
    const byStudent = new Map(attendance.map((a) => [a.student.toString(), a]));

    const absent = [];
    const late = [];
    let presentCount = 0;

    for (const s of students) {
        const entry = byStudent.get(s._id.toString());
        const status = entry?.status || 'present';
        const name = s.userId?.name || s.studentId;
        if (status === 'absent') absent.push(name);
        else if (status === 'late') late.push(name);
        else presentCount += 1;
    }

    const total = students.length;
    const percent = total === 0 ? 0 : Math.round((presentCount / total) * 100);

    return { total, presentCount, percent, absent, late };
};

const buildSystemPrompt = ({ role, name }) => {
    return [
        'You are the School Assistant for a school management web app.',
        'Help users understand how to use the website and its features.',
        'Be concise. Default to 1-2 short sentences and a single question.',
        'Only provide step-by-step instructions when the user explicitly asks "how" or "steps".',
        'When giving steps, use a vertical numbered list format like: 1. Step one 2. Step two 3. Step three.',
        'Keep step lists to 3-6 items and put each step on its own line.',
        'Use the exact page names that exist in the app.',
        'If the user asks about features not present, say so and offer the closest alternative.',
        'If a user asks to do something they do not have permission for, say they do not have permission and mention which role can do it.',
        'Role guidance: Admin can manage everything. Teachers cannot create/edit classes or delete users; they can view/manage their students and assignments. Students can view their own info and classes, and message teachers. Parents have limited view access.',
        'You may include action tags like [action:Students] using only allowed labels.',
        'Allowed action labels: Dashboard, Students, Teachers, Classes, Parents, Assignments, Exams, Results, TimeTable, Books, Files, Calendar, Attendance, Admin Users, Profile.',
        `User role: ${role || 'unknown'}.`,
        `User name: ${name || 'User'}.`
    ].join(' ');
};

// @desc    Chat with local AI (Ollama)
// @route   POST /api/ai/chat
// @access  Private
exports.chat = async (req, res) => {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
        return res.status(400).json({ msg: t(req, 'ai.messages_array_required') });
    }

    try {
        const user = await User.findById(req.user.id).select('name role');
        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
        const content = String(lastUserMessage?.content || '').toLowerCase();

        if (content.includes('attendance')) {
            const date = parseDateFromText(content) || normalizeDate(new Date());
            let grade = parseGradeFromText(content);
            let classroom = null;
            if (user?.role === 'teacher') {
                const ctx = await getTeacherContext(user._id);
                grade = ctx.grade;
                classroom = ctx.classroom || null;
            }
            if (user?.role === 'admin' && !grade) {
                return res.json({
                    message: t(req, 'ai.ask_grade')
                });
            }
            if (!grade) {
                return res.json({
                    message: t(req, 'ai.missing_grade')
                });
            }

            const summary = await getAttendanceSummary({ date, grade, classroom });
            const dateLabel = date.toISOString().slice(0, 10);
            const absentList = summary.absent.length ? summary.absent.join(', ') : t(req, 'ai.none');
            const lateList = summary.late.length ? summary.late.join(', ') : t(req, 'ai.none');
            return res.json({
                message: t(req, 'ai.attendance_summary', {
                    grade,
                    classroom: classroom ? ` ${classroom}` : '',
                    date: dateLabel,
                    percent: summary.percent,
                    present: summary.presentCount,
                    total: summary.total,
                    absent: absentList,
                    late: lateList
                })
            });
        }

        const system = buildSystemPrompt({ role: user?.role, name: user?.name });
        const promptMessages = [
            { role: 'system', content: system },
            ...messages.map((m) => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: String(m.content || '').slice(0, 4000)
            }))
        ];

        const response = await axios.post(
            `${OLLAMA_BASE_URL}/api/chat`,
            {
                model: OLLAMA_MODEL,
                messages: promptMessages,
                stream: false
            },
            { timeout: 30000 }
        );

        const aiContent = response.data?.message?.content || '';
        res.json({ message: aiContent });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: t(req, 'ai.service_error') });
    }
};
