import { useEffect, useMemo, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../utils/api';

const Dashboard = () => {
    const { userName, userRole } = usePermissions();
    const [userGrade, setUserGrade] = useState('');
    const [totalStudents, setTotalStudents] = useState(0);
    const [gradeCount, setGradeCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);
    const [attendanceDays, setAttendanceDays] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/students/stats');
                const total = res.data?.total ?? 0;
                const byGrade = res.data?.byGrade ?? {};
                setTotalStudents(total);
                setGradeCount(userGrade ? (byGrade[userGrade] ?? 0) : 0);
            } catch (err) {
                console.error('Failed to load student stats', err);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, [userGrade]);

    useEffect(() => {
        const fetchProfileGrade = async () => {
            try {
                const res = await api.get('/auth/me');
                const grade = res.data?.profile?.grade || '';
                setUserGrade(grade);
            } catch {
                setUserGrade('');
            }
        };
        fetchProfileGrade();
    }, []);

    useEffect(() => {
        const fetchAttendance = async () => {
            setAttendanceLoading(true);
            try {
                const params = new URLSearchParams();
                if (userRole !== 'admin' && userGrade) {
                    params.set('grade', userGrade);
                }
                const qs = params.toString();
                const res = await api.get(`/attendance/weekly${qs ? `?${qs}` : ''}`);
                setAttendanceDays(res.data?.days || []);
            } catch (err) {
                console.error('Failed to load attendance overview', err);
                setAttendanceDays([]);
            } finally {
                setAttendanceLoading(false);
            }
        };
        fetchAttendance();
    }, [userGrade, userRole]);

    const attendance = useMemo(() => {
        if (attendanceDays.length > 0) {
            return attendanceDays.map((d) => ({ day: d.day, value: d.percent }));
        }
        return [
            { day: 'Mon', value: 0 },
            { day: 'Tue', value: 0 },
            { day: 'Wed', value: 0 },
            { day: 'Thu', value: 0 },
            { day: 'Fri', value: 0 },
            { day: 'Sat', value: 0 },
            { day: 'Sun', value: 0 },
        ];
    }, [attendanceDays]);

    return (
        <div className="page-container">
            <div
                className="card"
                style={{
                    padding: '3.75rem',
                    borderRadius: '22px',
                    minHeight: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(79,70,229,0.16), rgba(16,185,129,0.16))',
                    border: '1px solid var(--border-color)'
                }}
            >
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                    Welcome back, {userName || 'User'}
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '1rem' }}>
                    Glad to see you here. Ready to get started?
                </p>
            </div>

            <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: '160px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                                {statsLoading ? '—' : totalStudents}
                            </div>
                        </div>
                        <div style={{ minWidth: '180px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {userGrade ? `${userGrade} Students` : 'Your Grade Students'}
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                                {statsLoading ? '—' : gradeCount}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Attendance</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {attendanceLoading ? 'Loading...' : 'Weekly overview (%)'}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '0.6rem',
                        marginTop: '1.5rem',
                        alignItems: 'end',
                        height: '120px'
                    }}
                >
                    {attendance.map((item) => (
                        <div key={item.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                                style={{
                                    width: '100%',
                                    height: `${item.value * 1.0}px`,
                                    minHeight: item.value === 0 ? '6px' : '24px',
                                    borderRadius: '12px',
                                    background: item.value === 0 ? 'var(--border-color)' : 'linear-gradient(180deg, #4f46e5, #22c55e)'
                                }}
                                title={`${item.value}%`}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.day}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
