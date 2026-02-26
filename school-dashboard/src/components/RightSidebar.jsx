import { useEffect, useState } from 'react';
import { Megaphone, Bell, Calendar, StickyNote, Info } from 'lucide-react';
import api from '../utils/api';

const RightSidebar = () => {
    const [birthdays, setBirthdays] = useState([]);
    const [calendarNotes, setCalendarNotes] = useState({});
    const [noteChecks, setNoteChecks] = useState({});

    useEffect(() => {
        const fetchBirthdays = async () => {
            try {
                const [studentsRes, teachersRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/teachers')
                ]);

                const today = new Date();
                const month = today.getMonth();
                const day = today.getDate();

                const studentBirthdays = (studentsRes.data || [])
                    .filter(s => s.birthday)
                    .filter(s => {
                        const d = new Date(s.birthday);
                        return d.getMonth() === month && d.getDate() === day;
                    })
                    .map(s => ({
                        name: s.userId?.name || 'Student',
                        role: 'Student'
                    }));

                const teacherBirthdays = (teachersRes.data || [])
                    .filter(t => t.birthday)
                    .filter(t => {
                        const d = new Date(t.birthday);
                        return d.getMonth() === month && d.getDate() === day;
                    })
                    .map(t => ({
                        name: t.userId?.name || 'Teacher',
                        role: 'Teacher'
                    }));

                setBirthdays([...studentBirthdays, ...teacherBirthdays]);
            } catch (err) {
                // silent
            }
        };

        fetchBirthdays();
    }, []);

    useEffect(() => {
        const savedEvents = localStorage.getItem('calendar_events');
        const savedChecks = localStorage.getItem('calendar_note_checks');
        setCalendarNotes(savedEvents ? JSON.parse(savedEvents) : {});
        setNoteChecks(savedChecks ? JSON.parse(savedChecks) : {});
    }, []);

    const toggleNoteCheck = (key) => {
        setNoteChecks((prev) => {
            const next = { ...prev, [key]: !prev?.[key] };
            localStorage.setItem('calendar_note_checks', JSON.stringify(next));
            return next;
        });
    };

    const startOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
        const diff = (day === 0 ? -6 : 1) - day; // start on Monday
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const endOfWeek = (date) => {
        const d = startOfWeek(date);
        d.setDate(d.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const parseDateKey = (key) => {
        const parts = String(key).split('-').map((n) => Number(n));
        if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
        const [y, m, d] = parts;
        return new Date(y, m - 1, d);
    };

    const formatDate = (date) =>
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const today = new Date();
    const thisWeekStart = startOfWeek(today);
    const nextWeekEnd = endOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7));

    const weekNotes = Object.entries(calendarNotes)
        .map(([key, entry]) => {
            const date = parseDateKey(key);
            const note = entry?.note ?? entry;
            const type = entry?.type ?? 'note';
            const startTime = entry?.startTime || '';
            const endTime = entry?.endTime || '';
            return date ? { key, date, note, type, startTime, endTime } : null;
        })
        .filter(Boolean)
        .filter(({ date }) => date >= thisWeekStart && date <= nextWeekEnd)
        .sort((a, b) => a.date - b.date);

    const noteItems = weekNotes.filter(({ type }) => type === 'note');
    const examNotes = weekNotes.filter(({ type }) => type === 'exam');
    const importantNotes = weekNotes.filter(({ type }) => type === 'important');
    return (
        <aside className="right-sidebar">
            {/* Announcements Widget */}
            <div className="widget">
                <div className="widget-header">
                    <span className="widget-title"><Megaphone size={18} /> Announcements</span>
                </div>
                {examNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        No upcoming exams for this or next week
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {examNotes.map(({ key, date, note, startTime, endTime }) => (
                            <div key={key} style={{ borderLeft: '3px solid var(--primary-color)', paddingLeft: '0.75rem' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                    {formatDate(date)}{(startTime || endTime) ? ` • ${startTime || '--:--'}${endTime ? ` - ${endTime}` : ''}` : ''}
                                </p>
                                <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--primary-color)' }}>{note}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Unread Notes Widget */}
            <div className="widget">
                <div className="widget-header">
                    <span className="widget-title"><StickyNote size={18} /> Unread notes</span>
                    <Info size={16} color="var(--text-light)" />
                </div>
                {noteItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        No notes for this or next week
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {noteItems.map(({ key, date, note, startTime, endTime }) => (
                            <div key={key} style={{ borderLeft: '3px solid var(--primary-color)', paddingLeft: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={!!noteChecks[key]}
                                        onChange={() => toggleNoteCheck(key)}
                                        aria-label={`Mark note on ${formatDate(date)} as done`}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                            {formatDate(date)}{(startTime || endTime) ? ` • ${startTime || '--:--'}${endTime ? ` - ${endTime}` : ''}` : ''}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.8125rem',
                                                color: noteChecks[key] ? 'var(--text-light)' : 'var(--text-main)',
                                                fontWeight: 600,
                                                textDecoration: noteChecks[key] ? 'line-through' : 'none'
                                            }}
                                        >
                                            {note}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notifications Widget */}
            <div className="widget">
                <div className="widget-header">
                    <span className="widget-title"><Bell size={18} /> Notifications</span>
                    <Info size={16} color="var(--text-light)" />
                </div>
                {importantNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        No important items for this or next week
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {importantNotes.map(({ key, date, note, startTime, endTime }) => (
                            <div key={key} style={{ borderLeft: '3px solid var(--warning-color)', paddingLeft: '0.75rem' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                    {formatDate(date)}{(startTime || endTime) ? ` • ${startTime || '--:--'}${endTime ? ` - ${endTime}` : ''}` : ''}
                                </p>
                                <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--warning-color)' }}>{note}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Birthdays Widget */}
            <div className="widget">
                <div className="widget-header">
                    <span className="widget-title"><Calendar size={18} /> Birthdays Today</span>
                    <Info size={16} color="var(--text-light)" />
                </div>
                {birthdays.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                        No birthdays today
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {birthdays.map((b, idx) => (
                            <div key={`${b.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div className="avatar" style={{ margin: 0, width: '36px', height: '36px' }}></div>
                                <div>
                                    <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{b.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{b.role} birthday today</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default RightSidebar;
