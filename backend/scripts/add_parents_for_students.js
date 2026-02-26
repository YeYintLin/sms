const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Parent = require('../src/models/Parent');

dotenv.config();

const normalizeEmailKey = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const students = await Student.find().populate('userId', ['name']);
        let created = 0;
        let skipped = 0;

        for (const s of students) {
            if (!s.studentId) {
                skipped += 1;
                continue;
            }

            const existingParent = await Parent.findOne({ studentId: s.studentId });
            if (existingParent) {
                skipped += 1;
                continue;
            }

            const emailKey = normalizeEmailKey(s.studentId);
            const email = `parent_${emailKey}@school.com`;
            const parentId = `P-${s.studentId}`;

            let user = await User.findOne({ email });
            if (!user) {
                user = new User({
                    name: `${s.userId?.name || 'Student'} Parent`,
                    email,
                    password: 'password',
                    role: 'parent',
                    parentName: `${s.userId?.name || 'Student'} Parent`
                });
                await user.save();
            }

            const parentProfile = new Parent({
                userId: user.id,
                parentId,
                studentId: s.studentId,
                grade: s.grade || '',
                contact: s.contact || ''
            });
            await parentProfile.save();
            created += 1;
        }

        console.log(`Parents created: ${created}, skipped: ${skipped}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

main();
