import { useState } from 'react';
import { Filter, Plus, Trash2, Edit3 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../utils/api';
import { useResultsData } from '../hooks/useResultsData';

const Results = () => {
    const { canView, canDelete, canUpdate, userRole } = usePermissions();
    const isAdmin = userRole === 'admin';
    const isTeacher = userRole === 'teacher';
    const userGrade = localStorage.getItem('grade') || '';
    const [filterName, setFilterName] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [newTerm, setNewTerm] = useState('');
    const [termEdits, setTermEdits] = useState({});
    const [newGrade, setNewGrade] = useState('');
    const [newSubject, setNewSubject] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [confirm, setConfirm] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [dragIndex, setDragIndex] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const {
        grades,
        setGrades,
        subjectsByGrade,
        setSubjectsByGrade,
        termsByGrade,
        setTermsByGrade,
        gradeRows,
        setGradeRows,
        activeGrade,
        setActiveGrade,
        activeTerm,
        setActiveTerm,
        activeSubjects,
        isLoading,
        refreshResults,
        persistActiveRows,
        isPersistedResultId
    } = useResultsData({ userGrade, isAdmin, filterYear });
    const visibleGrades = isAdmin ? grades : (userGrade ? [userGrade] : []);

    const openConfirm = ({ title, message, onConfirm }) => {
        setConfirm({ isOpen: true, title, message, onConfirm });
    };
    const formatStudentId = (value) => {
        if (!value) return value;
        const v = String(value);
        return v
            .replace(/grade-(\d+)/i, 'g$1')
            .replace(/^kg-/i, 'kg-');
    };

    const getTotal = (scores) =>
        activeSubjects.reduce((sum, subj) => {
            const val = Number(scores?.[subj]);
            return sum + (Number.isFinite(val) ? val : 0);
        }, 0);

    if (!canView('results')) {
        return (
            <div className="page-container">
                <div className="card">
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Access restricted</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        You do not have permission to view exam results.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Exam Results</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {canUpdate('results') && (
                        <button
                            className="btn"
                            style={{ border: '1px solid var(--border-color)' }}
                            disabled={isSaving}
                            onClick={async () => {
                                if (!isEditing) {
                                    setIsEditing(true);
                                    return;
                                }

                                setIsSaving(true);
                                try {
                                    await persistActiveRows();
                                    await refreshResults();
                                    setIsEditing(false);
                                } catch (err) {
                                    console.error('Failed to save results', err);
                                    alert(err.response?.data?.msg || err.message || 'Failed to save results');
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                        >
                            <Edit3 size={16} />
                            {isSaving ? 'Saving...' : isEditing ? 'Done Editing' : 'Edit Table'}
                        </button>
                    )}
                    {isEditing && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                const current = gradeRows[activeGrade]?.[activeTerm] || [];
                                const nextId = current.length ? Math.max(...current.map(r => r.id)) + 1 : Date.now();
                                const emptyScores = activeSubjects.reduce((acc, s) => ({ ...acc, [s]: '' }), {});
                                setGradeRows({
                                    ...gradeRows,
                                    [activeGrade]: {
                                        ...gradeRows[activeGrade],
                                        [activeTerm]: [...current, { id: nextId, studentId: '', name: '', scores: emptyScores }]
                                    }
                                });
                            }}
                        >
                            <Plus size={16} />
                            Add Row
                        </button>
                    )}
                </div>
            </div>

            <div className="card results-card">
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Filter by name"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        style={{
                            minWidth: '180px',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Filter by year (e.g. 2026)"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        style={{
                            minWidth: '160px',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-main)'
                        }}
                    />
                    {!isTeacher && (
                        <select
                            value={filterGrade || activeGrade}
                            onChange={(e) => {
                                const g = e.target.value;
                                setFilterGrade(g);
                                setActiveGrade(g);
                            }}
                            style={{
                                minWidth: '160px',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-input)',
                                color: 'var(--text-main)'
                            }}
                        >
                            {(visibleGrades.length ? visibleGrades : grades).map((g) => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    )}
                </div>
                {isLoading && (
                    <div style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>
                        Loading results...
                    </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {visibleGrades.map((g) => (
                        <div key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                                className="btn"
                                onClick={() => setActiveGrade(g)}
                                style={{
                                    border: '1px solid var(--border-color)',
                                    background: activeGrade === g ? 'var(--primary-color)' : 'var(--bg-card)',
                                    color: activeGrade === g ? 'white' : 'var(--text-main)',
                                    padding: '0.4rem 0.75rem',
                                }}
                            >
                                {g}
                            </button>
                            {canUpdate('results') && isEditing && isAdmin && (
                                <button
                                    onClick={() => {
                                        openConfirm({
                                            title: 'Remove Grade',
                                            message: `Remove ${g}? All rows in this grade will be deleted.`,
                                            onConfirm: () => {
                                                const nextGrades = grades.filter(x => x !== g);
                                                setGrades(nextGrades);
                                                const nextRows = { ...gradeRows };
                                                delete nextRows[g];
                                                setGradeRows(nextRows);
                                                const nextTerms = { ...termsByGrade };
                                                delete nextTerms[g];
                                                setTermsByGrade(nextTerms);
                                                if (activeGrade === g) {
                                                    setActiveGrade(nextGrades[0] || '');
                                                }
                                            }
                                        });
                                    }}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--danger-color)',
                                        cursor: 'pointer'
                                    }}
                                    title={`Remove ${g}`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {canUpdate('results') && isEditing && isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Add grade (e.g. Grade 13)"
                            value={newGrade}
                            onChange={(e) => setNewGrade(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: '160px',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-input)',
                                color: 'var(--text-main)'
                            }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                const g = newGrade.trim();
                                if (!g || grades.includes(g)) return;
                                setGrades([...grades, g]);
                                setGradeRows({ ...gradeRows, [g]: { '2026 January': [] } });
                                setSubjectsByGrade({ ...subjectsByGrade, [g]: ['Math', 'English', 'Science', 'History', 'Geography', 'ICT'] });
                                setTermsByGrade({ ...termsByGrade, [g]: ['2026 January'] });
                                setActiveGrade(g);
                                setActiveTerm('2026 January');
                                setNewGrade('');
                            }}
                        >
                            <Plus size={16} />
                            Add Grade
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                    {(filterYear
                        ? (termsByGrade[activeGrade] || []).filter((t) => t.toLowerCase().startsWith(filterYear.toLowerCase()))
                        : (termsByGrade[activeGrade] || [])
                    ).map((term) => (
                        <div key={term} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            {isEditing ? (
                                <input
                                    value={termEdits[term] ?? term}
                                    onChange={(e) => {
                                        setTermEdits((prev) => ({ ...prev, [term]: e.target.value }));
                                    }}
                                    onBlur={() => {
                                        const nextRaw = termEdits[term];
                                        const next = (nextRaw ?? term).trim();
                                        setTermEdits((prev) => {
                                            const copy = { ...prev };
                                            delete copy[term];
                                            return copy;
                                        });
                                        if (!next || next === term) return;
                                        if ((termsByGrade[activeGrade] || []).includes(next)) return;
                                        setTermsByGrade({
                                            ...termsByGrade,
                                            [activeGrade]: (termsByGrade[activeGrade] || []).map(t => (t === term ? next : t))
                                        });
                                        const currentGradeRows = gradeRows[activeGrade] || {};
                                        if (currentGradeRows[term]) {
                                            const nextGradeRows = { ...currentGradeRows };
                                            nextGradeRows[next] = nextGradeRows[term];
                                            delete nextGradeRows[term];
                                            setGradeRows({
                                                ...gradeRows,
                                                [activeGrade]: nextGradeRows
                                            });
                                        }
                                        if (activeTerm === term) {
                                            setActiveTerm(next);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    style={{
                                        minWidth: '160px',
                                        padding: '0.35rem 0.6rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-main)'
                                    }}
                                />
                            ) : (
                                <button
                                    className="btn"
                                    onClick={() => setActiveTerm(term)}
                                    style={{
                                        border: '1px solid var(--border-color)',
                                        background: activeTerm === term ? 'var(--primary-color)' : 'var(--bg-card)',
                                        color: activeTerm === term ? 'white' : 'var(--text-main)',
                                        padding: '0.4rem 0.75rem',
                                    }}
                                >
                                    {term}
                                </button>
                            )}
                        </div>
                    ))}
                    {isEditing && canUpdate('results') && (
                        <>
                            <input
                                type="text"
                                placeholder="Add month (e.g. 2026 January)"
                                value={newTerm}
                                onChange={(e) => setNewTerm(e.target.value)}
                                style={{
                                    minWidth: '200px',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-main)'
                                }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    const term = newTerm.trim();
                                    if (!term) return;
                                    const currentTerms = termsByGrade[activeGrade] || [];
                                    if (currentTerms.includes(term)) return;
                                    setTermsByGrade({
                                        ...termsByGrade,
                                        [activeGrade]: [...currentTerms, term]
                                    });
                                    setGradeRows({
                                        ...gradeRows,
                                        [activeGrade]: {
                                            ...gradeRows[activeGrade],
                                            [term]: []
                                        }
                                    });
                                    setActiveTerm(term);
                                    setNewTerm('');
                                }}
                            >
                                <Plus size={16} />
                                Add More Term
                            </button>
                        </>
                    )}
                </div>
                {isEditing && (
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Add subject (e.g. History)"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: '180px',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-input)',
                                color: 'var(--text-main)'
                            }}
                        />
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            const subject = newSubject.trim();
                            if (!subject || activeSubjects.includes(subject)) return;
                            setSubjectsByGrade({
                                ...subjectsByGrade,
                                [activeGrade]: [...activeSubjects, subject]
                            });
                            setGradeRows({
                                ...gradeRows,
                                [activeGrade]: {
                                    ...gradeRows[activeGrade],
                                    [activeTerm]: (gradeRows[activeGrade]?.[activeTerm] || []).map(r => ({
                                        ...r,
                                        scores: { ...r.scores, [subject]: '' }
                                    }))
                                }
                            });
                            setNewSubject('');
                        }}
                    >
                            <Plus size={16} />
                            Add Subject
                        </button>
                    </div>
                )}

                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '90px' }}>Student ID</th>
                            <th style={{ width: '80px' }}>Student Name</th>
                            {activeSubjects.map((subj, idx) => (
                                <th
                                    key={subj}
                                    style={{ whiteSpace: 'nowrap', cursor: isEditing ? 'grab' : 'default', textAlign: 'center' }}
                                    draggable={isEditing}
                                    onDragStart={() => setDragIndex(idx)}
                                    onDragOver={(e) => {
                                        if (isEditing) e.preventDefault();
                                    }}
                                    onDrop={() => {
                                        if (!isEditing || dragIndex === null || dragIndex === idx) return;
                                        const next = [...activeSubjects];
                                        const [moved] = next.splice(dragIndex, 1);
                                        next.splice(idx, 0, moved);
                                        setSubjectsByGrade({ ...subjectsByGrade, [activeGrade]: next });
                                        setDragIndex(null);
                                    }}
                                    onDragEnd={() => setDragIndex(null)}
                                >
                                    {subj}
                                    {canUpdate('results') && isEditing && (
                                        <button
                                            onClick={() => {
                                                openConfirm({
                                                    title: 'Remove Subject',
                                                    message: `Remove subject "${subj}" from ${activeGrade}?`,
                                                    onConfirm: () => {
                                                        setSubjectsByGrade({
                                                            ...subjectsByGrade,
                                                            [activeGrade]: activeSubjects.filter(s => s !== subj)
                                                        });
                                                        setGradeRows({
                                                            ...gradeRows,
                                                            [activeGrade]: {
                                                                ...gradeRows[activeGrade],
                                                                [activeTerm]: (gradeRows[activeGrade]?.[activeTerm] || []).map(r => {
                                                                    const nextScores = { ...r.scores };
                                                                    delete nextScores[subj];
                                                                    return { ...r, scores: nextScores };
                                                                })
                                                            }
                                                        });
                                                    }
                                                });
                                            }}
                                            style={{
                                                marginLeft: '0.5rem',
                                                color: 'var(--danger-color)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                            aria-label={`Remove ${subj}`}
                                            title={`Remove ${subj}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </th>
                            ))}
                            <th style={{ width: '60px' }}>Total</th>
                            {canDelete('results') && isEditing && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(gradeRows[activeGrade]?.[activeTerm] || [])
                            .filter((row) => row.name?.toLowerCase().includes(filterName.toLowerCase()))
                            .map((row) => (
                            <tr key={row.id}>
                                <td>
                                    <input
                                        value={formatStudentId(row.studentId)}
                                        disabled={!isEditing}
                                        onChange={(e) =>
                                            setGradeRows({
                                                ...gradeRows,
                                                [activeGrade]: {
                                                    ...gradeRows[activeGrade],
                                                    [activeTerm]: gradeRows[activeGrade]?.[activeTerm]?.map(r => r.id === row.id ? { ...r, studentId: e.target.value } : r)
                                                }
                                            })
                                        }
                                        style={{ width: '90px' }}
                                    />
                                </td>
                                <td>
                                    <input
                                        value={row.name}
                                        disabled={!isEditing}
                                        onChange={(e) =>
                                            setGradeRows({
                                                ...gradeRows,
                                                [activeGrade]: {
                                                    ...gradeRows[activeGrade],
                                                    [activeTerm]: gradeRows[activeGrade]?.[activeTerm]?.map(r => r.id === row.id ? { ...r, name: e.target.value } : r)
                                                }
                                            })
                                        }
                                        style={{ minWidth: '60px' }}
                                    />
                                </td>
                                {activeSubjects.map((subj) => (
                                    <td key={subj} style={{ textAlign: 'center' }}>
                                        <input
                                            value={row.scores[subj] ?? ''}
                                            disabled={!isEditing}
                                            onChange={(e) =>
                                            setGradeRows({
                                                ...gradeRows,
                                                [activeGrade]: {
                                                    ...gradeRows[activeGrade],
                                                    [activeTerm]: gradeRows[activeGrade]?.[activeTerm]?.map(r => r.id === row.id
                                                        ? { ...r, scores: { ...r.scores, [subj]: e.target.value } }
                                                        : r)
                                                }
                                            })
                                        }
                                            style={{ width: '52px' }}
                                    />
                                </td>
                                ))}
                                <td>{getTotal(row.scores)}</td>
                                {canDelete('results') && isEditing && (
                                    <td>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => openConfirm({
                                                title: 'Delete Row',
                                                message: 'Are you sure you want to delete this result row?',
                                                onConfirm: async () => {
                                                    try {
                                                        if (isPersistedResultId(row.id)) {
                                                            await api.delete(`/results/${row.id}`);
                                                        }
                                                        setGradeRows({
                                                            ...gradeRows,
                                                            [activeGrade]: {
                                                                ...gradeRows[activeGrade],
                                                                [activeTerm]: gradeRows[activeGrade]?.[activeTerm]?.filter(r => r.id !== row.id)
                                                            }
                                                        });
                                                    } catch (err) {
                                                        console.error('Failed to delete result row', err);
                                                        alert(err.response?.data?.msg || 'Failed to delete result row');
                                                    }
                                                }
                                        })}
                                    >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={confirm.isOpen}
                title={confirm.title}
                message={confirm.message}
                onConfirm={() => {
                    if (confirm.onConfirm) confirm.onConfirm();
                    setConfirm({ isOpen: false, title: '', message: '', onConfirm: null });
                }}
                onCancel={() => setConfirm({ isOpen: false, title: '', message: '', onConfirm: null })}
                confirmText="Confirm"
                variant="warning"
            />
        </div>
    );
};

export default Results;
