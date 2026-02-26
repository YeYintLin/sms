import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const TERM_STORAGE_KEY = 'results_active_term_by_grade';

const DEFAULT_GRADES = ['KG', ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];

const createDefaultSubjects = () => {
    const subjects = {
        KG: ['Math', 'English', 'Science', 'History', 'Geography', 'ICT']
    };
    DEFAULT_GRADES.slice(1).forEach((grade) => {
        subjects[grade] = ['Math', 'English', 'Science', 'History', 'Geography', 'ICT'];
    });
    return subjects;
};

const createDefaultTerms = () => {
    const terms = {};
    DEFAULT_GRADES.forEach((grade) => {
        terms[grade] = ['2026 January'];
    });
    return terms;
};

const createDefaultGradeRows = () => ({
    KG: {
        '2026 January': [
            {
                id: 1,
                studentId: 'KG-001',
                name: 'Alice Johnson',
                scores: {
                    Math: 90,
                    English: 88,
                    Science: 85,
                    History: 80,
                    Geography: 82,
                    ICT: 91
                }
            }
        ]
    },
    'Grade 1': {
        '2026 January': [
            {
                id: 2,
                studentId: 'G1-004',
                name: 'Mia Clark',
                scores: {
                    Math: 78,
                    English: 84,
                    Science: 80,
                    History: 72,
                    Geography: 75,
                    ICT: 86
                }
            }
        ]
    },
    'Grade 2': { '2026 January': [] },
    'Grade 3': { '2026 January': [] },
    'Grade 4': { '2026 January': [] },
    'Grade 5': {
        '2026 January': [
            {
                id: 3,
                studentId: 'G5-014',
                name: 'Liam Smith',
                scores: {
                    Math: 76,
                    English: 81,
                    Science: 79,
                    History: 74,
                    Geography: 77,
                    ICT: 83
                }
            }
        ]
    },
    'Grade 6': { '2026 January': [] },
    'Grade 7': { '2026 January': [] },
    'Grade 8': { '2026 January': [] },
    'Grade 9': { '2026 January': [] },
    'Grade 10': {
        '2026 January': [
            {
                id: 4,
                studentId: 'G10-112',
                name: 'Emily Davis',
                scores: {
                    Math: 92,
                    English: 89,
                    Science: 94,
                    History: 87,
                    Geography: 90,
                    ICT: 95
                }
            }
        ]
    },
    'Grade 11': { '2026 January': [] },
    'Grade 12': { '2026 January': [] }
});

