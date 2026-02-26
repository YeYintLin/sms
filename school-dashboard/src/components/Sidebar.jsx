import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutDashboard, Users, GraduationCap, School, FileText, Calendar, Clock, Book, User, Folder, Users2, UserCog, UserRound, Edit3, CheckSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useLocale } from '../hooks/useLocale.jsx';

const Sidebar = ({ isOpen, onClose }) => {
  const { canView, userRole } = usePermissions();
  const { t } = useLocale();
  const isAdmin = userRole === 'admin';
  const fileInputRef = useRef(null);
  const [schoolName, setSchoolName] = useState(t('sidebar.school'));
  const [schoolLogo, setSchoolLogo] = useState('');
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const items = useMemo(() => ([
    { id: 'dashboard', labelKey: 'sidebar.dashboard', to: '/', icon: <LayoutDashboard size={24} /> },
    { id: 'calendar', labelKey: 'sidebar.calendar', to: '/calendar', icon: <Calendar size={24} /> },
    { id: 'students', labelKey: 'sidebar.students', to: '/students', icon: <UserRound size={24} /> },
    { id: 'attendance', labelKey: 'sidebar.attendance', to: '/attendance', icon: <CheckSquare size={24} /> },
    { id: 'books', labelKey: 'sidebar.books', to: '/books', icon: <Book size={24} /> },
    { id: 'files', labelKey: 'sidebar.files', to: '/files', icon: <Folder size={24} /> },
    { id: 'profile', labelKey: 'sidebar.profile', to: '/profile', icon: <User size={24} /> },
    { id: 'timetable', labelKey: 'sidebar.timetable', to: '/timetable', icon: <Clock size={24} /> },
    { id: 'results', labelKey: 'sidebar.results', to: '/results', icon: <FileText size={24} /> },
    { id: 'teachers', labelKey: 'sidebar.teachers', to: '/teachers', icon: <GraduationCap size={24} /> },
    { id: 'parents', labelKey: 'sidebar.parents', to: '/parents', icon: <Users2 size={24} /> },
    { id: 'classes', labelKey: 'sidebar.classes', to: '/classes', icon: <FileText size={24} /> },
    { id: 'adminUsers', labelKey: 'sidebar.adminUsers', to: '/admin/users', icon: <UserCog size={24} /> },
  ]), []);

  const [order, setOrder] = useState(items.map((i) => i.id));

  useEffect(() => {
    if (!isAdmin) return;
    const saved = localStorage.getItem('sidebar_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOrder(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem('sidebar_order', JSON.stringify(order));
    }
  }, [isAdmin, order]);

  useEffect(() => {
    const savedName = localStorage.getItem('school_name');
    const savedLogo = localStorage.getItem('school_logo');
    if (typeof savedName === 'string' && savedName.trim().length > 0) {
      setSchoolName(savedName);
    }
    if (typeof savedLogo === 'string' && savedLogo.trim().length > 0) {
      setSchoolLogo(savedLogo);
    }
  }, []);

  const handleLogoPick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      if (value) {
        setSchoolLogo(value);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrand = () => {
    localStorage.setItem('school_name', schoolName.trim() || t('sidebar.school'));
    localStorage.setItem('school_logo', schoolLogo || '');
    setIsEditingBrand(false);
  };

  const handleCancelBrand = () => {
    const savedName = localStorage.getItem('school_name') || t('sidebar.school');
    const savedLogo = localStorage.getItem('school_logo') || '';
    setSchoolName(savedName);
    setSchoolLogo(savedLogo);
    setIsEditingBrand(false);
  };

  const orderedItems = order
    .map((id) => items.find((i) => i.id === id))
    .filter(Boolean);
  const visibleItems = orderedItems.filter((i) => (i.id === 'profile' ? true : canView(i.id)));

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e, id) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === id) return;
    const next = [...order];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(id);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    setOrder(next);
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <button
          type="button"
          onClick={isAdmin ? handleLogoPick : undefined}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(79,70,229,0.12)',
            border: 'none',
            padding: 0,
            cursor: isAdmin ? 'pointer' : 'default'
          }}
          title={isAdmin ? t('sidebar.change_logo') : t('sidebar.school_logo')}
        >
          {schoolLogo ? (
            <img src={schoolLogo} alt="School logo" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            <School size={36} />
          )}
        </button>
        {isEditingBrand && isAdmin ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder={t('sidebar.school_name')}
              style={{ padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid #d1d5db' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleSaveBrand}>{t('common.save')}</button>
              <button type="button" className="btn" style={{ border: '1px solid #d1d5db' }} onClick={handleCancelBrand}>{t('common.cancel')}</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="sidebar-brand">{schoolName || t('sidebar.school')}</span>
            {isAdmin && (
              <button
                type="button"
                className="btn"
                style={{ border: '1px solid #d1d5db', padding: '0.2rem 0.45rem', lineHeight: 1 }}
                onClick={() => setIsEditingBrand(true)}
                title={t('sidebar.edit_school_name')}
              >
                <Edit3 size={14} />
              </button>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          style={{ display: 'none' }}
        />
      </div>
      <nav className="sidebar-nav">
        <ul>
          {visibleItems.map((item) => (
            <li
              key={item.id}
              draggable={isAdmin}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => isAdmin && e.preventDefault()}
              onDrop={(e) => isAdmin && handleDrop(e, item.id)}
            >
              <NavLink to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={t(item.labelKey)}>
                {item.icon}
                <span className="nav-label">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
};

export default Sidebar;
