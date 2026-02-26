import { useState, useEffect } from 'react';
import { Plus, Loader2, X, Search } from 'lucide-react';
import Table from '../components/Table';
import ConfirmDialog from '../components/ConfirmDialog';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast.jsx';
import api from '../utils/api';

const Parents = () => {
    const [parents, setParents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, parent: null });
    const { canCreate, canDelete } = usePermissions();
    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [newParent, setNewParent] = useState({ name: '', parentId: '', studentId: '', grade: '', email: '', password: '', contact: '', birthday: '' });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const columns = [
        { header: "ID", accessor: "parentId" },
        { header: "Name", accessor: "name" },
        { header: "Student ID", accessor: "studentId" },
        { header: "Grade", accessor: "grade" },
        { header: "Email", accessor: "email" },
    ];

    useEffect(() => {
        fetchParents();
    }, []);

    const fetchParents = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/parents');
            const flattenedData = response.data.map(item => ({
                ...item,
                name: item.userId?.name,
                email: item.userId?.email
            }));
            setParents(flattenedData);
        } catch (error) {
            console.error('Error fetching parents:', error);
            showToast('Failed to load parents data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!newParent.name.trim()) errors.name = 'Name is required';
        if (!newParent.parentId.trim()) errors.parentId = 'Parent ID is required';
        if (!newParent.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParent.email)) {
            errors.email = 'Invalid email format';
        }
        if (!newParent.birthday) errors.birthday = 'Birthday is required';
        if (!editMode && (!newParent.password || newParent.password.length < 6)) {
            errors.password = 'Password must be at least 6 characters';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveParent = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast('Please fix the form errors', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editMode) {
                const response = await api.put(`/parents/${selectedParentId}`, newParent);
                const updatedData = {
                    ...response.data,
                    name: newParent.name,
                    email: newParent.email
                };
                setParents(parents.map(p => p.parentId === selectedParentId ? updatedData : p));
                showToast(`Parent ${newParent.name} updated successfully!`, 'success');
            } else {
                const response = await api.post('/parents', newParent);
                const newParentData = {
                    ...response.data,
                    name: newParent.name,
                    email: newParent.email
                };
                setParents([...parents, newParentData]);
                showToast(`Parent ${newParent.name} added successfully!`, 'success');
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving parent:', error);
            const message = error.response?.data?.msg || 'Failed to save parent';
            showToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewParent({ name: '', parentId: '', studentId: '', grade: '', email: '', password: '', contact: '', birthday: '' });
        setFormErrors({});
        setEditMode(false);
        setSelectedParentId(null);
    };

    const handleEditClick = (row) => {
        setEditMode(true);
        setSelectedParentId(row.parentId);
        setNewParent({
            name: row.name || '',
            parentId: row.parentId || '',
            studentId: row.studentId || '',
            grade: row.grade || '',
            birthday: row.birthday ? row.birthday.substring(0, 10) : '',
            email: row.email || '',
            contact: row.contact || '',
            password: ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (row) => {
        setConfirmDialog({ isOpen: true, parent: row });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.parent) return;
        try {
            await api.delete(`/parents/${confirmDialog.parent.parentId}`);
            setParents(parents.filter(p => p.parentId !== confirmDialog.parent.parentId));
            showToast(`${confirmDialog.parent.name} has been deleted`, 'success');
        } catch (error) {
            console.error('Error deleting parent:', error);
            showToast('Failed to delete parent', 'error');
        } finally {
            setConfirmDialog({ isOpen: false, parent: null });
        }
    };

    const filteredParents = parents.filter(parent =>
        parent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.parentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Parents</h1>
                {canCreate('parents') && (
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={18} />
                        Add Parent
                    </button>
                )}
            </div>

            <div className="search-card">
                <Search size={18} color="var(--text-light)" />
                <input
                    type="text"
                    placeholder="Search parents (Name, ID, Email)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column', gap: '1rem', color: 'var(--text-light)' }}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading parents...</p>
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={filteredParents}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    resource="parents"
                />
            )}

            {isModalOpen && (
                <div className="side-drawer-overlay" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="side-drawer-header">
                            <h2>{editMode ? 'Edit Parent' : 'Add New Parent'}</h2>
                            <button className="icon-btn" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveParent} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="side-drawer-body">
                                <div className="form-group">
                                    <label>Full Name <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Jane Doe"
                                        value={newParent.name}
                                        onChange={(e) => setNewParent({ ...newParent, name: e.target.value })}
                                        style={{ borderColor: formErrors.name ? 'var(--danger-color)' : '' }}
                                    />
                                    {formErrors.name && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Parent ID <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="text"
                                            placeholder="PR-001"
                                            value={newParent.parentId}
                                            disabled={editMode}
                                            onChange={(e) => setNewParent({ ...newParent, parentId: e.target.value })}
                                            style={{ borderColor: formErrors.parentId ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.parentId && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.parentId}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Student ID</label>
                                        <input
                                            type="text"
                                            placeholder="ST-001"
                                            value={newParent.studentId}
                                            onChange={(e) => setNewParent({ ...newParent, studentId: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                        <input
                                            type="email"
                                            placeholder="jane@example.com"
                                            value={newParent.email}
                                            onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
                                            style={{ borderColor: formErrors.email ? 'var(--danger-color)' : '' }}
                                        />
                                        {formErrors.email && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.email}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Password {!editMode && <span style={{ color: 'var(--danger-color)' }}>*</span>}</label>
                                        <input
                                            type="password"
                                            placeholder={editMode ? "Encrypted" : "••••••••"}
                                            value={newParent.password}
                                            disabled={editMode}
                                            onChange={(e) => setNewParent({ ...newParent, password: e.target.value })}
                                        />
                                        {editMode && <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Read-only</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Grade</label>
                                        <input
                                            type="text"
                                            placeholder="Grade 5"
                                            value={newParent.grade}
                                            onChange={(e) => setNewParent({ ...newParent, grade: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Contact Number</label>
                                        <input
                                            type="text"
                                            placeholder="+1 (555) 000-0000"
                                            value={newParent.contact}
                                            onChange={(e) => setNewParent({ ...newParent, contact: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Birthday <span style={{ color: 'var(--danger-color)' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={newParent.birthday}
                                        onChange={(e) => setNewParent({ ...newParent, birthday: e.target.value })}
                                        style={{ borderColor: formErrors.birthday ? 'var(--danger-color)' : '' }}
                                    />
                                    {formErrors.birthday && <span style={{ color: 'var(--danger-color)', fontSize: '0.75rem' }}>{formErrors.birthday}</span>}
                                </div>
                            </div>

                            <div className="side-drawer-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editMode ? 'Update Parent' : 'Add Parent')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Parent"
                message={`Are you sure you want to delete ${confirmDialog.parent?.name}? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, parent: null })}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default Parents;
