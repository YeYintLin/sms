import { X } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger' // 'danger' or 'warning'
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="confirm-dialog">
                <div className="confirm-dialog-header">
                    <h2>{title}</h2>
                    <button onClick={onCancel} className="close-btn">
                        <X size={20} />
                    </button>
                </div>
                <div className="confirm-dialog-body">
                    <p>{message}</p>
                </div>
                <div className="confirm-dialog-actions">
                    <button
                        onClick={onCancel}
                        className="btn btn-secondary"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-warning'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
