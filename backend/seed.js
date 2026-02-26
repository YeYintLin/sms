const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Teacher = require('./src/models/Teacher');
const ExamResult = require('./src/models/ExamResult');

dotenv.config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for comprehensive seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Student.deleteMany({});
        await Teacher.deleteMany({});
        await ExamResult.deleteMany({});
        console.log('Existing data cleared.');

        // 1. Create Admin
        const adminUser = new User({
            name: 'System Admin',
            email: 'admin@school.com',
            password: 'password',
            role: 'admin'
        });
        await adminUser.save();
        console.log('Admin user created.');

        const grades = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
        const subjects = ['Math', 'English', 'Science', 'History', 'Geography', 'ICT', 'Art'];

        for (const grade of grades) {
            const gradeSlug = grade.toLowerCase().replace(/\s+/g, '-');

            // 2. Create 20 Students per grade
            for (let i = 1; i <= 20; i++) {
                const studentUser = new User({
                    name: `${grade} Student ${i}`,
                    email: `student_${gradeSlug}_${i}@school.com`,
                    password: 'password',
                    role: 'student'
                });
                await studentUser.save();

                const studentProfile = new Student({
                    userId: studentUser.id,
                    studentId: `${gradeSlug}-S${String(i).padStart(3, '0')}`,
                    grade,
                    contact: `+1 555-10${String(i).padStart(2, '0')}`,
                    age: grade === 'KG' ? 5 : 6 + Math.min(11, parseInt(grade.split(' ')[1] || 0, 10))
                });
                await studentProfile.save();

                const subjectScores = subjects.map((name) => ({
                    name,
                    score: Math.floor(50 + Math.random() * 51)
                }));

                const result = new ExamResult({
                    student: studentProfile.id,
                    grade,
                    subjects: subjectScores,
                    term: 'Term 1'
                });
                await result.save();
            }

            // 3. Create 7 Teachers per grade
            for (let i = 1; i <= 7; i++) {
                const teacherUser = new User({
                    name: `${grade} Teacher ${i}`,
                    email: `teacher_${gradeSlug}_${i}@school.com`,
                    password: 'password',
                    role: 'teacher'
                });
                await teacherUser.save();

                const teacherProfile = new Teacher({
                    userId: teacherUser.id,
                    subject: subjects[(i - 1) % subjects.length],
                    grade,
                    experience: `${2 + i} Years`,
                    contact: `+1 555-20${String(i).padStart(2, '0')}`
                });
                await teacherProfile.save();
            }
        }

        console.log('Database seeded with students and teachers by grade successfully!');
        process.exit();
    } catch (err) {
        console.error('Error seeding database:', err.message);
        process.exit(1);
    }
};

seedDB();
