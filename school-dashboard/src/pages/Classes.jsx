import { useState, useEffect } from 'react';
import Table from '../components/Table';
import { Plus, Search, Loader2, X } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast.jsx';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';

const Classes = () => {
    const [classes, setClasses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, classItem: null });
    const [editMode, setEditMode] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [newClass, setNewClass] = useState({ name: '', teacher: '', schedule: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { canCreate } = usePermissions();
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [classesRes, teachersRes] = await Promise.all([
                api.get('/classes'),
                api.get('/teachers')
            ]);

            // Flatten the classes data
            const flattenedClasses = classesRes.data.map(item => ({
                ...item,
                teacherName: item.teacher?.userId?.name || 'Unassigned',
                studentsCount: item.students?.length || 0
            }));

            setClasses(flattenedClasses);
            setTeachers(teachersRes.data.map(t => ({
                id: t._id,
                dbId: t._id, // Keep the DB ID
                name: t.userId?.name || 'Unknown Teacher'
            })));
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveClass = async (e) => {
        e.preventDefault();

        if (!newClass.teacher) {
            showToast('Please select a teacher', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editMode) {
                const response = await api.put(`/classes/${selectedClassId}`, {
                    ...newClass
                });

                const selectedTeacher = teachers.find(t => t.id === newClass.teacher);
                const updatedClassData = {
                    ...response.data,
                    teacherName: selectedTeacher ? selectedTeacher.name : 'Unassigned',
                    studentsCount: response.data.students?.length || 0
                };

                setClasses(classes.map(c => c._id === selectedClassId ? updatedClassData : c));
                showToast(`Class ${response.data.name} updated successfully!`, 'success');
            } else {
                const response = await api.post('/classes', {
                    ...newClass,
                    students: [] // Explicitly send empty array for now
                });

                // Get teacher name for immediate update
                const selectedTeacher = teachers.find(t => t.id === newClass.teacher);

                const newClassData = {
                    ...response.data,
                    teacherName: selectedTeacher ? selectedTeacher.name : 'Unassigned',
                    studentsCount: 0
                };

                setClasses([...classes, newClassData]);
                showToast(`Class ${response.data.name} added successfully!`, 'success');
            }

            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Error saving class:', error);
            const message = error.response?.data?.msg || 'Failed to save class';
            showToast(message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setNewClass({ name: '', teacher: '', schedule: '' });
        setEditMode(false);
        setSelectedClassId(null);
    };

    const handleEditClick = (row) => {
        setEditMode(true);
        setSelectedClassId(row._id);
        setNewClass({
            name: row.name || '',
            teacher: row.teacher?._id || row.teacher || '',
            schedule: row.schedule || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (row) => {
        setConfirmDialog({ isOpen: true, classItem: row });
    };

    const handleConfirmDelete = async () => {
        if (!confirmDialog.classItem) return;
        try {
            await api.delete(`/classes/${confirmDialog.classItem._id}`);
            setClasses(classes.filter(c => c._id !== confirmDialog.classItem._id));
            showToast(`${confirmDialog.classItem.name} has been deleted`, 'success');
        } catch (error) {
            console.error('Error deleting class:', error);
            showToast('Failed to delete class', 'error');
        } finally {
            setConfirmDialog({ isOpen: false, classItem: null });
        }
    };

    const columns = [
        { header: "Class Name", accessor: "name" },
        { header: "Teacher", accessor: "teacherName" },
        { header: "No. of Students", accessor: "studentsCount" },
        { header: "Schedule", accessor: "schedule" }
    ];

    const filteredClasses = classes.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Classes</h1>
                {canCreate('classes') && (
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} />
                        Add Class
                    </button>
                )}
            </div>

            <div className="search-card">
                <Search size={18} color="var(--text-light)" />
                <input
                    type="text"
                    placeholder="Search classes by name or teacher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', flexDirection: 'column', gap: '1rem', color: 'var(--text-light)' }}>
                    <Loader2 className="animate-spin" size={32} />
                    <p>Loading classes...</p>
                </div>
            ) : (
                <Table
                    columns={columns}
                    data={filteredClasses}
                    resource="classes"
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                />
            )}

            {/* Modern Side Drawer for Add/Edit Class */}
            {isModalOpen && (
                <div className="side-drawer-overlay" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="side-drawer-header">
                            <h2>{editMode ? 'Edit Class' : 'Add New Class'}</h2>
                            <button className="icon-btn" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="side-drawer-body">
                                <div className="form-group">
                                    <label>Class Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 10th Grade"
                                        value={newClass.name}
                                        onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Assign Teacher</label>
                                    <select
                                        required
                                        value={newClass.teacher}
                                        onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                                    >
                                        <option value="">Select Teacher</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Schedule</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mon-Fri, 9:00 AM"
                                        value={newClass.schedule}
                                        onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="side-drawer-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => { setIsModalOpen(false); resetForm(); }} disabled={isSubmitting}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : (editMode ? 'Update Class' : 'Add Class')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Class"
                message={`Are you sure you want to delete ${confirmDialog.classItem?.name}? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, classItem: null })}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};
export default Classes;
