import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast.jsx';
import api from '../utils/api';

const Attendance = () => {
    const { canCreate, userRole } = usePermissions();
    const { showToast } = useToast();
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().substring(0, 10));
    const [reportFrom, setReportFrom] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
    const [reportTo, setReportTo] = useState(() => new Date().toISOString().substring(0, 10));
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [teacherGrade, setTeacherGrade] = useState('');
    const [teacherClassroom, setTeacherClassroom] = useState('');
    const [students, setStudents] = useState([]);
    const [records, setRecords] = useState([]);
    const [reportRows, setReportRows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isReportLoading, setIsReportLoading] = useState(false);

    const gradeOptions = useMemo(() => {
        const order = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
        const set = new Set(students.map((s) => s.grade).filter(Boolean));
        return Array.from(set).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }, [students]);

    const classroomOptions = useMemo(() => ['A', 'B', 'C'], []);

    useEffect(() => {
        const loadProfile = async () => {
            if (userRole !== 'teacher') return;
            try {
                const res = await api.get('/auth/me');
                const grade = res.data?.profile?.grade || '';
                const classroom = res.data?.profile?.classroom || '';
                setTeacherGrade(grade);
                setTeacherClassroom(classroom);
                setSelectedGrade(grade);
                setSelectedClassroom(classroom);
            } catch {
                setTeacherGrade('');
                setTeacherClassroom('');
                setSelectedClassroom('');
            }
        };
        loadProfile();
    }, [userRole]);

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const res = await api.get('/students');
                setStudents(res.data || []);
            } catch {
                showToast('Failed to load students', 'error');
            }
        };
        loadStudents();
    }, [showToast]);

    useEffect(() => {
        const loadAttendance = async () => {
            if (!selectedDate) return;
            if (userRole === 'admin' && !selectedGrade) return;
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ date: selectedDate });
                if (selectedGrade) params.set('grade', selectedGrade);
                if (selectedClassroom) params.set('classroom', selectedClassroom);
                const res = await api.get(`/attendance?${params.toString()}`);
                setRecords(res.data?.records || []);
            } catch {
                showToast('Failed to load attendance', 'error');
                setRecords([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadAttendance();
    }, [selectedDate, selectedGrade, selectedClassroom, userRole, showToast]);

    const loadReport = async () => {
        if (userRole === 'admin' && !selectedGrade) {
            showToast('Please select a grade for the report', 'error');
            return;
        }
        setIsReportLoading(true);
        try {
            const params = new URLSearchParams({
                from: reportFrom,
                to: reportTo
            });
            if (selectedGrade) params.set('grade', selectedGrade);
            if (selectedClassroom) params.set('classroom', selectedClassroom);
            const res = await api.get(`/attendance/report?${params.toString()}`);
            setReportRows(res.data?.rows || []);
        } catch (err) {
            const msg = err.response?.data?.msg || 'Failed to load report';
            showToast(msg, 'error');
            setReportRows([]);
        } finally {
            setIsReportLoading(false);
        }
    };

    const downloadCsv = async () => {
        if (userRole === 'admin' && !selectedGrade) {
            showToast('Please select a grade for the report', 'error');
            return;
        }
        const params = new URLSearchParams({
            from: reportFrom,
            to: reportTo,
            format: 'csv'
        });
        if (selectedGrade) params.set('grade', selectedGrade);
        if (selectedClassroom) params.set('classroom', selectedClassroom);
        const url = `${api.defaults.baseURL}/attendance/report?${params.toString()}`;
        window.open(url, '_blank');
    };

    const handleStatusChange = (studentId, status) => {
        setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
    };

    const handleRemarkChange = (studentId, remark) => {
        setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, remark } : r)));
    };

    const handleSave = async () => {
        if (!canCreate('attendance')) return;
        if (userRole === 'admin' && !selectedGrade) {
            showToast('Please select a grade', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await api.post('/attendance', {
                date: selectedDate,
                grade: selectedGrade,
                classroom: selectedClassroom,
                records: records.map((r) => ({
                    studentId: r.studentId,
                    status: r.status,
                    remark: r.remark || ''
                }))
            });
            showToast('Attendance saved', 'success');
        } catch (err) {
            const msg = err.response?.data?.msg || 'Failed to save attendance';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Attendance</h1>
                {canCreate('attendance') && (
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                )}
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    {userRole === 'admin' ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                Grade
                            </label>
                            <select
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                            >
                                <option value="">Select grade</option>
                                {gradeOptions.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                Grade
                            </label>
                            <input type="text" value={teacherGrade || '—'} disabled />
                        </div>
                    )}
                    {userRole === 'admin' ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                Classroom
                            </label>
                            <select
                                value={selectedClassroom}
                                onChange={(e) => setSelectedClassroom(e.target.value)}
                            >
                                <option value="">All classrooms</option>
                                {classroomOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                Classroom
                            </label>
                            <input type="text" value={teacherClassroom || '—'} disabled />
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {isLoading ? (
                    userRole === 'admin' ? (
                        <div className="attendance-loading-state">
                            <div className="attendance-loading-spinner" />
                            <p>Loading attendance...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column', gap: '1rem', color: 'var(--text-light)' }}>
                            <Loader2 className="animate-spin" size={32} />
                            <p>Loading attendance...</p>
                        </div>
                    )
                ) : records.length === 0 ? (
                    <div style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>
                        {userRole === 'admin' && !selectedGrade ? 'Select a grade to view attendance.' : 'No students found for this grade.'}
                    </div>
                ) : (
                    <div className="attendance-table-wrap">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Status</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => (
                                <tr key={r.studentId}>
                                    <td>{r.name}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {['present', 'absent', 'late'].map((s) => {
                                                const isActive = r.status === s;
                                                const color =
                                                    s === 'present' ? '#16a34a' :
                                                    s === 'absent' ? '#dc2626' :
                                                    '#f59e0b';
                                                const bg =
                                                    s === 'present' ? 'rgba(22,163,74,0.12)' :
                                                    s === 'absent' ? 'rgba(220,38,38,0.12)' :
                                                    'rgba(245,158,11,0.12)';
                                                return (
                                                    <label
                                                        key={s}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            fontSize: '0.85rem',
                                                            padding: '0.2rem 0.5rem',
                                                            borderRadius: '999px',
                                                            border: `1px solid ${isActive ? color : 'var(--border-color)'}`,
                                                            color: isActive ? color : 'var(--text-main)',
                                                            background: isActive ? bg : 'transparent'
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`status-${r.studentId}`}
                                                            checked={isActive}
                                                            onChange={() => handleStatusChange(r.studentId, s)}
                                                        />
                                                        {s}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            placeholder="Optional remark"
                                            value={r.remark || ''}
                                            onChange={(e) => handleRemarkChange(r.studentId, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem', display: 'grid', gap: '1rem' }}>
                <div className="page-header" style={{ padding: 0 }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Attendance Summary</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ border: '1px solid var(--border-color)' }} onClick={loadReport} disabled={isReportLoading}>
                            {isReportLoading ? 'Loading...' : 'View Report'}
                        </button>
                        <button className="btn btn-primary" onClick={downloadCsv}>
                            Export CSV
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            From
                        </label>
                        <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            To
                        </label>
                        <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
                    </div>
                    {userRole === 'admin' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                Grade
                            </label>
                            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                                <option value="">Select grade</option>
                                {gradeOptions.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {userRole === 'admin' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                                Classroom
                            </label>
                            <select value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)}>
                                <option value="">All classrooms</option>
                                {classroomOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isReportLoading ? (
                        <div style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>Loading report...</div>
                    ) : reportRows.length === 0 ? (
                        <div style={{ padding: '1.25rem', color: 'var(--text-muted)' }}>No report data yet.</div>
                    ) : (
                        <div className="attendance-table-wrap">
                        <table style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Present</th>
                                    <th>Absent</th>
                                    <th>Late</th>
                                    <th>Total</th>
                                    <th>Percent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportRows.map((r) => (
                                    <tr key={`${r.studentId}-${r.name}`}>
                                        <td>{r.name}</td>
                                        <td>{r.present}</td>
                                        <td>{r.absent}</td>
                                        <td>{r.late}</td>
                                        <td>{r.total}</td>
                                        <td>{r.percent}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
