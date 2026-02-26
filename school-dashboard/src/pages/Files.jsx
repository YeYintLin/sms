import { useEffect, useState } from 'react';
import { Upload, Folder, FileText, Search, X, Eye, Download, Trash2 } from 'lucide-react';
import Table from '../components/Table';
import { usePermissions } from '../hooks/usePermissions';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../utils/api';
import { useToast } from '../hooks/useToast';

const initialFiles = [];

const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return '-';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, unitIndex);
    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toISOString().slice(0, 10);
};

const Files = () => {
    const { canCreate, canDelete } = usePermissions();
    const { showToast } = useToast();
    const [files, setFiles] = useState(initialFiles);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newFile, setNewFile] = useState({ name: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    useEffect(() => {
        const loadFiles = async () => {
            try {
                const response = await api.get('/files');
                setFiles(response.data || []);
            } catch (error) {
                console.error('Error loading files:', error);
                showToast('Failed to load files', 'error');
            }
        };

        loadFiles();
    }, [showToast]);

    const filteredFiles = files.filter((file) =>
        (file.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (file.owner || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddFile = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            showToast('Please choose a file to upload', 'error');
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (newFile.name.trim().length > 0) {
                formData.append('name', newFile.name.trim());
            }

            const response = await api.post('/files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFiles((prev) => [response.data, ...prev]);
            showToast('File uploaded', 'success');
            closeModal();
        } catch (error) {
            console.error('Error uploading file:', error);
            showToast('Failed to upload file', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const openConfirm = ({ title, message, onConfirm }) => {
        setConfirm({ isOpen: true, title, message, onConfirm });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewFile({ name: '' });
        setSelectedFile(null);
    };

    const handleDelete = (row) => {
        openConfirm({
            title: 'Delete File',
            message: `Delete "${row.name}"? This cannot be undone.`,
            onConfirm: async () => {
                try {
                    await api.delete(`/files/${row._id}`);
                    setFiles(files.filter((file) => file._id !== row._id));
                    showToast('File deleted', 'success');
                } catch (error) {
                    console.error('Error deleting file:', error);
                    showToast('Failed to delete file', 'error');
                }
            }
        });
    };

    const openFile = async (file, mode) => {
        try {
            const path = mode === 'view' ? 'view' : 'download';
            const response = await api.get(`/files/${file._id}/${path}`, {
                responseType: 'blob'
            });
            const blobUrl = URL.createObjectURL(response.data);
            if (mode === 'view') {
                window.open(blobUrl, '_blank');
            } else {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = file.originalName || file.name || 'download';
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        } catch (error) {
            console.error('Error opening file:', error);
            showToast('Failed to open file', 'error');
        }
    };

    const columns = [
        {
            header: 'File',
            accessor: (file) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: '0.5rem',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(79,70,229,0.12)',
                        color: '#4f46e5'
                    }}>
                        {file.type === 'IMG' ? <Folder size={15} /> : <FileText size={15} />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.2 }}>{file.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{file.type || 'FILE'}</div>
                    </div>
                </div>
            )
        },
        { header: 'Owner', accessor: 'owner' },
        { header: 'Size', accessor: (file) => formatBytes(file.size) },
        { header: 'Updated', accessor: (file) => formatDate(file.updatedAt || file.createdAt) },
        {
            header: 'Actions',
            accessor: (file) => (
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button
                        type="button"
                        className="icon-btn files-action-btn files-action-view"
                        onClick={() => openFile(file, 'view')}
                        title="View"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        type="button"
                        className="icon-btn files-action-btn files-action-download"
                        onClick={() => openFile(file, 'download')}
                        title="Download"
                    >
                        <Download size={16} />
                    </button>
                    {canDelete('files') && (
                        <button
                            type="button"
                            className="icon-btn files-action-btn files-action-delete"
                            onClick={() => handleDelete(file)}
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Files</h1>
                {canCreate('files') && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Upload size={18} />
                        Upload File
                    </button>
                )}
            </div>

            <div className="search-card">
                <Search size={18} color="var(--text-light)" />
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="files-compact-table">
                <Table
                    columns={columns}
                    data={filteredFiles}
                    resource="files"
                />
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content file-upload-card">
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Upload File</h2>
                            <button onClick={closeModal} style={{ fontSize: '1.5rem', color: '#6b7280' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFile} className="file-upload-form">
                            <div className="file-upload-body">
                                <div className="form-group">
                                    <label>File Title (optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Grade 7 Handbook"
                                        value={newFile.name}
                                        onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Choose File</label>
                                    <input
                                        type="file"
                                        required
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn" style={{ border: '1px solid #d1d5db' }} onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirm.isOpen}
                title={confirm.title}
                message={confirm.message}
                onConfirm={() => {
                    if (confirm.onConfirm) confirm.onConfirm();
                    setConfirm({ isOpen: false, title: '', message: '', onConfirm: null });
                }}
                onCancel={() => setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default Files;

