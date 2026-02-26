import { MapPin, Users, Star, Flag, Paperclip, StickyNote } from 'lucide-react';

const LessonCard = ({ time, duration, subject, room, teacher, color }) => {
    return (
        <div className="lesson-card" style={{ borderLeftColor: color || '#ef4444' }}>
            <div className="lesson-top">
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <div style={{ minWidth: '80px' }}>
                        <p style={{ fontWeight: '700', fontSize: '1.125rem' }}>{time}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{duration}</p>
                    </div>
                    <div className="lesson-info">
                        <h3>{subject}</h3>
                        <div className="lesson-meta-item">
                            <MapPin size={16} />
                            <span>{room}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="lesson-meta">
                        <div className="lesson-meta-item"><Users size={16} /> 6</div>
                        <div className="lesson-meta-item"><Star size={16} /> 2</div>
                        <div className="lesson-meta-item"><Flag size={16} /> 2</div>
                        <div className="lesson-meta-item"><Paperclip size={16} /> 1</div>
                    </div>
                    <div className="teacher-profile-link">
                        <span>{teacher}</span>
                        <div className="avatar" style={{ margin: 0 }}></div>
                    </div>
                </div>
            </div>

            <div className="lesson-status-grid">
                <div className="status-bar"><div className="status-fill" style={{ width: '60%', background: '#10b981' }}></div></div>
                <div className="status-bar"><div className="status-fill" style={{ width: '30%', background: '#f59e0b' }}></div></div>
                <div className="status-bar"><div className="status-fill" style={{ width: '10%', background: '#ef4444' }}></div></div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <StickyNote size={14} color="var(--text-light)" />
                    <span>Great day of learning!</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Flag size={14} color="var(--text-light)" />
                    <span>Today we made some great progress. Thanks to all for dedication and attention.</span>
                </div>
            </div>
        </div>
    );
};

export default LessonCard;
