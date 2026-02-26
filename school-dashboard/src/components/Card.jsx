const Card = ({ title, value, icon, color }) => {
    return (
        <div className="card stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="stat-info">
                <h3>{title}</h3>
                <p>{value}</p>
            </div>
        </div>
    );
};

export default Card;
