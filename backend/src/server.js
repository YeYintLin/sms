const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const localeMiddleware = require('./middleware/locale.middleware');

// Load env vars
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Init Middleware
app.use(express.json({ extended: false, limit: '10mb' }));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(localeMiddleware);

// Define Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/results', require('./routes/result.routes'));
app.use('/api/teachers', require('./routes/teacher.routes'));
app.use('/api/classes', require('./routes/class.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/parents', require('./routes/parent.routes'));
app.use('/api/files', require('./routes/file.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
