import { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import api from '../utils/api';

const MessageModal = ({ isOpen, onClose, otherUser }) => {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const loadMe = async () => {
            try {
                const res = await api.get('/auth/me');
                setCurrentUserId(res.data?._id || '');
            } catch (err) {
                setCurrentUserId('');
            }
        };
        loadMe();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !otherUser?.id) return;
        let isMounted = true;
        const loadConversation = async () => {
            setIsLoading(true);
            setError('');
            try {
                const convoRes = await api.post('/messages/conversations', {
                    userId: otherUser.id
                });
                if (!isMounted) return;
                setConversation(convoRes.data);

                const msgsRes = await api.get(`/messages/conversations/${convoRes.data._id}/messages`);
                if (!isMounted) return;
                setMessages(msgsRes.data || []);
            } catch (err) {
                if (isMounted) setError('Failed to load messages');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        loadConversation();
        return () => {
            isMounted = false;
        };
    }, [isOpen, otherUser?.id]);

    useEffect(() => {
        if (!isOpen) return;
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!conversation || !text.trim()) return;
        setIsSending(true);
        try {
            const res = await api.post(`/messages/conversations/${conversation._id}/messages`, {
                text: text.trim()
            });
            setMessages((prev) => [...prev, res.data]);
            setText('');
        } catch (err) {
            setError('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content message-modal">
                <div className="message-modal-header">
                    <div className="message-modal-title">
                        Message {otherUser?.name || 'User'}
                    </div>
                    <button className="icon-btn" type="button" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                <div className="message-modal-body" ref={listRef}>
                    {isLoading && <div className="message-empty">Loading messages...</div>}
                    {!isLoading && error && <div className="message-empty">{error}</div>}
                    {!isLoading && !error && messages.length === 0 && (
                        <div className="message-empty">No messages yet. Say hello!</div>
                    )}
                    {!isLoading && !error && messages.map((msg) => {
                        const isSelf = currentUserId && msg.sender?._id === currentUserId;
                        return (
                            <div key={msg._id} className={`message-row ${isSelf ? 'self' : ''}`}>
                                <div className={`message-bubble ${isSelf ? 'self' : ''}`}>
                                    <div className="message-text">{msg.text}</div>
                                    <div className="message-meta">
                                        {isSelf ? 'You' : msg.sender?.name || 'User'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="message-modal-footer">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSend();
                        }}
                        disabled={isSending}
                    />
                    <button
                        className="btn btn-primary"
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || !text.trim()}
                    >
                        <Send size={16} />
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageModal;
