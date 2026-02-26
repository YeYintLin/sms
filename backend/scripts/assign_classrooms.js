const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Teacher = require('../src/models/Teacher');

dotenv.config();

const grades = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
const rooms = ['A', 'B', 'C'];

const normalizeClassroom = (value) => {
    const v = String(value || '').trim().toUpperCase();
    return rooms.includes(v) ? v : '';
};

const gradeSlug = (grade) => grade.toLowerCase().replace(/\s+/g, '-');

const getAgeForGrade = (grade) => {
    if (grade === 'KG') return 5;
    const num = parseInt(grade.split(' ')[1] || '0', 10);
    return 6 + Math.min(11, num);
};

const getNextStudentIndex = (studentIds, grade) => {
    const slug = gradeSlug(grade);
    let max = 0;
    for (const id of studentIds) {
        const m = String(id).match(new RegExp(`^${slug}-S(\\d+)$`, 'i'));
        if (m) {
            const n = parseInt(m[1], 10);
            if (n > max) max = n;
        }
    }
    return max + 1;
};

const assignToLowest = (counts) => {
    let best = rooms[0];
    for (const r of rooms) {
        if (counts[r] < counts[best]) best = r;
    }
    return best;
};

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        for (const grade of grades) {
            const students = await Student.find({ grade });
            const byRoom = { A: 0, B: 0, C: 0 };
            const missing = [];

            for (const s of students) {
                const room = normalizeClassroom(s.classroom);
                if (!room) {
                    missing.push(s);
                } else {
                    byRoom[room] += 1;
                }
            }

            for (const s of missing) {
                const room = assignToLowest(byRoom);
                s.classroom = room;
                await s.save();
                byRoom[room] += 1;
            }

            const target = 10;
            const needs = {
                A: Math.max(0, target - byRoom.A),
                B: Math.max(0, target - byRoom.B),
                C: Math.max(0, target - byRoom.C)
            };
            const totalNeeded = needs.A + needs.B + needs.C;

            if (totalNeeded > 0) {
                const ids = students.map((s) => s.studentId);
                let nextIndex = getNextStudentIndex(ids, grade);
                for (const room of rooms) {
                    for (let i = 0; i < needs[room]; i += 1) {
                        const user = new User({
                            name: `${grade} Student ${nextIndex}`,
                            email: `student_${gradeSlug(grade)}_${nextIndex}@school.com`,
                            password: 'password',
                            role: 'student'
                        });
                        await user.save();

                        const student = new Student({
                            userId: user.id,
                            studentId: `${gradeSlug(grade)}-S${String(nextIndex).padStart(3, '0')}`,
                            grade,
                            classroom: room,
                            contact: `+1 555-10${String(nextIndex).padStart(2, '0')}`,
                            age: getAgeForGrade(grade)
                        });
                        await student.save();
                        nextIndex += 1;
                    }
                }
            }

            console.log(`Students ${grade}: A=${byRoom.A}, B=${byRoom.B}, C=${byRoom.C}, added=${totalNeeded}`);
        }

        for (const grade of grades) {
            const teachers = await Teacher.find({ grade });
            const byRoom = { A: 0, B: 0, C: 0 };
            const missing = [];

            for (const t of teachers) {
                const room = normalizeClassroom(t.classroom);
                if (!room) {
                    missing.push(t);
                } else {
                    byRoom[room] += 1;
                }
            }

            for (const t of missing) {
                const room = assignToLowest(byRoom);
                t.classroom = room;
                await t.save();
                byRoom[room] += 1;
            }

            const total = byRoom.A + byRoom.B + byRoom.C;
            if (total < 21) {
                console.log(`Teachers ${grade}: A=${byRoom.A}, B=${byRoom.B}, C=${byRoom.C} (only ${total} teachers available)`);
            } else {
                console.log(`Teachers ${grade}: A=${byRoom.A}, B=${byRoom.B}, C=${byRoom.C}`);
            }
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
