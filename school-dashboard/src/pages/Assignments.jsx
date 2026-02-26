import { FileText, Calendar, Plus } from 'lucide-react';

const assignments = [
    { id: 1, title: "Math Worksheet: Algebra", class: "10th Grade", dueDate: "2023-11-15", status: "Active" },
    { id: 2, title: "English Essay: Shakespeare", class: "11th Grade", dueDate: "2023-11-20", status: "Active" },
    { id: 3, title: "Physics Lab Report", class: "12th Grade", dueDate: "2023-11-18", status: "Pending" },
    { id: 4, title: "History Presentation", class: "9th Grade", dueDate: "2023-11-25", status: "Active" },
];

const Assignments = () => {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Assignments</h1>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} />
                    Create Assignment
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {assignments.map((assignment) => (
                    <div key={assignment.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                backgroundColor: '#e0e7ff',
                                color: '#4f46e5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FileText size={20} />
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: assignment.status === 'Active' ? '#d1fae5' : '#fef3c7',
                                color: assignment.status === 'Active' ? '#065f46' : '#92400e',
                                fontWeight: '500'
                            }}>
                                {assignment.status}
                            </span>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>{assignment.title}</h3>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{assignment.class}</p>
                        </div>

                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                            <Calendar size={16} />
                            <span>Due: {assignment.dueDate}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Assignments;
