const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Teacher = require('../src/models/Teacher');

dotenv.config();

const grades = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
const rooms = ['A', 'B', 'C'];
const subjects = ['Math', 'English', 'Science', 'History', 'Geography', 'ICT', 'Art'];

const gradeSlug = (grade) => grade.toLowerCase().replace(/\s+/g, '-');

const normalizeClassroom = (value) => {
    const v = String(value || '').trim().toUpperCase();
    return rooms.includes(v) ? v : '';
};

const getNextTeacherIndex = (userEmails, grade) => {
    const slug = gradeSlug(grade);
    let max = 0;
    for (const email of userEmails) {
        const m = String(email).match(new RegExp(`teacher_${slug}_(\\d+)@`, 'i'));
        if (m) {
            const n = parseInt(m[1], 10);
            if (n > max) max = n;
        }
    }
    return max + 1;
};

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (const grade of grades) {
            const teachers = await Teacher.find({ grade }).populate('userId', ['email']);
            const byRoom = { A: 0, B: 0, C: 0 };

            for (const t of teachers) {
                const room = normalizeClassroom(t.classroom);
                if (room) byRoom[room] += 1;
            }

            const target = 7;
            const needs = {
                A: Math.max(0, target - byRoom.A),
                B: Math.max(0, target - byRoom.B),
                C: Math.max(0, target - byRoom.C)
            };

            const existingEmails = teachers.map((t) => t.userId?.email).filter(Boolean);
            let nextIndex = getNextTeacherIndex(existingEmails, grade);
            let subjectIndex = 0;

            for (const room of rooms) {
                for (let i = 0; i < needs[room]; i += 1) {
                    const user = new User({
                        name: `${grade} Teacher ${nextIndex}`,
                        email: `teacher_${gradeSlug(grade)}_${nextIndex}@school.com`,
                        password: 'password',
                        role: 'teacher'
                    });
                    await user.save();

                    const teacher = new Teacher({
                        userId: user.id,
                        subject: subjects[subjectIndex % subjects.length],
                        grade,
                        classroom: room,
                        experience: `${2 + ((nextIndex - 1) % 10)} Years`,
                        contact: `+1 555-20${String(nextIndex).padStart(2, '0')}`
                    });
                    await teacher.save();

                    nextIndex += 1;
                    subjectIndex += 1;
                }
            }

            const finalTeachers = await Teacher.find({ grade });
            const finalCounts = { A: 0, B: 0, C: 0 };
            for (const t of finalTeachers) {
                const room = normalizeClassroom(t.classroom);
                if (room) finalCounts[room] += 1;
            }

            console.log(`Teachers ${grade}: A=${finalCounts.A}, B=${finalCounts.B}, C=${finalCounts.C}`);
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
