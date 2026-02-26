const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const {
    formatConversation,
    formatMessage,
    formatMessageList
} = require('../services/responseFormatter.service');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const canMessage = (senderRole, receiverRole) => {
    if (senderRole === 'admin') return true;
    if (senderRole === 'teacher') return receiverRole === 'admin' || receiverRole === 'student' || receiverRole === 'teacher';
    if (senderRole === 'student') return receiverRole === 'teacher';
    return false;
};

const getTeacherClassroom = async (userId) => {
    const teacher = await Teacher.findOne({ userId });
    return {
        grade: teacher?.grade || null,
        classroom: teacher?.classroom || null
    };
};

const getStudentClassroom = async (userId) => {
    const student = await Student.findOne({ userId });
    return {
        grade: student?.grade || null,
        classroom: student?.classroom || null
    };
};

const canMessageWithGrade = async (senderUser, receiverUser) => {
    if (!canMessage(senderUser.role, receiverUser.role)) return false;
    if (senderUser.role !== 'teacher') return true;
    if (receiverUser.role === 'admin') return true;
    const senderCtx = await getTeacherClassroom(senderUser._id);
    if (!senderCtx?.grade) return false;
    if (receiverUser.role === 'student') {
        const receiverCtx = await getStudentClassroom(receiverUser._id);
        if (senderCtx.classroom && receiverCtx.classroom) {
            return receiverCtx.classroom === senderCtx.classroom && receiverCtx.grade === senderCtx.grade;
        }
        return receiverCtx.grade === senderCtx.grade;
    }
    if (receiverUser.role === 'teacher') {
        const receiverCtx = await getTeacherClassroom(receiverUser._id);
        if (senderCtx.classroom && receiverCtx.classroom) {
            return receiverCtx.classroom === senderCtx.classroom && receiverCtx.grade === senderCtx.grade;
        }
        return receiverCtx.grade === senderCtx.grade;
    }
    return false;
};

const pickUser = (user, profile = null) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    grade: profile?.grade || ''
});

const getParticipantUserId = (participant) => {
    if (!participant) return null;
    if (participant.user) {
        return participant.user._id ? participant.user._id.toString() : participant.user.toString();
    }
    return participant.toString ? participant.toString() : null;
};

const normalizeParticipants = async (conversation) => {
    if (!conversation?.participants?.length) return conversation;
    const needsNormalize = conversation.participants.some((p) => !p?.user);
    if (!needsNormalize) return conversation;
    conversation.participants = conversation.participants.map((p) =>
        p?.user ? p : { user: p, lastReadAt: null }
    );
    await conversation.save();
    return conversation;
};

const getParticipantEntry = (conversation, userId) => {
    if (!conversation?.participants) return null;
    const entry = conversation.participants.find((p) => getParticipantUserId(p) === userId);
    return entry || null;
};

const touchLastRead = async (conversation, userId) => {
    const entry = getParticipantEntry(conversation, userId);
    if (!entry || !entry.user) return;
    entry.lastReadAt = new Date();
    await conversation.save();
};

const findConversationForUsers = async (userA, userB) => {
    const direct = await Conversation.findOne({
        $and: [
            { 'participants.user': userA },
            { 'participants.user': userB },
            { $expr: { $eq: [{ $size: '$participants' }, 2] } }
        ]
    });

    if (direct) return direct;

    const legacy = await Conversation.collection.findOne({
        participants: { $all: [new mongoose.Types.ObjectId(userA), new mongoose.Types.ObjectId(userB)] }
    });

    if (!legacy?._id) return null;
    return Conversation.findById(legacy._id);
};

