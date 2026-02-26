const formatUserReference = (user) => {
    if (!user) return null;
    const id = user._id ? user._id.toString() : user.id || user;
    return {
        id,
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        avatarUrl: user.avatarUrl || ''
    };
};

const formatParticipantEntry = (entry) => {
    if (!entry?.user) return null;
    return {
        user: formatUserReference(entry.user),
        lastReadAt: entry.lastReadAt ? new Date(entry.lastReadAt).toISOString() : null
    };
};

const formatConversation = (conversation) => {
    if (!conversation) return null;
    return {
        id: conversation._id ? conversation._id.toString() : null,
        participants: (conversation.participants || [])
            .map(formatParticipantEntry)
            .filter((item) => item?.user),
        lastMessage: conversation.lastMessage || '',
        lastMessageAt: conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toISOString() : null,
        lastSender: formatUserReference(conversation.lastSender),
        createdAt: conversation.createdAt ? new Date(conversation.createdAt).toISOString() : null,
        updatedAt: conversation.updatedAt ? new Date(conversation.updatedAt).toISOString() : null
    };
};

const formatMessage = (message) => {
    if (!message) return null;
    return {
        id: message._id ? message._id.toString() : null,
        conversationId: message.conversation ? message.conversation.toString?.() ?? message.conversation : null,
        text: message.text || '',
        sender: formatUserReference(message.sender),
        createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : null,
        updatedAt: message.updatedAt ? new Date(message.updatedAt).toISOString() : null
    };
};

const formatMessageList = (messages = []) => {
    return messages.map(formatMessage).filter((entry) => entry !== null);
};

module.exports = {
    formatConversation,
    formatMessage,
    formatMessageList
};
