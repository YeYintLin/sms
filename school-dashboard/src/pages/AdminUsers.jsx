import { useEffect, useState } from 'react';
import api from '../utils/api';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast.jsx';
import { Save, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const resources = [
    'students', 'teachers', 'parents', 'classes', 'attendance', 'exams', 'results',
    'assignments', 'books', 'timetable', 'profile', 'dashboard', 'calendar'
];

const AdminUsers = () => {
    const { canView } = usePermissions();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');
    const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [newPassword, setNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            showToast('Failed to load users', 'error');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openManage = (user) => {
        setSelected({
            ...user,
            isDisabled: !!user.isDisabled,
            bannedUntil: user.bannedUntil ? user.bannedUntil.slice(0, 10) : '',
            blockedPages: user.blockedPages || [],
            permissionsOverride: user.permissionsOverride || {}
        });
        setNewPassword('');
    };

    const toggleBlocked = (path) => {
        setSelected((prev) => {
            const set = new Set(prev.blockedPages || []);
            if (set.has(path)) set.delete(path);
            else set.add(path);
            return { ...prev, blockedPages: Array.from(set) };
        });
    };

    const updateOverride = (resource, key, value) => {
        setSelected((prev) => ({
            ...prev,
            permissionsOverride: {
                ...prev.permissionsOverride,
                [resource]: {
                    ...prev.permissionsOverride?.[resource],
                    [key]: value
                }
            }
        }));
    };

    const saveRestrictions = async () => {
        try {
            await api.patch(`/admin/users/${selected._id}/restrictions`, {
                isDisabled: selected.isDisabled,
                bannedUntil: selected.bannedUntil ? new Date(selected.bannedUntil).toISOString() : null,
                blockedPages: selected.blockedPages,
                permissionsOverride: selected.permissionsOverride
            });
            showToast('Restrictions updated', 'success');
            setSelected(null);
            fetchUsers();
        } catch (err) {
            console.error(err);
            showToast('Failed to update restrictions', 'error');
        }
    };

    const resetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        try {
            setIsResetting(true);
            await api.patch(`/admin/users/${selected._id}/password`, { newPassword });
            showToast('Password reset successfully', 'success');
            setNewPassword('');
        } catch (err) {
            console.error(err);
            showToast('Failed to reset password', 'error');
        } finally {
            setIsResetting(false);
        }
    };

    const openConfirm = ({ title, message, onConfirm }) => {
        setConfirm({ isOpen: true, title, message, onConfirm });
    };

    if (!canView('adminUsers')) {
        return (
            <div className="page-container">
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Access restricted</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        You do not have permission to view this page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Manage Users</h1>
            </div>

            <div className="card">
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[
                        { key: 'all', label: 'All', color: 'var(--text-main)', bg: 'var(--bg-body)', border: 'var(--border-color)' },
                        { key: 'teacher', label: 'Teachers', color: '#059669', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.25)' },
                        { key: 'student', label: 'Students', color: '#4338ca', bg: 'rgba(79,70,229,0.15)', border: 'rgba(79,70,229,0.25)' },
                        { key: 'parent', label: 'Parents', color: '#d97706', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' }
                    ].map((tag) => (
                        <button
                            key={tag.key}
                            onClick={() => setRoleFilter(tag.key)}
                            className="btn"
                            style={{
                                padding: '0.35rem 0.9rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                border: `1px solid ${tag.border}`,
                                background: roleFilter === tag.key ? tag.bg : 'transparent',
                                color: tag.color
                            }}
                        >
                            {tag.label}
                            <span style={{ marginLeft: '0.4rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                {tag.key === 'all'
                                    ? users.length
                                    : users.filter((u) => u.role === tag.key).length}
                            </span>
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {users
                        .filter((u) => (roleFilter === 'all' ? true : u.role === roleFilter))
                        .map((u) => (
                            <div key={u._id} className="card" style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.email}</div>
                                    </div>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background:
                                            u.role === 'teacher' ? 'rgba(16,185,129,0.15)' :
                                            u.role === 'parent' ? 'rgba(245,158,11,0.15)' :
                                            'rgba(79,70,229,0.15)',
                                        color:
                                            u.role === 'teacher' ? '#059669' :
                                            u.role === 'parent' ? '#d97706' :
                                            '#4338ca'
                                    }}>
                                        {u.role}
                                    </span>
                                </div>

                                <div style={{ marginTop: '0.75rem', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                    Status: <strong>{u.isDisabled ? 'Disabled' : (u.bannedUntil ? `Banned` : 'Active')}</strong>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => openManage(u)}
                                    style={{ marginTop: '0.75rem', width: '100%' }}
                                >
                                    Manage
                                </button>
                            </div>
                        ))}
                </div>
            </div>

            {selected && (
                <div className="modal-overlay">
                    <div className="modal-content admin-user-modal">
                        <div className="modal-header" style={{ paddingBottom: '0.75rem' }}>
                            <h2>Manage {selected.name}</h2>
                        </div>

                        <div className="admin-user-sections">
                            <div className="admin-user-section">
                                <h3>Access</h3>
                                <div className="admin-toggle">
                                    <div>
                                        <div className="label">Disable Login</div>
                                        <div className="hint">Block the user from signing in</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={selected.isDisabled}
                                        onChange={(e) => setSelected({ ...selected, isDisabled: e.target.checked })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                                    <label>Ban Until (optional)</label>
                                    <input
                                        type="date"
                                        value={selected.bannedUntil}
                                        onChange={(e) => setSelected({ ...selected, bannedUntil: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                                    <label>Reset Password</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <input
                                            type="password"
                                            placeholder="New password (min 6 chars)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{ flex: 1, minWidth: '200px' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={resetPassword}
                                            disabled={isResetting}
                                        >
                                            {isResetting ? 'Resetting...' : 'Reset Password'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-user-section">
                                <h3>Blocked Pages</h3>
                                <div className="admin-check-grid">
                                    {['/students','/teachers','/parents','/classes','/attendance','/exams','/results','/assignments','/books','/timetable','/profile','/','/calendar'].map((p) => (
                                        <label key={p} className="admin-check">
                                            <input
                                                type="checkbox"
                                                checked={selected.blockedPages.includes(p)}
                                                onChange={() => toggleBlocked(p)}
                                            />
                                            <span>{p === '/' ? '/ (dashboard)' : p}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-user-section">
                                <h3>Permission Overrides</h3>
                                <div className="admin-perms">
                                    {resources.map((r) => (
                                        <div key={r} className="admin-perm-row">
                                            <strong>{r}</strong>
                                            {['view','create','update','delete'].map((perm) => (
                                                <label key={perm} className="admin-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected.permissionsOverride?.[r]?.[perm]}
                                                        onChange={(e) => updateOverride(r, perm, e.target.checked)}
                                                    />
                                                    {perm}
                                                </label>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '1rem' }}>
                            <button className="btn" onClick={() => setSelected(null)} style={{ border: '1px solid var(--border-color)' }}>
                                Cancel
                            </button>
                            <button
                                className="btn"
                                style={{ border: '1px solid var(--danger-color)', color: 'var(--danger-color)' }}
                                onClick={() => openConfirm({
                                    title: 'Delete User',
                                    message: 'Are you sure you want to delete this account? This cannot be undone.',
                                    onConfirm: async () => {
                                        try {
                                            await api.delete(`/admin/users/${selected._id}`);
                                            showToast('User deleted', 'success');
                                            setSelected(null);
                                            fetchUsers();
                                        } catch (err) {
                                            showToast('Failed to delete user', 'error');
                                        }
                                    }
                                })}
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                            <button className="btn btn-primary" onClick={saveRestrictions}>
                                <Save size={16} />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirm.isOpen}
                title={confirm.title}
                message={confirm.message}
                onConfirm={async () => {
                    if (confirm.onConfirm) await confirm.onConfirm();
                    setConfirm({ isOpen: false, title: '', message: '', onConfirm: null });
                }}
                onCancel={() => setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default AdminUsers;
