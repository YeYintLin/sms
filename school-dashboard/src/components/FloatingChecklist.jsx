const FloatingChecklist = ({ progress = 10 }) => {
    return (
        <div className="floating-checklist">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white' }}></div>
                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Getting started checklist</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{progress}%</span>
                <div className="progress-track">
                    <div className="progress-thumb" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default FloatingChecklist;
