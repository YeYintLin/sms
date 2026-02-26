import { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, Edit3 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const TimeTable = () => {
    const { canCreate, userRole } = usePermissions();
    const isAdmin = userRole === 'admin';
    const userGrade = localStorage.getItem('grade') || '';
    const baseSchedule = {
        Monday: [
            { id: 1, time: '09:00 - 10:00', subject: 'Mathematics', teacher: 'Mrs. Davis' },
            { id: 2, time: '10:15 - 11:15', subject: 'Physics', teacher: 'Mr. Wilson' }
        ],
        Tuesday: [
            { id: 3, time: '09:00 - 10:00', subject: 'English', teacher: 'Ms. Thompson' }
        ],
        Wednesday: [],
        Thursday: [],
        Friday: []
    };
    const grades = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
    const [activeGrade, setActiveGrade] = useState('KG');
    const [scheduleByGrade, setScheduleByGrade] = useState(
        Object.fromEntries(grades.map(g => [g, JSON.parse(JSON.stringify(baseSchedule))]))
    );

    const [activeDay, setActiveDay] = useState('Monday');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newSlot, setNewSlot] = useState({ time: '', subject: '', teacher: '' });

    useEffect(() => {
        if (!isAdmin && userGrade) {
            setScheduleByGrade((prev) => (
                prev[userGrade] ? prev : { ...prev, [userGrade]: JSON.parse(JSON.stringify(baseSchedule)) }
            ));
            setActiveGrade(userGrade);
        }
    }, [isAdmin, userGrade]);

    const handleAddSlot = (e) => {
        e.preventDefault();
        const updatedSchedule = { ...scheduleByGrade[activeGrade] };
        updatedSchedule[activeDay].push({
            id: Date.now(), // Simple unique ID
            ...newSlot
        });
        setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: updatedSchedule });
        setIsModalOpen(false);
        setNewSlot({ time: '', subject: '', teacher: '' });
    };

    const handleDelete = (id) => {
        const updatedSchedule = { ...scheduleByGrade[activeGrade] };
        updatedSchedule[activeDay] = updatedSchedule[activeDay].filter(slot => slot.id !== id);
        setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: updatedSchedule });
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Class Time Table</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {canCreate('timetable') && (
                        <button
                            className="btn"
                            style={{ border: '1px solid var(--border-color)' }}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            <Edit3 size={16} />
                            {isEditing ? 'Done Editing' : 'Edit Table'}
                        </button>
                    )}
                    {canCreate('timetable') && isEditing && (
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} />
                            Add Period
                        </button>
                    )}
                </div>
            </div>

            <div className="card">
                {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {grades.map((g) => (
                            <button
                                key={g}
                                className="btn"
                                onClick={() => setActiveGrade(g)}
                                style={{
                                    border: '1px solid var(--border-color)',
                                    background: activeGrade === g ? 'var(--primary-color)' : 'var(--bg-card)',
                                    color: activeGrade === g ? 'white' : 'var(--text-main)',
                                    padding: '0.4rem 0.75rem',
                                }}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                )}
                {/* Day Selector */}
                <div className="timetable-day-buttons" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
                    {Object.keys(scheduleByGrade[activeGrade] || {}).map(day => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '9999px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: activeDay === day ? '#4f46e5' : '#f3f4f6',
                                color: activeDay === day ? 'white' : '#4b5563',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Schedule Table */}
                {(scheduleByGrade[activeGrade]?.[activeDay] || []).length > 0 ? (
                    <>
                        <table className="data-table timetable-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    {isEditing && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(scheduleByGrade[activeGrade]?.[activeDay] || []).map((slot) => (
                                    <tr key={slot.id}>
                                    <td data-label="Time" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={16} />
                                        {isEditing ? (
                                            <input
                                                value={slot.time}
                                                onChange={(e) => {
                                                    const updated = scheduleByGrade[activeGrade][activeDay].map(s =>
                                                        s.id === slot.id ? { ...s, time: e.target.value } : s
                                                    );
                                                    setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: { ...scheduleByGrade[activeGrade], [activeDay]: updated } });
                                                }}
                                                style={{ width: '120px' }}
                                            />
                                        ) : (
                                            slot.time
                                        )}
                                    </td>
                                    <td data-label="Subject">
                                        {isEditing ? (
                                            <input
                                                value={slot.subject}
                                                onChange={(e) => {
                                                    const updated = scheduleByGrade[activeGrade][activeDay].map(s =>
                                                        s.id === slot.id ? { ...s, subject: e.target.value } : s
                                                    );
                                                    setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: { ...scheduleByGrade[activeGrade], [activeDay]: updated } });
                                                }}
                                                style={{ width: '120px' }}
                                            />
                                        ) : (
                                            slot.subject
                                        )}
                                    </td>
                                    <td data-label="Teacher">
                                        {isEditing ? (
                                            <input
                                                value={slot.teacher}
                                                onChange={(e) => {
                                                    const updated = scheduleByGrade[activeGrade][activeDay].map(s =>
                                                        s.id === slot.id ? { ...s, teacher: e.target.value } : s
                                                    );
                                                    setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: { ...scheduleByGrade[activeGrade], [activeDay]: updated } });
                                                }}
                                                style={{ width: '120px' }}
                                            />
                                        ) : (
                                            slot.teacher
                                        )}
                                    </td>
                                    {isEditing && (
                                        <td data-label="Actions">
                                            <button className="action-btn delete" onClick={() => handleDelete(slot.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="timetable-cards">
                            {(scheduleByGrade[activeGrade]?.[activeDay] || []).map((slot) => (
                                <div key={slot.id} className="timetable-card">
                                    <div className="timetable-card-row">
                                        <span className="label">Time</span>
                                        <span className="value">
                                            <Clock size={14} />
                                            {isEditing ? (
                                                <input
                                                    value={slot.time}
                                                    onChange={(e) => {
                                                        const updated = scheduleByGrade[activeGrade][activeDay].map(s =>
                                                            s.id === slot.id ? { ...s, time: e.target.value } : s
                                                        );
                                                        setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: { ...scheduleByGrade[activeGrade], [activeDay]: updated } });
                                                    }}
                                                    style={{ width: '110px' }}
                                                />
                                            ) : (
                                                slot.time
                                            )}
                                        </span>
                                    </div>
                                    <div className="timetable-card-row">
                                        <span className="label">Subject</span>
                                        <span className="value">
                                            {isEditing ? (
                                                <input
                                                    value={slot.subject}
                                                    onChange={(e) => {
                                                        const updated = scheduleByGrade[activeGrade][activeDay].map(s =>
                                                            s.id === slot.id ? { ...s, subject: e.target.value } : s
                                                        );
                                                        setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: { ...scheduleByGrade[activeGrade], [activeDay]: updated } });
                                                    }}
                                                    style={{ width: '110px' }}
                                                />
                                            ) : (
                                                slot.subject
                                            )}
                                        </span>
                                    </div>
                                    <div className="timetable-card-row">
                                        <span className="label">Teacher</span>
                                        <span className="value">
                                            {isEditing ? (
                                                <input
                                                    value={slot.teacher}
                                                    onChange={(e) => {
                                                        const updated = scheduleByGrade[activeGrade][activeDay].map(s =>
                                                            s.id === slot.id ? { ...s, teacher: e.target.value } : s
                                                        );
                                                        setScheduleByGrade({ ...scheduleByGrade, [activeGrade]: { ...scheduleByGrade[activeGrade], [activeDay]: updated } });
                                                    }}
                                                    style={{ width: '110px' }}
                                                />
                                            ) : (
                                                slot.teacher
                                            )}
                                        </span>
                                    </div>
                                    <div className="timetable-card-row actions">
                                        {isEditing && (
                                            <button className="action-btn delete" onClick={() => handleDelete(slot.id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                        <p>No classes scheduled for {activeDay}.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Add Class for {activeDay}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', color: '#6b7280' }}>&times;</button>
                        </div>
                        <form onSubmit={handleAddSlot}>
                            <div className="form-group">
                                <label>Time Period (e.g., 09:00 - 10:00)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="09:00 - 10:00"
                                    value={newSlot.time}
                                    onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={newSlot.subject}
                                    onChange={(e) => setNewSlot({ ...newSlot, subject: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Teacher</label>
                                <input
                                    type="text"
                                    required
                                    value={newSlot.teacher}
                                    onChange={(e) => setNewSlot({ ...newSlot, teacher: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" style={{ border: '1px solid #d1d5db' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Class</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeTable;
