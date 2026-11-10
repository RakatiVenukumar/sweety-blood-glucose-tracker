import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardChart from "../components/DashboardChart";
import MetricCard from "../components/MetricCard";
import { apiRequest } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";

const slotLabels = {
  morning: "Morning",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner"
};

function formatDate(dateString) {
  if (!dateString) return "Today";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" })
    .format(new Date(`${dateString}T00:00:00`));
}

function formatSlot(slot) {
  return slotLabels[slot] || slot;
}

function DashboardSkeleton() {
  return <div className="dashboard-loading" aria-label="Loading dashboard" aria-live="polite">
    <div className="skeleton skeleton-title" />
    <div className="dashboard-metrics">{[1, 2, 3, 4].map((item) => <div className="skeleton metric-skeleton" key={item} />)}</div>
    <div className="skeleton skeleton-chart" />
  </div>;
}

function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ daily: null, monthly: null, readings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadDashboard = () => Promise.all([
      apiRequest("/reports/daily"),
      apiRequest("/reports/monthly"),
      apiRequest("/readings")
    ]).then(([daily, monthly, readings]) => {
      if (active) setData({ daily: daily.report, monthly: monthly.report, readings: readings.readings || [] });
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    loadDashboard();
    window.addEventListener("sweety:readings-changed", loadDashboard);
    return () => { active = false; window.removeEventListener("sweety:readings-changed", loadDashboard); };
  }, []);

  const recentReadings = useMemo(() => data.readings.slice(0, 5), [data.readings]);
  const firstName = user?.name?.split(" ")[0] || "there";
  const monthlySlots = Object.keys(slotLabels).map((slot) => ({
    slot,
    count: data.monthly?.time_slot_counts?.find((item) => item.time_slot === slot)?.count || 0
  }));
  const maxSlotCount = Math.max(...monthlySlots.map((item) => item.count), 1);

  if (loading) return <DashboardSkeleton />;

  return (
    <section className="dashboard-page page-enter">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> {formatDate(data.daily?.date)}</span>
          <h1>Good morning, <em>{firstName}.</em></h1>
          <p>Here’s a clear view of your rhythm today.</p>
        </div>
        <Link className="button button-dark add-reading-button" to="/readings"><span className="plus-symbol">+</span> Add reading <span>→</span></Link>
      </header>

      {error && <div className="dashboard-alert" role="alert"><span>!</span>{error}<button onClick={() => window.location.reload()} type="button">Try again</button></div>}

      <div className="dashboard-metrics">
        <MetricCard accent="metric-primary" label="Today’s readings" type="count" unit="logged" value={data.daily?.total_readings ?? 0} />
        <MetricCard accent="metric-coral" label="Average glucose" type="average" value={data.daily?.average_glucose === null ? null : Math.round(data.daily?.average_glucose)} />
        <MetricCard accent="metric-sage" label="Lowest reading" type="minimum" value={data.daily?.minimum_glucose} />
        <MetricCard accent="metric-sand" label="Highest reading" type="maximum" value={data.daily?.maximum_glucose} />
      </div>

      <div className="dashboard-main-grid">
        <article className="dashboard-panel trend-panel">
          <div className="panel-heading">
            <div><span className="panel-kicker">Your rhythm</span><h2>Glucose over time</h2></div>
            <span className="period-pill">This month <span>⌄</span></span>
          </div>
          <DashboardChart dailySummaries={data.monthly?.daily_summaries} readings={data.readings} />
          <div className="chart-legend"><span><i className="legend-dot" /> Actual readings</span><span>{data.monthly?.total_readings || 0} this month</span></div>
        </article>

        <article className="dashboard-panel monthly-panel">
          <div className="panel-heading"><div><span className="panel-kicker">Monthly overview</span><h2>{data.monthly?.month || "This month"}</h2></div><span className="panel-spark">✦</span></div>
          <div className="monthly-feature-value">{data.monthly?.average_glucose === null ? "—" : Math.round(data.monthly?.average_glucose)} <small>mg/dL avg.</small></div>
          <div className="monthly-range"><span>Low <strong>{data.monthly?.minimum_glucose ?? "—"}</strong></span><span>High <strong>{data.monthly?.maximum_glucose ?? "—"}</strong></span></div>
          <div className="monthly-bar"><span style={{ width: `${Math.min((data.monthly?.total_readings || 0) * 5, 100)}%` }} /></div>
          <div className="monthly-footer"><span>{data.monthly?.total_readings || 0} readings logged</span><Link to="/reports">View report <span>↗</span></Link></div>
        </article>
      </div>

      <div className="dashboard-bottom-grid">
        <article className="dashboard-panel recent-panel">
          <div className="panel-heading"><div><span className="panel-kicker">Latest entries</span><h2>Recent readings</h2></div><Link className="panel-link" to="/readings">View all <span>↗</span></Link></div>
          {recentReadings.length ? <div className="reading-list">{recentReadings.map((reading) => <div className="reading-row" key={reading.id}><span className="reading-date">{reading.reading_date}<small>{formatSlot(reading.time_slot)}</small></span><strong>{reading.glucose_value}<small>mg/dL</small></strong><span className="reading-arrow">↗</span></div>)}</div> : <div className="dashboard-empty"><span>⌁</span><p>No readings yet today.</p><Link to="/readings">Add your first reading →</Link></div>}
        </article>
        <article className="dashboard-panel slots-panel">
          <div className="panel-heading"><div><span className="panel-kicker">Monthly distribution</span><h2>By time of day</h2></div></div>
          <div className="slot-list">{monthlySlots.map(({ slot, count }) => <div className="slot-row" key={slot}><div><span>{formatSlot(slot)}</span><strong>{count}</strong></div><div className="slot-track"><span style={{ width: `${(count / maxSlotCount) * 100}%` }} /></div></div>)}</div>
        </article>
      </div>
      <p className="dashboard-disclaimer">Your readings are private · Sweety provides tracking tools, not medical advice.</p>
    </section>
  );
}

export default DashboardPage;
