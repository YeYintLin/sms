import { useState, useEffect } from 'react';
import { User, Mail, Phone, CreditCard, GraduationCap, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast.jsx';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', avatarUrl: '', coverUrl: '', email: '', contact: '', department: '' });
    const { showToast } = useToast();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                setUserData(response.data);
                setFormData({
                    name: response.data.name || '',
                    avatarUrl: response.data.avatarUrl || '',
                    coverUrl: response.data.coverUrl || '',
                    email: response.data.email || '',
                    contact: response.data.contact || '',
                    department: response.data.department || ''
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
                showToast('Failed to load profile data', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [showToast]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader2 className="animate-spin" size={48} color="var(--primary-color)" />
            </div>
        );
    }

    if (!userData) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h2 style={{ color: 'var(--text-color)' }}>User not found</h2>
            </div>
        );
    }

    const role = userData.role || 'User';
    const isStudent = role === 'student';
    const isTeacher = role === 'teacher';
    const profile = userData.profile || {};
    const contactValue = profile.contact || userData.contact || '';
    const avatarUrl = userData.avatarUrl || profile.avatarUrl;
    const coverUrl = userData.coverUrl || profile.coverUrl;
    const initials = (userData.name || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('');

    const handleImageUpload = (field) => (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({ ...prev, [field]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        try {
            const response = await api.put('/auth/me', {
                name: formData.name,
                avatarUrl: formData.avatarUrl,
                coverUrl: formData.coverUrl,
                email: formData.email,
                contact: formData.contact,
                department: formData.department
            });
            setUserData(response.data);
            setIsEditing(false);
            showToast('Profile updated', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Failed to update profile', 'error');
        }
    };

    return (
        <div className="profile-page" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div className="profile-container" style={{ width: '100%', maxWidth: '980px' }}>
                {/* Top profile header */}
                <div className="card profile-header-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        height: '180px',
                        background: coverUrl
                            ? `url(${coverUrl}) center / cover no-repeat`
                            : 'linear-gradient(120deg, var(--primary-color), #1f2937)',
                        position: 'relative'
                    }}>
                        <div className="user-avatar-outer">
                            <div className="user-avatar">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={userData.name}
                                        className="user-avatar-img"
                                    />
                                ) : (
                                    initials || <User size={40} />
                                )}
                                <span className="user-avatar-status" />
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '72px 32px 24px 32px',
                        gap: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{ minWidth: '240px' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-color)', marginBottom: '0.25rem' }}>{userData.name}</h2>
                            <p style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }}>{userData.email}</p>
                            <span style={{
                                backgroundColor: 'var(--bg-badge)',
                                color: 'var(--text-badge)',
                                padding: '0.25rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                textTransform: 'capitalize'
                            }}>{role}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {(role === 'teacher' || role === 'admin') && (
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: '0.5rem 1rem' }}
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            )}
                            <button className="btn" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', background: 'var(--white)' }}>
                                Message
                            </button>
                        </div>
                    </div>

                    {isEditing && (role === 'teacher' || role === 'admin') && (
                        <div style={{ padding: '0 32px 24px 32px' }}>
                            <div className="card" style={{ padding: '1.25rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-color)' }}>Edit Profile</h3>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="text"
                                            value={formData.contact}
                                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            placeholder="Administration"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Avatar URL</label>
                                    <input
                                        type="text"
                                        value={formData.avatarUrl}
                                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload('avatarUrl')}
                                        style={{ marginTop: '0.5rem' }}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>Cover Image URL</label>
                                    <input
                                        type="text"
                                        value={formData.coverUrl}
                                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload('coverUrl')}
                                        style={{ marginTop: '0.5rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button
                                        className="btn"
                                        style={{ border: '1px solid var(--border-color)', background: 'var(--white)' }}
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSave}>
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '1rem',
                        padding: '0 32px 24px 32px'
                    }}>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '1rem' }}>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Status</p>
                            <p style={{ color: 'var(--text-color)', fontWeight: '600' }}>Active</p>
                        </div>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '1rem' }}>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{isStudent ? 'Grade' : isTeacher ? 'Subject' : 'Department'}</p>
                            <p style={{ color: 'var(--text-color)', fontWeight: '600' }}>
                                {isStudent ? (profile.grade || 'Not set') : isTeacher ? (profile.subject || 'Not set') : 'Administration'}
                            </p>
                        </div>
                        <div style={{ background: 'var(--bg-body)', borderRadius: '0.75rem', padding: '1rem' }}>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Contact</p>
                            <p style={{ color: 'var(--text-color)', fontWeight: '600' }}>{contactValue || 'Not Provided'}</p>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div style={{ marginTop: '1.5rem' }} className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-color)' }}>Profile Details</h3>
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {/* Email */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', color: 'var(--text-light)' }}>
                                <Mail size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Email Address</p>
                                <p style={{ fontWeight: '500', color: 'var(--text-color)' }}>{userData.email}</p>
                            </div>
                        </div>

                        {/* Phone / Contact */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', color: 'var(--text-light)' }}>
                                <Phone size={20} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Contact Number</p>
                                <p style={{ fontWeight: '500', color: 'var(--text-color)' }}>{contactValue || 'Not Provided'}</p>
                            </div>
                        </div>

                        {/* ID / Role Info */}
                        {(isStudent || isTeacher) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', color: 'var(--text-light)' }}>
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{isStudent ? 'Student ID' : 'Employee ID'}</p>
                                    <p style={{ fontWeight: '500', color: 'var(--text-color)' }}>{isStudent ? profile.studentId : userData._id.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                        )}

                        {/* Grade / Subject (Conditional) */}
                        {(isStudent || isTeacher) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', color: 'var(--text-light)' }}>
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{isStudent ? 'Current Grade' : 'Teaching Subject'}</p>
                                    <p style={{ fontWeight: '500', color: 'var(--text-color)' }}>{isStudent ? profile.grade : profile.subject}</p>
                                </div>
                            </div>
                        )}

                        {/* Experience for Teachers */}
                        {isTeacher && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', color: 'var(--text-light)' }}>
                                    <Loader2 size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Years of Experience</p>
                                    <p style={{ fontWeight: '500', color: 'var(--text-color)' }}>{profile.experience}</p>
                                </div>
                            </div>
                        )}

                        {/* Admin Specific */}
                        {role === 'admin' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-body)', borderRadius: '0.5rem', color: 'var(--text-light)' }}>
                                    <GraduationCap size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>Department</p>
                                    <p style={{ fontWeight: '500', color: 'var(--text-color)' }}>Administration & Management</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
