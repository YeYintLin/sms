import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoIosCloudOutline } from 'react-icons/io';
import { RxCross2 } from 'react-icons/rx';
import { FaHistory } from 'react-icons/fa';
import { LiaTelegramPlane } from 'react-icons/lia';
import api from '../utils/api';
import './Chatbot.css';
import { useLocale } from '../hooks/useLocale.jsx';

const Chatbot = ({ isOpen, onToggle, showLauncher = false }) => {
    const navigate = useNavigate();
    const { t } = useLocale();
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [hasNewMessage, setHasNewMessage] = useState(false);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isSending) return;
        setError('');
        setIsSending(true);
        const nextMessages = [...messages, { role: 'user', content: text }];
        setMessages(nextMessages);
        setInput('');
        try {
            const res = await api.post('/ai/chat', { messages: nextMessages });
            const reply = res.data?.message || 'Sorry, I could not answer that.';
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
            if (!isOpen) setHasNewMessage(true);
        } catch (err) {
            setError(t('chatbot.ai_unavailable'));
        } finally {
            setIsSending(false);
        }
    };

    const actionMap = useMemo(() => ({
        Dashboard: '/',
        Students: '/students',
        Teachers: '/teachers',
        Classes: '/classes',
        Parents: '/parents',
        Assignments: '/assignments',
        Exams: '/exams',
        Results: '/results',
        TimeTable: '/timetable',
        Books: '/books',
        Files: '/files',
        Calendar: '/calendar',
        Attendance: '/attendance',
        'Admin Users': '/admin/users',
        Profile: '/profile'
    }), []);

    const parseActions = (text) => {
        const actions = [];
        const clean = text.replace(/\[action:([^\]]+)\]/g, (match, label) => {
            const trimmed = String(label || '').trim();
            if (trimmed && actionMap[trimmed]) actions.push(trimmed);
            return '';
        }).replace(/\s{2,}/g, ' ').trim();
        return { clean, actions };
    };

    const userHistory = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .reverse();

    const handleToggle = () => {
        onToggle();
        if (!isOpen) setHasNewMessage(false);
    };

    return (
        <>
            {showLauncher && (
                <div className="intercom-btn" onClick={handleToggle}>
                    {isOpen ? <RxCross2 /> : <IoIosCloudOutline />}
                    {!isOpen && hasNewMessage && <span className="new-msg-badge" />}
                </div>
            )}

            {isOpen && (
                <div className="intercom-wrapper">
                    <div className="chat-container">
                        <div className="chat-header">
                            <h2>{t('chatbot.title')}</h2>
                            <button
                                className="history-btn"
                                onClick={() => setShowHistory((prev) => !prev)}
                                title={t('chatbot.search_history')}
                            >
                                <FaHistory />
                            </button>
                            <button className="close-btn" onClick={handleToggle} title="Close">
                                <RxCross2 />
                            </button>
                        </div>

                        {showHistory && (
                            <div className="history-sidebar">
                                <h3>{t('chatbot.search_history')}</h3>
                                <ul>
                                    {userHistory.length === 0 && <li>{t('chatbot.no_history')}</li>}
                                    {userHistory.map((query, idx) => (
                                        <li
                                            key={`${query}-${idx}`}
                                            onClick={() => {
                                                setInput(query);
                                                setShowHistory(false);
                                            }}
                                        >
                                            {query}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="chat-box">
                            {messages.map((m, idx) => {
                                const parsed = m.role === 'assistant'
                                    ? parseActions(m.content)
                                    : { clean: m.content, actions: [] };

                                return (
                                    <div key={`${m.role}-${idx}`} className={`message ${m.role}`}>
                                        <p>{parsed.clean}</p>
                                        {parsed.actions.length > 0 && (
                                            <div className="message-actions">
                                                {parsed.actions.map((label) => (
                                                    <button
                                                        key={`${label}-${idx}`}
                                                        onClick={() => navigate(actionMap[label])}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {isSending && <div className="message assistant"><p>{t('chatbot.typing')}</p></div>}
                            {error && <div className="chat-error">{error}</div>}
                        </div>

                        <div className="input-area">
                            <textarea
                                className="chat-input"
                                placeholder={t('chatbot.ask_placeholder')}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                rows={1}
                            />
                            <button
                                className="send-btn"
                                onClick={handleSend}
                                disabled={isSending || !input.trim()}
                            >
                                <LiaTelegramPlane />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
