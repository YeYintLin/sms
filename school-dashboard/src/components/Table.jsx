import { Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const Table = ({ columns, data, onEdit, onDelete, resource, onRowClick }) => {
    const { canDelete: checkCanDelete } = usePermissions();
    const showDeleteButton = resource ? checkCanDelete(resource) : true;
    return (
        <div className="table-container card">
            <table>
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className={['Grade', 'Email', 'Actions', 'Classroom'].includes(col.header) ? 'align-center' : undefined}>
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete) && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick && onRowClick(row)}
                                style={onRowClick ? { cursor: 'pointer' } : undefined}
                            >
                                {columns.map((col, colIndex) => (
                                    <td
                                        key={colIndex}
                                        data-label={col.header}
                                        className={['Grade', 'Email', 'Actions', 'Classroom'].includes(col.header) ? 'align-center' : undefined}
                                    >
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : row[col.accessor]}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="action-buttons align-center" data-label="Actions">
                                        {onEdit && (
                                            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onEdit(row); }}>
                                                <Edit size={16} />
                                            </button>
                                        )}
                                        {onDelete && showDeleteButton && (
                                            <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onDelete(row); }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} style={{ textAlign: "center", padding: "3rem" }}>
                                No data available
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