const listUserConversations = async (userId) => {
    const conversations = await Conversation.find({ 'participants.user': userId })
        .sort({ lastMessageAt: -1, updatedAt: -1 });

    const legacyIds = await Conversation.collection
        .find({ participants: new mongoose.Types.ObjectId(userId) })
        .project({ _id: 1 })
        .toArray();

    const legacyIdSet = new Set(legacyIds.map((doc) => doc._id.toString()));
    const existingIdSet = new Set(conversations.map((doc) => doc._id.toString()));

    const missingLegacyIds = [...legacyIdSet].filter((id) => !existingIdSet.has(id));
    if (missingLegacyIds.length > 0) {
        const legacyConversations = await Conversation.find({
            _id: { $in: missingLegacyIds }
        });
        conversations.push(...legacyConversations);
    }

    conversations.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    for (const convo of conversations) {
        await normalizeParticipants(convo);
        await convo.populate('participants.user', 'name email role avatarUrl');
        await convo.populate('lastSender', 'name role');
    }

    return conversations;
};

// @desc    List conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.listConversations = async (req, res) => {
    try {
        const conversations = await listUserConversations(req.user.id);

        res.json(conversations.map(formatConversation).filter(Boolean));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get or create conversation with another user
// @route   POST /api/messages/conversations
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
    const { userId } = req.body;

    if (!userId || !isValidObjectId(userId)) {
        return res.status(400).json({ msg: 'Valid userId is required' });
    }

    if (userId === req.user.id) {
        return res.status(400).json({ msg: 'Cannot start a conversation with yourself' });
    }

    try {
        const otherUser = await User.findById(userId).select('name email role avatarUrl');
        if (!otherUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const senderUser = await User.findById(req.user.id).select('role');
        if (!senderUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (!(await canMessageWithGrade(senderUser, otherUser))) {
            return res.status(403).json({ msg: 'Not allowed to message this user' });
        }

        let conversation = await findConversationForUsers(req.user.id, userId);

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [
                    { user: req.user.id, lastReadAt: new Date() },
                    { user: userId, lastReadAt: null }
                ]
            });
        }

        const populated = await Conversation.findById(conversation._id)
            .populate('participants.user', 'name email role avatarUrl')
            .populate('lastSender', 'name role');

        res.json(formatConversation(populated));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ msg: 'Invalid conversation id' });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limitParam = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50;
    const skip = (page - 1) * limit;

    try {
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }

        const isParticipant = conversation.participants.some(
            (p) => getParticipantUserId(p) === req.user.id
        );
        if (!isParticipant) {
            return res.status(403).json({ msg: 'Not authorized to view this conversation' });
        }

        const filter = { conversation: id };
        const total = await Message.countDocuments(filter);
        const messages = await Message.find(filter)
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .populate('sender', 'name role');

        await touchLastRead(conversation, req.user.id);

        res.setHeader('X-Total-Count', String(total));
        res.setHeader('X-Total-Pages', String(Math.max(1, Math.ceil(total / limit))));
        res.setHeader('X-Page', String(page));
        res.setHeader('X-Limit', String(limit));

        res.json(formatMessageList(messages));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Send a message in a conversation
