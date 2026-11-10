import { useEffect, useMemo, useState } from "react";
import ReportTrendChart from "../components/ReportTrendChart";
import { apiRequest } from "../services/apiClient";

const slotLabels = {
  morning: "Morning",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner"
};

function formatPeriod(value) {
  if (!value) return "This period";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function metricValue(value, suffix = "") {
  return value === null || value === undefined ? "—" : `${Math.round(Number(value))}${suffix}`;
}

function ReportMetric({ label, value, detail, accent = "" }) {
  return <article className={`report-metric ${accent}`}><span className="panel-kicker">{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function ReportMetricGrid({ report, periodLabel }) {
  return <div className="report-metrics"><ReportMetric label="Total readings" value={report?.total_readings ?? 0} detail={periodLabel} accent="report-metric-primary" /><ReportMetric label="Average glucose" value={metricValue(report?.average_glucose, " mg/dL")} detail="Period average" accent="report-metric-coral" /><ReportMetric label="Lowest reading" value={metricValue(report?.minimum_glucose, " mg/dL")} detail="Recorded minimum" /><ReportMetric label="Highest reading" value={metricValue(report?.maximum_glucose, " mg/dL")} detail="Recorded maximum" accent="report-metric-sand" /></div>;
}

function SlotDistribution({ counts = [] }) {
  const values = Object.keys(slotLabels).map((slot) => ({ slot, count: Number(counts.find((item) => item.time_slot === slot)?.count || 0) }));
  const max = Math.max(...values.map((item) => item.count), 1);
  return <div className="report-slot-list">{values.map(({ slot, count }) => <div className="report-slot-row" key={slot}><div><span>{slotLabels[slot]}</span><strong>{count}</strong></div><div className="report-slot-track"><span style={{ width: `${(count / max) * 100}%` }} /></div></div>)}</div>;
}

function DailyReport({ report }) {
  return <article className="report-panel daily-report-panel"><div className="report-panel-heading"><div><span className="panel-kicker">Today, in focus</span><h2>{formatDate(report?.date)}</h2></div><span className="report-panel-symbol">◌</span></div><div className="daily-stats"><span><strong>{report?.total_readings ?? 0}</strong> readings</span><span><strong>{metricValue(report?.average_glucose)}</strong> avg.</span></div>{report?.readings?.length ? <div className="daily-reading-list">{report.readings.map((reading) => <div className="daily-reading-row" key={`${reading.date}-${reading.time_slot}`}><span>{slotLabels[reading.time_slot] || reading.time_slot}</span><strong>{reading.glucose_value}<small>mg/dL</small></strong></div>)}</div> : <div className="report-inline-empty"><span>⌁</span><p>No readings recorded today.</p></div>}</article>;
}

function ReportsSkeleton() {
  return <div className="reports-skeleton" aria-label="Loading reports" aria-live="polite"><div className="skeleton skeleton-title" /><div className="report-metrics">{[1, 2, 3, 4].map((item) => <div className="skeleton report-metric-skeleton" key={item} />)}</div><div className="skeleton report-large-skeleton" /></div>;
}

function ReportsPage() {
  const [data, setData] = useState({ daily: null, monthly: null, previous: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([apiRequest("/reports/daily"), apiRequest("/reports/monthly"), apiRequest("/reports/previous-month")])
      .then(([daily, monthly, previous]) => {
        if (active) setData({ daily: daily.report, monthly: monthly.report, previous: previous.report });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const monthlyPeriod = formatPeriod(data.monthly?.month);
  const previousPeriod = formatPeriod(data.previous?.month);
  const monthlyDays = useMemo(() => data.monthly?.daily_summaries || [], [data.monthly]);
  const previousDays = useMemo(() => data.previous?.daily_summaries || [], [data.previous]);

  if (loading) return <ReportsSkeleton />;

  return (
    <section className="reports-page page-enter">
      <header className="reports-header"><div><span className="eyebrow"><span className="eyebrow-line" /> Your patterns</span><h1>Reports, <em>with clarity.</em></h1><p>A grounded view of your glucose rhythm across the periods Sweety tracks.</p></div><div className="report-period-badge"><span>Current period</span><strong>{monthlyPeriod}</strong><small>Based on your saved timezone</small></div></header>
      {error && <div className="dashboard-alert" role="alert"><span>!</span>{error}<button onClick={() => window.location.reload()} type="button">Try again</button></div>}
      <ReportMetricGrid report={data.monthly} periodLabel={monthlyPeriod} />
      <div className="reports-feature-grid">
        <article className="report-panel report-trend-panel"><div className="report-panel-heading"><div><span className="panel-kicker">Monthly analytics</span><h2>Daily glucose rhythm</h2></div><span className="report-period-label">{monthlyPeriod}</span></div><ReportTrendChart summaries={monthlyDays} /><div className="report-chart-footer"><span><i className="report-legend-dot" /> Daily average</span><span>{data.monthly?.total_readings ?? 0} readings this period</span></div></article>
        <article className="report-panel slot-panel"><div className="report-panel-heading"><div><span className="panel-kicker">Monthly distribution</span><h2>By time of day</h2></div><span className="report-panel-symbol">✦</span></div><SlotDistribution counts={data.monthly?.time_slot_counts} /><p className="report-note">Counts reflect readings recorded in {monthlyPeriod.toLowerCase()}.</p></article>
      </div>
      <div className="reports-detail-grid"><DailyReport report={data.daily} /><article className="report-panel daily-summary-panel"><div className="report-panel-heading"><div><span className="panel-kicker">Month at a glance</span><h2>Daily summaries</h2></div></div>{monthlyDays.length ? <div className="summary-list">{monthlyDays.map((day) => <div className="summary-row" key={day.date}><span>{formatDate(day.date)}</span><strong>{metricValue(day.average_glucose, " mg/dL")}</strong><small>{day.total_readings} reading{day.total_readings === 1 ? "" : "s"}</small></div>)}</div> : <div className="report-empty-block"><span className="empty-chart-mark">⌁</span><strong>No monthly readings yet.</strong><span>Add a reading to begin the monthly view.</span></div>}</article></div>
      <section className="previous-report-section"><div className="previous-report-intro"><span className="panel-kicker">A little context</span><h2>Previous month</h2><p>Compare the completed period without turning your health data into a score.</p><span className="report-period-label">{previousPeriod}</span></div><div className="previous-report-content"><ReportMetricGrid report={data.previous} periodLabel={previousPeriod} /><div className="previous-chart-wrap"><ReportTrendChart summaries={previousDays} label="Previous month glucose trend" /></div></div></section>
      <p className="dashboard-disclaimer">Your readings are private · Sweety provides tracking tools, not medical advice.</p>
    </section>
  );
}

export default ReportsPage;
