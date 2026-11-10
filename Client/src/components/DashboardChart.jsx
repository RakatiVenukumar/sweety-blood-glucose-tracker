function formatSlot(slot) {
  return slot.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function DashboardChart({ readings = [], dailySummaries = [] }) {
  const points = readings.length
    ? [...readings]
      .sort((a, b) => `${a.reading_date}${a.time_slot}`.localeCompare(`${b.reading_date}${b.time_slot}`))
      .map((reading) => ({ label: reading.reading_date, value: Number(reading.glucose_value), detail: formatSlot(reading.time_slot) }))
    : dailySummaries.map((summary) => ({
      label: summary.date,
      value: Number(summary.average_glucose),
      detail: `${summary.total_readings} reading${summary.total_readings === 1 ? "" : "s"}`
    }));

  if (!points.length) {
    return (
      <div className="dashboard-chart-empty">
        <div className="empty-chart-mark">⌁</div>
        <strong>Your rhythm will appear here.</strong>
        <span>Add a reading to begin noticing patterns.</span>
      </div>
    );
  }

  const width = 760;
  const height = 235;
  const padding = { top: 20, right: 20, bottom: 42, left: 37 };
  const values = points.map((point) => point.value);
  const min = Math.max(0, Math.min(...values) - 20);
  const max = Math.max(...values) + 20;
  const x = (index) => padding.left + (index * (width - padding.left - padding.right)) / Math.max(points.length - 1, 1);
  const y = (value) => padding.top + ((max - value) * (height - padding.top - padding.bottom)) / Math.max(max - min, 1);
  const path = points.map((point, index) => `${index ? "L" : "M"} ${x(index)} ${y(point.value)}`).join(" ");
  const areaPath = `${path} L ${x(points.length - 1)} ${height - padding.bottom} L ${x(0)} ${height - padding.bottom} Z`;
  const gridValues = [max, min + (max - min) / 2, min];

  return (
    <div className="dashboard-chart" aria-label="Glucose trend chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <defs>
          <linearGradient id="dashboard-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ed8961" stopOpacity=".25" />
            <stop offset="100%" stopColor="#ed8961" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridValues.map((gridValue) => (
          <g key={gridValue}>
            <line x1={padding.left} x2={width - padding.right} y1={y(gridValue)} y2={y(gridValue)} className="chart-grid-line" />
            <text x="0" y={y(gridValue) + 4} className="chart-axis-label">{Math.round(gridValue)}</text>
          </g>
        ))}
        <path d={areaPath} className="dashboard-area-path" />
        <path d={path} className="dashboard-line-path" />
        {points.map((point, index) => (
          <g className="chart-point-group" key={`${point.label}-${point.detail}-${index}`}>
            <circle cx={x(index)} cy={y(point.value)} r="13" className="chart-hit-area">
              <title>{`${point.label} · ${point.detail}: ${point.value} mg/dL`}</title>
            </circle>
            <circle cx={x(index)} cy={y(point.value)} r="4.5" className="chart-point" />
          </g>
        ))}
      </svg>
      <div className="dashboard-chart-labels">
        {points.map((point, index) => <span key={`${point.label}-${index}`}>{point.label.slice(5)}</span>)}
      </div>
    </div>
  );
}

export default DashboardChart;