// @route   POST /api/messages/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ msg: 'Invalid conversation id' });
    }
    if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ msg: 'Message text is required' });
    }

    try {
        const conversation = await Conversation.findById(id);
        if (!conversation) {
            return res.status(404).json({ msg: 'Conversation not found' });
        }
        await normalizeParticipants(conversation);

        const isParticipant = conversation.participants.some(
            (p) => getParticipantUserId(p) === req.user.id
        );
        if (!isParticipant) {
            return res.status(403).json({ msg: 'Not authorized to send messages here' });
        }

        const otherEntry = conversation.participants.find(
            (p) => getParticipantUserId(p) !== req.user.id
        );
        const otherUserId = getParticipantUserId(otherEntry);
        if (!otherUserId) {
            return res.status(400).json({ msg: 'Invalid conversation participants' });
        }
        const otherUser = await User.findById(otherUserId).select('role');
        if (!otherUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const senderUser = await User.findById(req.user.id).select('role');
        if (!senderUser) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (!(await canMessageWithGrade(senderUser, otherUser))) {
            return res.status(403).json({ msg: 'Not allowed to message this user' });
        }

        const message = await Message.create({
            conversation: id,
            sender: req.user.id,
            text: text.trim()
        });

        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = new Date();
        conversation.lastSender = req.user.id;
        await conversation.save();

        await touchLastRead(conversation, req.user.id);

        await message.populate('sender', 'name role');
        res.json(formatMessage(message));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get unread count for current user
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const conversations = await listUserConversations(req.user.id);
        let total = 0;

        for (const convo of conversations) {
            const entry = getParticipantEntry(convo, req.user.id);
            const lastReadAt = entry?.lastReadAt || new Date(0);
            const count = await Message.countDocuments({
                conversation: convo._id,
                sender: { $ne: req.user.id },
                createdAt: { $gt: lastReadAt }
            });
            total += count;
        }

        res.json({ count: total });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get unread messages for current user
// @route   GET /api/messages/unread
// @access  Private
exports.getUnreadMessages = async (req, res) => {
    try {
        const conversations = await listUserConversations(req.user.id);
        let total = 0;
        let items = [];
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const convo of conversations) {
            const entry = getParticipantEntry(convo, req.user.id);
            const lastReadAt = entry?.lastReadAt || new Date(0);
            const messages = await Message.find({
                conversation: convo._id,
                sender: { $ne: req.user.id },
                createdAt: { $gte: cutoff }
            })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('sender', 'name role');

            const unread = messages.filter((msg) => new Date(msg.createdAt) > lastReadAt).length;
            total += unread;
            items = items.concat(
                messages.map((msg) => ({
                    id: msg._id,
                    conversationId: convo._id,
                    text: msg.text,
                    createdAt: msg.createdAt,
                    sender: msg.sender,
                    isUnread: new Date(msg.createdAt) > lastReadAt
                }))
            );
        }

        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        items = items.slice(0, 6);

        res.json({ count: total, items });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get contact list for messaging
// @route   GET /api/messages/contacts
// @access  Private
exports.getContacts = async (req, res) => {
    try {
        const role = req.user.role;

        if (role === 'student') {
            const student = await Student.findOne({ userId: req.user.id });
            if (!student?.grade) return res.json({ contacts: [] });
            const query = student.classroom ? { grade: student.grade, classroom: student.classroom } : { grade: student.grade };
            const teachers = await Teacher.find(query).populate('userId', ['name', 'email', 'role']);
            const contacts = teachers
                .filter((t) => t.userId)
                .map((t) => pickUser(t.userId, { grade: t.grade }));
            return res.json({ contacts });
        }

        if (role === 'teacher') {
            const teacher = await Teacher.findOne({ userId: req.user.id });
            if (!teacher?.grade) return res.json({ contacts: [] });
            const query = teacher.classroom ? { grade: teacher.grade, classroom: teacher.classroom } : { grade: teacher.grade };
            const students = await Student.find(query).populate('userId', ['name', 'email', 'role']);
            const teachers = await Teacher.find(query).populate('userId', ['name', 'email', 'role']);
            const admins = await User.find({ role: 'admin' }).select('name email role');
            const studentContacts = students
                .filter((s) => s.userId)
                .map((s) => pickUser(s.userId, { grade: s.grade }));
            const teacherContacts = teachers
                .filter((t) => t.userId && t.userId._id.toString() !== req.user.id)
                .map((t) => pickUser(t.userId, { grade: t.grade }));
            const adminContacts = admins.map((a) => pickUser(a));
            return res.json({ contacts: [...adminContacts, ...teacherContacts, ...studentContacts] });
        }

        if (role === 'admin') {
            const teachers = await Teacher.find().populate('userId', ['name', 'email', 'role']);
            const students = await Student.find().populate('userId', ['name', 'email', 'role']);
            const teacherContacts = teachers
                .filter((t) => t.userId)
                .map((t) => pickUser(t.userId, { grade: t.grade }));
            const studentContacts = students
                .filter((s) => s.userId)
                .map((s) => pickUser(s.userId, { grade: s.grade }));
            return res.json({ contacts: [...teacherContacts, ...studentContacts] });
        }

        return res.json({ contacts: [] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
