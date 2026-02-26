import { useState } from 'react';
import { Book, Plus, Trash2, Search, X } from 'lucide-react';
import Table from '../components/Table';
import { usePermissions } from '../hooks/usePermissions';

const initialBooks = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Literature', status: 'Available' },
    { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Literature', status: 'Borrowed' },
    { id: 3, title: 'Introduction to Algorithms', author: 'Cormen et al.', category: 'Computer Science', status: 'Available' },
    { id: 4, title: 'Clean Code', author: 'Robert C. Martin', category: 'Computer Science', status: 'Available' },
    { id: 5, title: 'Physics for Scientists', author: 'Serway', category: 'Science', status: 'Borrowed' },
];

const Books = () => {
    const [books, setBooks] = useState(initialBooks);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBook, setNewBook] = useState({ title: '', author: '', category: '', status: 'Available' });
    const { canCreate, canDelete, canUpdate } = usePermissions();
    const [isEditing, setIsEditing] = useState(false);

    const handleAddBook = (e) => {
        e.preventDefault();
        setBooks([...books, { id: books.length + 1, ...newBook }]);
        setIsModalOpen(false);
        setNewBook({ title: '', author: '', category: '', status: 'Available' });
    };

    const handleDelete = (id) => {
        setBooks(books.filter(book => book.id !== id));
    };

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { header: "Title", accessor: "title" },
        { header: "Author", accessor: "author" },
        { header: "Category", accessor: "category" },
        {
            header: "Status",
            accessor: (book) => (
                <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: book.status === 'Available' ? '#d1fae5' : '#fee2e2',
                    color: book.status === 'Available' ? '#065f46' : '#991b1b',
                }}>
                    {book.status}
                </span>
            )
        },
        
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Library Books</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {canUpdate('books') && (
                        <button
                            className="btn"
                            style={{ border: '1px solid var(--border-color)' }}
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            {isEditing ? 'Done Editing' : 'Edit Library'}
                        </button>
                    )}
                    {canCreate('books') && isEditing && (
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} />
                            Add Book
                        </button>
                    )}
                </div>
            </div>

            <div className="search-card">
                <Search size={18} color="var(--text-light)" />
                <input
                    type="text"
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Table
                columns={columns}
                data={filteredBooks}
                onDelete={canDelete('books') && isEditing ? handleDelete : undefined}
                resource="books"
            />

            {/* Modern Side Drawer for Add Book */}
            {isModalOpen && (
                <div className="side-drawer-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
                        <div className="side-drawer-header">
                            <h2>Add New Book</h2>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="side-drawer-body">
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. The Great Gatsby"
                                        value={newBook.title}
                                        onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Author</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. F. Scott Fitzgerald"
                                        value={newBook.author}
                                        onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Literature"
                                        value={newBook.category}
                                        onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={newBook.status}
                                        onChange={(e) => setNewBook({ ...newBook, status: e.target.value })}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Borrowed">Borrowed</option>
                                        <option value="Lost">Lost</option>
                                    </select>
                                </div>
                            </div>

                            <div className="side-drawer-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Book</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Books;
