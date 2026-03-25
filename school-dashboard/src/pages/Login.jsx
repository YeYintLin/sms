import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School, User, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../hooks/useToast.jsx';
import { useLocale } from '../hooks/useLocale.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const Login = ({ onLogin }) => {
    const [role, setRole] = useState('student');
    const [email, setEmail] = useState('student@school.com');
    const [password, setPassword] = useState('password');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [grade, setGrade] = useState('');
    const [name, setName] = useState('');
    const [parentName, setParentName] = useState('');
    const [registerNumber, setRegisterNumber] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [subject, setSubject] = useState('');
    const [contact, setContact] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { setAuthData } = useAuth();
    const { t, locale, setLocale } = useLocale();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
                grade
            });

            const { role: userRole, name, restrictions } = response.data;

            // Store auth data
            if (grade) {
                localStorage.setItem('grade', grade);
            } else {
                localStorage.removeItem('grade');
            }
            setAuthData({
                role: userRole,
                userName: name,
                restrictions
            });

            onLogin(userRole);
            showToast(t('login.welcome_back_name', { name }), 'success');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.msg || t('login.login_failed');
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                role,
                grade,
                parentName,
                registerNumber,
                dateOfBirth,
                subject,
                contact
            });

            if (response?.data) {
                showToast(t('login.account_created'), 'success');
                setIsRegister(false);
            }
        } catch (error) {
            console.error('Register error:', error);
            const message = error.response?.data?.msg || t('login.registration_failed');
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const roles = [
        { id: 'admin', label: t('login.role_admin'), icon: <School size={24} /> },
        { id: 'teacher', label: t('login.role_teacher'), icon: <GraduationCap size={24} /> },
        { id: 'student', label: t('login.role_student'), icon: <User size={24} /> },
        { id: 'parent', label: t('login.role_parent'), icon: <Users size={24} /> },
    ];
    const registerRoles = roles.filter(r => r.id === 'teacher' || r.id === 'student');

    return (
        <div className="login-page">
            <div className="card login-card">
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <select
                        value={locale}
                        onChange={(e) => setLocale(e.target.value)}
                        aria-label="Language"
                        style={{
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-color)',
                            borderRadius: 8,
                            padding: '0.35rem 0.5rem'
                        }}
                    >
                        <option value="en">{t('language.en')}</option>
                        <option value="mm">{t('language.mm')}</option>
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: 'var(--primary-color)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        marginBottom: '1rem'
                    }}>
                        <School size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                        {isRegister ? t('login.hello') : t('login.welcome_back')}
                    </h1>
                    <p style={{ color: 'var(--text-light)' }}>
                        {isRegister ? t('login.create_account') : t('login.sign_in_account')}
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isRegister ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {(isRegister ? registerRoles : roles).map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                                setRole(r.id);
                                // Set default emails for convenience during testing
                                if (r.id === 'admin') setEmail('admin@school.com');
                                else if (r.id === 'teacher') setEmail('teacher@school.com');
                                else if (r.id === 'student') setEmail('student@school.com');
                                if (r.id !== 'teacher' && r.id !== 'student') setGrade('');
                            }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                border: role === r.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                backgroundColor: role === r.id ? 'rgba(79, 70, 229, 0.1)' : 'var(--white)',
                                color: role === r.id ? 'var(--primary-color)' : 'var(--text-light)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ marginBottom: '0.25rem' }}>{r.icon}</div>
                            <span style={{ fontSize: '0.65rem', fontWeight: '500' }}>{r.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={isRegister ? handleRegister : handleLogin}>
                    {isRegister && (
                        <div className="form-group">
                            <label style={{ color: 'var(--text-color)' }}>{t('login.full_name')} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <input
                                type="text"
                                placeholder={t('login.enter_full_name')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--white)',
                                    color: 'var(--text-color)'
                                }}
                                required
                            />
                        </div>
                    )}
                    {isRegister && (role === 'student' || role === 'teacher') && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ color: 'var(--text-color)' }}>{t('login.parent_name')} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <input
                                type="text"
                                placeholder={t('login.enter_parent_name')}
                                value={parentName}
                                onChange={(e) => setParentName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--white)',
                                    color: 'var(--text-color)'
                                }}
                                required
                            />
                        </div>
                    )}
                    {isRegister && (role === 'student' || role === 'teacher') && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ color: 'var(--text-color)' }}>{t('login.register_number')} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <input
                                type="text"
                                placeholder={t('login.enter_register_number')}
                                value={registerNumber}
                                onChange={(e) => setRegisterNumber(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--white)',
                                    color: 'var(--text-color)'
                                }}
                                required
                            />
                        </div>
                    )}
                    {isRegister && (role === 'student' || role === 'teacher') && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ color: 'var(--text-color)' }}>{t('login.date_of_birth')} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <input
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--white)',
                                    color: 'var(--text-color)'
                                }}
                                required
                            />
                        </div>
                    )}
                    {isRegister && role === 'teacher' && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ color: 'var(--text-color)' }}>Subject <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <input
                                type="text"
                                placeholder="e.g. Mathematics"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--white)',
                                    color: 'var(--text-color)'
                                }}
                                required
                            />
                        </div>
                    )}
                    {isRegister && role === 'teacher' && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ color: 'var(--text-color)' }}>Contact <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <input
                                type="text"
                                placeholder="+1 234 567 890"
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--white)',
                                    color: 'var(--text-color)'
                                }}
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label style={{ color: 'var(--text-color)' }}>{t('login.email')} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                        <input
                            type="email"
                            placeholder={t('login.enter_email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--white)',
                                color: 'var(--text-color)'
                            }}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label style={{ color: 'var(--text-color)' }}>{t('login.password')} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('login.enter_password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 2.75rem 0.75rem 0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--white)',
                                    color: 'var(--text-color)'
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
                                style={{
                                    position: 'absolute',
                                    right: '0.6rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-light)',
                                    cursor: 'pointer'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    {!isRegister && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => showToast(t('login.contact_admin_reset'), 'info')}
                                style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.85rem' }}
                            >
                                {t('login.forgot_password')}
                            </button>
                        </div>
                    )}
                    {(role === 'teacher' || role === 'student') && (
                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label style={{ color: 'var(--text-color)' }}>{t('login.grade')} <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-color)'
                                }}
                                required={isRegister}
                            >
                                <option value="">{t('login.select_grade')}</option>
                                <option value="KG">KG</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={`Grade ${i + 1}`}>{`Grade ${i + 1}`}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            marginTop: '1.5rem',
                            padding: '0.75rem',
                            opacity: isLoading ? 0.7 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLoading
                            ? (isRegister ? t('login.creating_account') : t('login.signing_in'))
                            : (isRegister ? t('login.register_as', { role: roles.find(r => r.id === role)?.label }) : t('login.sign_in_as', { role: roles.find(r => r.id === role)?.label }))}
                    </button>
                </form>

                <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                    {isRegister ? t('login.already_have_account') : t('login.dont_have_account')}{' '}
                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        style={{ color: 'var(--primary-color)', fontWeight: 600 }}
                    >
                        {isRegister ? t('login.sign_in') : t('login.register')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
