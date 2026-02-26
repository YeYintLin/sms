const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                lastReadAt: {
                    type: Date,
                    default: null
                }
            }
        ],
        lastMessage: {
            type: String,
            default: ''
        },
        lastMessageAt: {
            type: Date,
            default: null
        },
        lastSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
);

ConversationSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