export const useResultsData = ({ userGrade, isAdmin, filterYear }) => {
    const [grades, setGrades] = useState(DEFAULT_GRADES);
    const [subjectsByGrade, setSubjectsByGrade] = useState(createDefaultSubjects);
    const [termsByGrade, setTermsByGrade] = useState(createDefaultTerms);
    const [gradeRows, setGradeRows] = useState(createDefaultGradeRows);
    const [activeGrade, setActiveGrade] = useState(isAdmin ? DEFAULT_GRADES[0] : userGrade || DEFAULT_GRADES[0]);
    const [activeTerm, setActiveTerm] = useState('2026 January');
    const [isLoading, setIsLoading] = useState(true);

    const getSavedTerm = useCallback((grade) => {
        if (!grade) return '';
        try {
            const raw = localStorage.getItem(TERM_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed[grade] : '';
        } catch {
            return '';
        }
    }, []);

    const saveActiveTerm = useCallback((grade, term) => {
        if (!grade || !term) return;
        try {
            const raw = localStorage.getItem(TERM_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            const next = parsed && typeof parsed === 'object' ? { ...parsed } : {};
            next[grade] = term;
            localStorage.setItem(TERM_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore
        }
    }, []);

    const activeSubjects = useMemo(() => subjectsByGrade[activeGrade] || [], [subjectsByGrade, activeGrade]);

    const refreshResults = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/results');
            const payload = res.data?.data ?? [];
            const results = Array.isArray(payload) ? payload : [];

            const nextGrades = new Set(DEFAULT_GRADES);
            const nextSubjectsByGrade = {};
            const nextRowsByGrade = {};
            const nextTermsByGrade = {};

            results.forEach((result) => {
                const grade = result.grade || 'Unknown';
                const term = result.term || 'Term 1';
                nextGrades.add(grade);

                const subjectNames = (result.subjects || []).map((s) => s.name);
                nextSubjectsByGrade[grade] = Array.from(
                    new Set([...(nextSubjectsByGrade[grade] || []), ...subjectNames])
                );

                const studentId = result.student?.studentId || '-';
                const studentName = result.student?.userId?.name || 'Unknown';
                const scores = (result.subjects || []).reduce((acc, s) => {
                    acc[s.name] = s.score;
                    return acc;
                }, {});

                if (!nextTermsByGrade[grade]) nextTermsByGrade[grade] = [];
                if (!nextTermsByGrade[grade].includes(term)) nextTermsByGrade[grade].push(term);

                if (!nextRowsByGrade[grade]) nextRowsByGrade[grade] = {};
                if (!nextRowsByGrade[grade][term]) nextRowsByGrade[grade][term] = [];
                nextRowsByGrade[grade][term].push({
                    id: result._id,
                    studentId,
                    name: studentName,
                    scores
                });
            });

            setGrades(Array.from(nextGrades));
            setSubjectsByGrade((prev) => ({ ...prev, ...nextSubjectsByGrade }));
            setTermsByGrade((prev) => ({ ...prev, ...nextTermsByGrade }));
            setGradeRows((prev) => ({ ...prev, ...nextRowsByGrade }));
        } catch (err) {
            console.error('Failed to load results', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const isPersistedResultId = useCallback((id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id), []);

    const persistActiveRows = useCallback(async () => {
        const rows = gradeRows[activeGrade]?.[activeTerm] || [];
        for (const row of rows) {
            const normalizedStudentId = String(row.studentId || '').trim();
            if (!normalizedStudentId) {
                throw new Error('Student ID is required for each row before saving.');
            }

            const payload = {
                studentId: normalizedStudentId,
                grade: activeGrade,
                term: activeTerm,
                subjects: activeSubjects.map((subjectName) => {
                    const score = Number(row.scores?.[subjectName]);
                    return {
                        name: subjectName,
                        score: Number.isFinite(score) ? score : 0
                    };
                })
            };

            if (isPersistedResultId(row.id)) {
                await api.put(`/results/${row.id}`, payload);
            } else {
                await api.post('/results', payload);
            }
        }
    }, [activeGrade, activeTerm, activeSubjects, gradeRows, isPersistedResultId]);

    useEffect(() => {
        if (!isAdmin && userGrade) {
            setGrades((prev) => (prev.includes(userGrade) ? prev : [...prev, userGrade]));
            setSubjectsByGrade((prev) =>
                prev[userGrade] ? prev : { ...prev, [userGrade]: ['Math', 'English', 'Science', 'History', 'Geography', 'ICT'] }
            );
            setGradeRows((prev) => (prev[userGrade] ? prev : { ...prev, [userGrade]: { '2026 January': [] } }));
            setTermsByGrade((prev) => (prev[userGrade] ? prev : { ...prev, [userGrade]: ['2026 January'] }));
            setActiveGrade(userGrade);
        }
    }, [isAdmin, userGrade]);

    useEffect(() => {
        const terms = termsByGrade[activeGrade] || [];
        const filteredTerms = filterYear
            ? terms.filter((t) => t.toLowerCase().startsWith(filterYear.toLowerCase()))
            : terms;
        const savedTerm = getSavedTerm(activeGrade);
        const nextTerm = savedTerm && filteredTerms.includes(savedTerm) ? savedTerm : filteredTerms[0];
        if (nextTerm && nextTerm !== activeTerm) {
            setActiveTerm(nextTerm);
        }
    }, [activeGrade, termsByGrade, activeTerm, filterYear, getSavedTerm]);

    useEffect(() => {
        if (activeGrade && activeTerm) {
            saveActiveTerm(activeGrade, activeTerm);
        }
    }, [activeGrade, activeTerm, saveActiveTerm]);

    useEffect(() => {
        refreshResults();
    }, [refreshResults]);

    return {
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
    };
};
