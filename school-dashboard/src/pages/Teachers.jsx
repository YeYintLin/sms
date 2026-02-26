import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../components/Table';
import { Plus, Loader2, Search, X } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast.jsx';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, teacher: null });
    const [editMode, setEditMode] = useState(false);
    const [selectedTeacherDbId, setSelectedTeacherDbId] = useState(null);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', subject: '', grade: '', classroom: '', experience: '', contact: '', birthday: '' });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { canCreate, userRole } = usePermissions();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/teachers');
            // Flatten the data for the Table component
            const flattenedData = response.data.map(item => ({
                ...item,
                name: item.userId?.name,
                email: item.userId?.email
            }));
            setTeachers(flattenedData);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            showToast('Failed to load teachers data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!newTeacher.name.trim()) errors.name = 'Name is required';
        if (!newTeacher.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTeacher.email)) {
            errors.email = 'Invalid email format';
        }

        if (!editMode && (!newTeacher.password || newTeacher.password.length < 6)) {
            errors.password = 'Password must be at least 6 characters';
        }

        if (!newTeacher.subject.trim()) errors.subject = 'Subject is required';
        if (!newTeacher.grade.trim()) errors.grade = 'Grade is required';
        if (!newTeacher.contact.trim()) errors.contact = 'Contact is required';
        if (!newTeacher.birthday) errors.birthday = 'Birthday is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveTeacher = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Please fix the form errors', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editMode) {
                const response = await api.put(`/teachers/${selectedTeacherDbId}`, newTeacher);

                const updatedData = {
                    ...response.data,
                    name: newTeacher.name,
                    email: newTeacher.email
                };

                setTeachers(teachers.map(t => t._id === selectedTeacherDbId ? updatedData : t));
                showToast(`Teacher ${newTeacher.name} updated successfully!`, 'success');
            } else {
                const response = await api.post('/teachers', newTeacher);

                const newTeacherData = {
                    ...response.data,
                    name: newTeacher.name,
                    email: newTeacher.email
                };

                setTeachers([...teachers, newTeacherData]);
                showToast(`Teacher ${newTeacher.name} added successfully!`, 'success');
            }

            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving teacher:', error);
            const message = error.response?.data?.msg || 'Failed to save teacher';
            showToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewTeacher({ name: '', email: '', password: '', subject: '', grade: '', classroom: '', experience: '', contact: '', birthday: '' });
        setFormErrors({});
        setEditMode(false);
        setSelectedTeacherDbId(null);
    };

    const handleEditClick = (row) => {
        setEditMode(true);
        setSelectedTeacherDbId(row._id);
        setNewTeacher({
            name: row.name || '',
            email: row.email || '',
            subject: row.subject || '',
            grade: row.grade || '',
            classroom: row.classroom || '',
            experience: row.experience || '',
            contact: row.contact || '',
            birthday: row.birthday ? row.birthday.substring(0, 10) : '',
            password: '' // Don't show password
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (row) => {
        setConfirmDialog({ isOpen: true, teacher: row });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.teacher) return;
        try {
            await api.delete(`/teachers/${confirmDialog.teacher._id}`);
            setTeachers(teachers.filter(t => t._id !== confirmDialog.teacher._id));
            showToast(`${confirmDialog.teacher.name} has been deleted`, 'success');
        } catch (error) {
            console.error('Error deleting teacher:', error);
            showToast('Failed to delete teacher', 'error');
        } finally {
            setConfirmDialog({ isOpen: false, teacher: null });
        }
    };

    const columns = [
        { header: "Name", accessor: "name" },
        { header: "Subject", accessor: "subject" },
        { header: "Grade", accessor: "grade" },
        { header: "Classroom", accessor: "classroom" },
        { header: "Experience", accessor: "experience" },
        { header: "Contact Number", accessor: "contact" },
    ];

    const filteredTeachers = teachers.filter(teacher => {
        const matchesSearch =
            teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            teacher.classroom?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = !selectedGrade || teacher.grade === selectedGrade;
        const matchesClass = !selectedClassroom || teacher.classroom === selectedClassroom;
        return matchesSearch && matchesGrade && matchesClass;
    });

    const gradeOrder = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
    const gradeOptions = Array.from(
        new Set(teachers.map((t) => t.grade).filter(Boolean))
    ).sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b));
    const classroomOptions = Array.from(
        new Set(teachers.map((t) => t.classroom).filter(Boolean))
    ).sort();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Teachers</h1>
                {canCreate('teachers') && (
                    <button className="btn btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} />
                        Add Teacher
                    </button>
                )}
            </div>

            <div className="search-card">
                <Search size={18} color="var(--text-light)" />
                <input
                    type="text"
                    placeholder="Search teachers by name or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {userRole === 'admin' && (
                    <>
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            style={{ maxWidth: 160 }}
                        >
                            <option value="">All grades</option>
                            {gradeOptions.map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        <select
                            value={selectedClassroom}
                            onChange={(e) => setSelectedClassroom(e.target.value)}
                            style={{ maxWidth: 140 }}
                        >
                            <option value="">All rooms</option>
                            {classroomOptions.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column', gap: '1rem', color: 'var(--text-light)' }}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading teachers...</p>
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={filteredTeachers}
                    resource="teachers"
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    onRowClick={(row) => navigate(`/teachers/${row._id}`)}
                />
            )}

            {/* Modern Side Drawer for Add/Edit Teacher */}
            {isModalOpen && (
                <div className="side-drawer-overlay" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="side-drawer-header">
                            <h2>{editMode ? 'Edit Teacher' : 'Add New Teacher'}</h2>
                            <button className="icon-btn" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTeacher} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="side-drawer-body">
                                <div className="form-group">
                                    <label>Full Name <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mr. Anderson"
                                        value={newTeacher.name}
                                        onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                        style={{ borderColor: formErrors.name ? 'var(--danger-color)' : '' }}
                                    />
                                    {formErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="email"
                                            placeholder="anderson@school.com"
                                            value={newTeacher.email}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                            style={{ borderColor: formErrors.email ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.email && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Password {!editMode && <span style={{ color: 'var(--danger-color)' }}>*</span>}</label>
                                        <input
                                            type="password"
                                            placeholder={editMode ? "Encrypted" : "••••••••"}
                                            value={newTeacher.password}
                                            disabled={editMode}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                        />
                                        {editMode && <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Read-only</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Subject <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Mathematics"
                                            value={newTeacher.subject}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                                            style={{ borderColor: formErrors.subject ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.subject && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.subject}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Grade <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <select
                                            value={newTeacher.grade}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, grade: e.target.value })}
                                            style={{ borderColor: formErrors.grade ? 'var(--danger-color)' : '' }}
                                        >
                                            <option value="">Select grade</option>
                                            <option value="KG">KG</option>
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={`Grade ${i + 1}`}>{`Grade ${i + 1}`}</option>
                                            ))}
                                        </select>
                                        {formErrors.grade && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.grade}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Classroom</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. A"
                                            value={newTeacher.classroom}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, classroom: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Experience</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 10 Years"
                                            value={newTeacher.experience}
                                            onChange={(e) => setNewTeacher({ ...newTeacher, experience: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Contact Number <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                    <input
                                        type="tel"
                                        placeholder="+1 234-567-8901"
                                        value={newTeacher.contact}
                                        onChange={(e) => setNewTeacher({ ...newTeacher, contact: e.target.value })}
                                        style={{ borderColor: formErrors.contact ? 'var(--danger-color)' : '' }}
                                    />
                                    {formErrors.contact && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.contact}</span>}
                                </div>

                                <div className="form-group">
                                    <label>Birthday <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={newTeacher.birthday}
                                        onChange={(e) => setNewTeacher({ ...newTeacher, birthday: e.target.value })}
                                        style={{ borderColor: formErrors.birthday ? 'var(--danger-color)' : '' }}
                                    />
                                    {formErrors.birthday && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.birthday}</span>}
                                </div>
                            </div>

                            <div className="side-drawer-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editMode ? 'Update Teacher' : 'Add Teacher')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Teacher"
                message={`Are you sure you want to delete ${confirmDialog.teacher?.name}? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, teacher: null })}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};
export default Teachers;
