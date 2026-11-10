const iconMap = {
  count: "⌁",
  average: "◌",
  minimum: "↓",
  maximum: "↑"
};

function MetricCard({ label, value, unit = "mg/dL", type, accent = "" }) {
  return (
    <article className={`metric-card ${accent}`}>
      <div className="metric-card-top">
        <span className="metric-icon" aria-hidden="true">{iconMap[type]}</span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value">{value === null || value === undefined ? "—" : value}<small>{value === null || value === undefined ? "" : unit}</small></div>
    </article>
  );
}

export default MetricCard;
