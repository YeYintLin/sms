import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit3, Save, X, MessageSquare } from 'lucide-react';
import api from '../utils/api';
import { usePermissions } from '../hooks/usePermissions';
import MessageModal from '../components/MessageModal';

const TeacherProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userRole } = usePermissions();
    const isAdmin = userRole === 'admin';
    const canMessage = isAdmin || userRole === 'student';
    const [teacher, setTeacher] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        grade: '',
        classroom: '',
        experience: '',
        contact: '',
        birthday: ''
    });

    useEffect(() => {
        const fetchTeacher = async () => {
            try {
                const res = await api.get(`/teachers/${id}`);
                setTeacher(res.data);
                setFormData({
                    name: res.data?.userId?.name || '',
                    email: res.data?.userId?.email || '',
                    subject: res.data?.subject || '',
                    grade: res.data?.grade || '',
                    classroom: res.data?.classroom || '',
                    experience: res.data?.experience || '',
                    contact: res.data?.contact || '',
                    birthday: res.data?.birthday ? res.data.birthday.substring(0, 10) : ''
                });
            } catch (err) {
                console.error('Failed to load teacher', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeacher();
    }, [id]);

    const handleSave = async () => {
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                subject: formData.subject,
                grade: formData.grade,
                classroom: formData.classroom,
                experience: formData.experience,
                contact: formData.contact,
                birthday: formData.birthday
            };
            const res = await api.put(`/teachers/${id}`, payload);
            setTeacher(res.data);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update teacher', err);
        }
    };

    if (isLoading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                <Loader2 className="animate-spin" size={36} />
            </div>
        );
    }

    if (!teacher) {
        return (
            <div className="page-container">
                <div className="card">Teacher not found.</div>
            </div>
        );
    }

    const initials = (teacher.userId?.name || 'Teacher')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('');

    return (
        <div className="page-container" style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '860px', margin: '0 auto' }}>
            <button className="btn" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', marginBottom: '1rem', padding: '0.6rem 1rem', fontSize: '0.95rem', minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Back
            </button>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                    height: '180px',
                    background: 'linear-gradient(135deg, rgba(14,116,144,0.35), rgba(79,70,229,0.35))',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        left: '2rem',
                        bottom: '-48px',
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle at 30% 30%, #ffffff, #93c5fd)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontSize: '1.4rem',
                        color: '#1e293b',
                        border: '4px solid var(--bg-card)'
                    }}>
                        {initials}
                    </div>
                </div>
                <div style={{ padding: '64px 2rem 2rem 2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>{teacher.userId?.name}</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{teacher.userId?.email}</p>
                        </div>
                        {canMessage && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isEditing ? (
                                    <>
                                        <button className="btn btn-primary" onClick={handleSave}>
                                            <Save size={16} />
                                            Save
                                        </button>
                                        <button className="btn" style={{ border: '1px solid var(--border-color)' }} onClick={() => setIsEditing(false)}>
                                            <X size={16} />
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {isAdmin && (
                                            <button className="btn" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }} onClick={() => setIsEditing(true)}>
                                                <Edit3 size={16} />
                                                Edit
                                            </button>
                                        )}
                                        <button className="btn btn-primary" onClick={() => setIsMessageOpen(true)}>
                                            <MessageSquare size={16} />
                                            Message
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subject</p>
                            {isEditing ? (
                                <input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                            ) : (
                                <p style={{ fontWeight: 600 }}>{teacher.subject}</p>
                            )}
                        </div>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grade</p>
                            {isEditing ? (
                                <input value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
                            ) : (
                                <p style={{ fontWeight: 600 }}>{teacher.grade}</p>
                            )}
                        </div>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Classroom</p>
                            {isEditing ? (
                                <input value={formData.classroom} onChange={(e) => setFormData({ ...formData, classroom: e.target.value })} />
                            ) : (
                                <p style={{ fontWeight: 600 }}>{teacher.classroom || '—'}</p>
                            )}
                        </div>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Experience</p>
                            {isEditing ? (
                                <input value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
                            ) : (
                                <p style={{ fontWeight: 600 }}>{teacher.experience || '—'}</p>
                            )}
                        </div>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '0.9rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Birthday</p>
                            {isEditing ? (
                                <input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} />
                            ) : (
                                <p style={{ fontWeight: 600 }}>{teacher.birthday ? teacher.birthday.substring(0, 10) : '—'}</p>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'grid', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Contact</span>
                            {isEditing ? (
                                <input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} />
                            ) : (
                                <span style={{ fontWeight: 600 }}>{teacher.contact || '—'}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Status</span>
                            <span style={{ fontWeight: 600 }}>Active</span>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            {canMessage && (
                <MessageModal
                    isOpen={isMessageOpen}
                    onClose={() => setIsMessageOpen(false)}
                    otherUser={{
                        id: teacher?.userId?._id,
                        name: teacher?.userId?.name || 'Teacher'
                    }}
                />
            )}
        </div>
    );
};

export default TeacherProfile;
