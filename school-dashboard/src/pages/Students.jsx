import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, X, Search } from 'lucide-react';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast.jsx';
import api from '../utils/api';

const PAGE_SIZE = 20;

const Students = () => {
    const [students, setStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [studentMeta, setStudentMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 });
    const [refreshKey, setRefreshKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, student: null });
    const { canCreate, canDelete, userRole } = usePermissions();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // State for both Add and Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [newStudent, setNewStudent] = useState({ name: '', age: '', grade: '', classroom: '', email: '', password: '', studentId: '', contact: '', address: '', birthday: '' });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page: currentPage,
                limit: PAGE_SIZE
            };
            if (userRole === 'admin') {
                if (selectedGrade) params.gradeFilter = selectedGrade;
                if (selectedClassroom) params.classroomFilter = selectedClassroom;
            }

            const response = await api.get('/students', { params });
            const rows = response.data?.data || [];
            const flattenedData = rows.map((item) => ({
                ...item,
                name: item.userId?.name,
                email: item.userId?.email
            }));
            setStudents(flattenedData);
            const meta = response.data?.meta || { total: 0, page: currentPage, limit: PAGE_SIZE, totalPages: 0 };
            setStudentMeta(meta);
        } catch (error) {
            console.error('Error fetching students:', error);
            showToast('Failed to load students data', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, selectedGrade, selectedClassroom, userRole, showToast]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents, refreshKey]);

    const formatStudentId = (value) => {
        if (!value) return value;
        const v = String(value);
        return v.replace(/grade-(\d+)/i, 'g$1').replace(/^kg-/i, 'kg-');
    };

    const columns = [
        { header: "ID", accessor: (row) => formatStudentId(row.studentId) },
        { header: "Name", accessor: "name" },
        { header: "Grade", accessor: "grade" },
        { header: "Classroom", accessor: "classroom" },
        { header: "Email", accessor: "email" },
        { header: "Address", accessor: "address" },
    ];

    const handleGradeFilterChange = (value) => {
        setSelectedGrade(value);
        setCurrentPage(1);
    };
    const handleClassroomFilterChange = (value) => {
        setSelectedClassroom(value);
        setCurrentPage(1);
    };

    const goToPreviousPage = () => {
        if (currentPage <= 1) return;
        setCurrentPage((prev) => prev - 1);
    };

    const goToNextPage = () => {
        if (studentMeta.totalPages && currentPage >= studentMeta.totalPages) return;
        setCurrentPage((prev) => prev + 1);
    };

    const validateForm = () => {
        const errors = {};

        if (!newStudent.name.trim()) errors.name = 'Name is required';
        if (!newStudent.age || newStudent.age < 5 || newStudent.age > 100) errors.age = 'Age must be between 5 and 100';
        if (!newStudent.grade.trim()) errors.grade = 'Grade is required';
        if (!newStudent.studentId.trim()) errors.studentId = 'Student ID is required';
        if (!newStudent.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudent.email)) {
            errors.email = 'Invalid email format';
        }
        if (!newStudent.birthday) errors.birthday = 'Birthday is required';

        // Password only required in Add mode
        if (!editMode && (!newStudent.password || newStudent.password.length < 6)) {
            errors.password = 'Password must be at least 6 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('Please fix the form errors', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editMode) {
                await api.put(`/students/${selectedStudentId}`, {
                    ...newStudent,
                    age: parseInt(newStudent.age)
                });
                showToast(`Student ${newStudent.name} updated successfully!`, 'success');
            } else {
                await api.post('/students', {
                    ...newStudent,
                    age: parseInt(newStudent.age)
                });
                showToast(`Student ${newStudent.name} added successfully!`, 'success');
            }

            setIsModalOpen(false);
            resetForm();
            setCurrentPage(1);
            setRefreshKey((prev) => prev + 1);
        } catch (error) {
            console.error('Error saving student:', error);
            const message = error.response?.data?.msg || 'Failed to save student';
            showToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewStudent({ name: '', age: '', grade: '', classroom: '', email: '', password: '', studentId: '', contact: '', address: '', birthday: '' });
        setFormErrors({});
        setEditMode(false);
        setSelectedStudentId(null);
    };

    const handleEditClick = (row) => {
        setEditMode(true);
        setSelectedStudentId(row.studentId);
        setNewStudent({
            name: row.name || '',
            age: row.age || '',
            grade: row.grade || '',
            classroom: row.classroom || '',
            address: row.address || '',
            birthday: row.birthday ? row.birthday.substring(0, 10) : '',
            email: row.email || '',
            studentId: row.studentId || '',
            contact: row.contact || '',
            password: '' // Don't show password
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (row) => {
        setConfirmDialog({ isOpen: true, student: row });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.student) return;

        try {
            await api.delete(`/students/${confirmDialog.student.studentId}`);
            showToast(`${confirmDialog.student.name} has been deleted`, 'success');
            setRefreshKey((prev) => prev + 1);
        } catch (error) {
            console.error('Error deleting student:', error);
            showToast('Failed to delete student', 'error');
        } finally {
            setConfirmDialog({ isOpen: false, student: null });
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, student: null });
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = !selectedGrade || student.grade === selectedGrade;
        const matchesClass = !selectedClassroom || student.classroom === selectedClassroom;
        return matchesSearch && matchesGrade && matchesClass;
    });

    const displayPage = studentMeta.page || currentPage;
    const totalPagesDisplay = studentMeta.totalPages || 1;
    const hasPrevPage = displayPage > 1;
    const hasNextPage = studentMeta.totalPages > 0 && displayPage < studentMeta.totalPages;

    const gradeOrder = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
    const gradeOptions = Array.from(
        new Set(students.map((s) => s.grade).filter(Boolean))
    ).sort((a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b));
    const classroomOptions = Array.from(
        new Set(students.map((s) => s.classroom).filter(Boolean))
    ).sort();

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Students</h1>
                {canCreate('students') && (
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={18} />
                        Add Student
                    </button>
                )}
            </div>

            <div className="search-card">
                <Search size={18} color="var(--text-light)" />
                <input
                    type="text"
                    placeholder="Search students (Name, ID, Email)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {userRole === 'admin' && (
                    <>
                        <select
                            value={selectedGrade}
                            onChange={(e) => handleGradeFilterChange(e.target.value)}
                            style={{ maxWidth: 160 }}
                        >
                            <option value="">All grades</option>
                            {gradeOptions.map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                        <select
                            value={selectedClassroom}
                            onChange={(e) => handleClassroomFilterChange(e.target.value)}
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

            <div
                className="pagination-summary"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '0.75rem 0 1.25rem',
                    gap: '1rem'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontWeight: 600 }}>Total students: {studentMeta.total}</span>
                    <small style={{ color: 'var(--text-light)' }}>
                        Page {displayPage} of {totalPagesDisplay}
                    </small>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={goToPreviousPage}
                        disabled={!hasPrevPage || isLoading}
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={goToNextPage}
                        disabled={!hasNextPage || isLoading}
                    >
                        Next
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column', gap: '1rem', color: 'var(--text-light)' }}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading students...</p>
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={filteredStudents}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    resource="students"
                    onRowClick={(row) => navigate(`/students/${row.studentId}`)}
                />
            )}

            {/* Modern Side Drawer for Add/Edit Student */}
            {isModalOpen && (
                <div className="side-drawer-overlay" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="side-drawer-header">
                            <h2>{editMode ? 'Edit Student' : 'Add New Student'}</h2>
                            <button className="icon-btn" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="side-drawer-body">
                                <div className="form-group">
                                    <label>Full Name <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                        style={{ borderColor: formErrors.name ? 'var(--danger-color)' : '' }}
                                    />
                                    {formErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Student ID <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="text"
                                            placeholder="ST-001"
                                            value={newStudent.studentId}
                                            disabled={editMode}
                                            onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                                            style={{ borderColor: formErrors.studentId ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.studentId && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.studentId}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Grade <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="text"
                                            placeholder="10th"
                                            value={newStudent.grade}
                                            onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                                            style={{ borderColor: formErrors.grade ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.grade && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.grade}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Classroom</label>
                                        <input
                                            type="text"
                                            placeholder="Class A"
                                            value={newStudent.classroom}
                                            onChange={(e) => setNewStudent({ ...newStudent, classroom: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={newStudent.email}
                                            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                            style={{ borderColor: formErrors.email ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.email && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Password {!editMode && <span style={{ color: 'var(--danger-color)' }}>*</span>}</label>
                                        <input
                                            type="password"
                                            placeholder={editMode ? "Encrypted" : "••••••••"}
                                            value={newStudent.password}
                                            disabled={editMode}
                                            onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                                        />
                                        {editMode && <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Read-only</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Age <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="number"
                                            placeholder="16"
                                            value={newStudent.age}
                                            onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                                            style={{ borderColor: formErrors.age ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.age && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.age}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="text"
                                            placeholder="+1 (555) 000-0000"
                                            value={newStudent.contact}
                                            onChange={(e) => setNewStudent({ ...newStudent, contact: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        placeholder="Enter address"
                                        value={newStudent.address}
                                        onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Birthday <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={newStudent.birthday}
                                        onChange={(e) => setNewStudent({ ...newStudent, birthday: e.target.value })}
                                        style={{ borderColor: formErrors.birthday ? 'var(--danger-color)' : '' }}
                                    />
                                    {formErrors.birthday && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.birthday}</span>}
                                </div>
                            </div>

                            <div className="side-drawer-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editMode ? 'Update Student' : 'Add Student')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Student"
                message={`Are you sure you want to delete ${confirmDialog.student?.name}? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default Students;
