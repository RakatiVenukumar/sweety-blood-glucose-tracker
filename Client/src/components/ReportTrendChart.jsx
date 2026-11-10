function formatDay(value) {
  if (!value) return "";
  return value.slice(5);
}

function ReportTrendChart({ summaries = [], label = "Monthly glucose trend" }) {
  const points = summaries
    .filter((summary) => summary.average_glucose !== null && summary.average_glucose !== undefined)
    .map((summary) => ({
      label: summary.date,
      value: Number(summary.average_glucose),
      count: summary.total_readings
    }));

  if (!points.length) {
    return (
      <div className="report-chart-empty">
        <span className="empty-chart-mark">⌁</span>
        <strong>No readings in this period.</strong>
        <span>Your trend will appear when readings are available.</span>
      </div>
    );
  }

  const width = 820;
  const height = 280;
  const padding = { top: 24, right: 24, bottom: 47, left: 44 };
  const values = points.map((point) => point.value);
  const min = Math.max(0, Math.min(...values) - 15);
  const max = Math.max(...values) + 15;
  const x = (index) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(points.length - 1, 1);
  const y = (value) => padding.top + ((max - value) * (height - padding.top - padding.bottom)) / Math.max(max - min, 1);
  const path = points.map((point, index) => `${index ? "L" : "M"} ${x(index)} ${y(point.value)}`).join(" ");
  const areaPath = `${path} L ${x(points.length - 1)} ${height - padding.bottom} L ${x(0)} ${height - padding.bottom} Z`;
  const gridValues = [max, min + (max - min) / 2, min];

  return (
    <div className="report-chart" aria-label={label}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="report-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#173d35" stopOpacity=".2" />
            <stop offset="100%" stopColor="#173d35" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridValues.map((gridValue) => (
          <g key={gridValue}>
            <line x1={padding.left} x2={width - padding.right} y1={y(gridValue)} y2={y(gridValue)} className="report-grid-line" />
            <text x="0" y={y(gridValue) + 4} className="report-axis-label">{Math.round(gridValue)}</text>
          </g>
        ))}
        <path d={areaPath} className="report-area-path" />
        <path d={path} className="report-line-path" />
        {points.map((point, index) => (
          <g className="report-point-group" key={`${point.label}-${index}`}>
            <circle cx={x(index)} cy={y(point.value)} r="14" className="report-hit-area">
              <title>{`${point.label}: ${Math.round(point.value)} mg/dL average · ${point.count} reading${point.count === 1 ? "" : "s"}`}</title>
            </circle>
            <circle cx={x(index)} cy={y(point.value)} r="5" className="report-point" />
          </g>
        ))}
      </svg>
      <div className="report-chart-labels">{points.map((point, index) => <span key={`${point.label}-${index}`}>{formatDay(point.label)}</span>)}</div>
    </div>
  );
}

export default ReportTrendChart;
