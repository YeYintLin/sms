import { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const Exams = () => {
    const { canCreate } = usePermissions();
    const [exams, setExams] = useState([
        { id: 1, subject: 'Mathematics', date: '2023-10-15', time: '09:00 AM', class: '10th Grade' },
        { id: 2, subject: 'Physics', date: '2023-10-17', time: '10:30 AM', class: '10th Grade' },
        { id: 3, subject: 'English', date: '2023-10-20', time: '09:00 AM', class: '9th Grade' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExam, setNewExam] = useState({ subject: '', date: '', time: '', class: '' });

    const handleAddExam = (e) => {
        e.preventDefault();
        setExams([...exams, { id: exams.length + 1, ...newExam }]);
        setIsModalOpen(false);
        setNewExam({ subject: '', date: '', time: '', class: '' });
    };

    const handleDelete = (id) => {
        setExams(exams.filter(exam => exam.id !== id));
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Exam Dates</h1>
                {canCreate('exams') && (
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} />
                        Add Exam
                    </button>
                )}
            </div>

            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Class</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {exams.map((exam) => (
                            <tr key={exam.id}>
                                <td>{exam.subject}</td>
                                <td>{exam.date}</td>
                                <td>{exam.time}</td>
                                <td>{exam.class}</td>
                                <td>
                                    <button className="action-btn delete" onClick={() => handleDelete(exam.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Schedule New Exam</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', color: '#6b7280' }}>&times;</button>
                        </div>
                        <form onSubmit={handleAddExam}>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Mathematics"
                                    value={newExam.subject}
                                    onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={newExam.date}
                                        onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={newExam.time}
                                        onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Class / Grade</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 10th Grade"
                                    value={newExam.class}
                                    onChange={(e) => setNewExam({ ...newExam, class: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ border: '1px solid #d1d5db' }}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Schedule Exam
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Exams;
