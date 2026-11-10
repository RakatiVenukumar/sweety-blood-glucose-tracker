import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const slotLabels = {
  morning: "Morning",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner"
};

const emptyForm = {
  glucose_value: "",
  reading_date: "",
  time_slot: "morning"
};

function formatDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", options).format(new Date(`${value}T00:00:00`));
}

function todayForTimezone(timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function validateForm(form, timezone) {
  const errors = {};
  const value = Number(form.glucose_value);
  if (form.glucose_value === "") {
    errors.glucose_value = "Please enter a glucose value.";
  } else if (!Number.isInteger(value) || value < 40 || value > 600) {
    errors.glucose_value = "Value must be a whole number between 40 and 600 mg/dL.";
  }
  if (!form.reading_date) {
    errors.reading_date = "Choose a reading date.";
  } else if (form.reading_date > todayForTimezone(timezone)) {
    errors.reading_date = "Date cannot be in the future.";
  }
  if (!slotLabels[form.time_slot]) errors.time_slot = "Choose a valid time slot.";
  return errors;
}

function ReadingForm({ initialValue, timezone, onClose, onSaved }) {
  const [form, setForm] = useState(initialValue || { ...emptyForm, reading_date: todayForTimezone(timezone) });
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initialValue?.id);

  useEffect(() => {
    setForm(initialValue || { ...emptyForm, reading_date: todayForTimezone(timezone) });
    setErrors({});
    setRequestError("");
  }, [initialValue, timezone]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validateForm(form, timezone);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    setRequestError("");
    try {
      const payload = {
        glucose_value: Number(form.glucose_value),
        reading_date: form.reading_date,
        time_slot: form.time_slot
      };
      const result = await apiRequest(editing ? `/readings/${initialValue.id}` : "/readings", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      onSaved(result.reading, editing ? "Reading updated successfully." : "Reading added successfully.");
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reading-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className="reading-modal" role="dialog" aria-modal="true" aria-labelledby="reading-form-title">
        <div className="modal-heading">
          <div><span className="panel-kicker">{editing ? "Refine an entry" : "New entry"}</span><h2 id="reading-form-title">{editing ? "Edit reading" : "Add a reading"}</h2></div>
          <button className="icon-button" type="button" aria-label="Close form" onClick={onClose} disabled={saving}>×</button>
        </div>
        <p className="modal-intro">Keep your daily rhythm visible, one precise entry at a time.</p>
        {requestError && <div className="form-alert" role="alert"><span>!</span>{requestError}</div>}
        <form className="reading-form" onSubmit={submit} noValidate>
          <div className={`field ${errors.glucose_value ? "field-error" : ""}`}>
            <label htmlFor="glucose_value">Glucose value</label>
            <div className="unit-input"><input id="glucose_value" name="glucose_value" type="number" min="40" max="600" step="1" inputMode="numeric" placeholder="e.g. 110" value={form.glucose_value} onChange={updateField} aria-invalid={Boolean(errors.glucose_value)} /><span>mg/dL</span></div>
            {errors.glucose_value && <span className="field-error-text">{errors.glucose_value}</span>}
          </div>
          <div className={`field ${errors.reading_date ? "field-error" : ""}`}>
            <label htmlFor="reading_date">Reading date</label>
            <input id="reading_date" name="reading_date" type="date" max={todayForTimezone(timezone)} value={form.reading_date} onChange={updateField} aria-invalid={Boolean(errors.reading_date)} />
            {errors.reading_date && <span className="field-error-text">{errors.reading_date}</span>}
          </div>
          <fieldset className={`slot-field ${errors.time_slot ? "field-error" : ""}`}>
            <legend>Time of day</legend>
            <div className="slot-options">
              {Object.entries(slotLabels).map(([value, label]) => <label className={`slot-option${form.time_slot === value ? " selected" : ""}`} key={value}><input type="radio" name="time_slot" value={value} checked={form.time_slot === value} onChange={updateField} /><span>{label}</span></label>)}
            </div>
            {errors.time_slot && <span className="field-error-text">{errors.time_slot}</span>}
          </fieldset>
          <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose} disabled={saving}>Cancel</button><button className="button button-dark reading-submit" type="submit" disabled={saving}>{saving && <span className="spinner" />}{saving ? "Saving…" : editing ? "Save changes →" : "Add reading →"}</button></div>
        </form>
      </section>
    </div>
  );
}

function DeleteDialog({ reading, deleting, onCancel, onConfirm }) {
  return (
    <div className="reading-modal-backdrop" role="presentation">
      <section className="reading-modal delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
        <span className="delete-mark">!</span>
        <span className="panel-kicker">Remove entry</span>
        <h2 id="delete-title">Delete this reading?</h2>
        <p id="delete-description">The {reading.glucose_value} mg/dL {slotLabels[reading.time_slot].toLowerCase()} reading from {formatDate(reading.reading_date)} will be permanently removed.</p>
        <div className="modal-actions"><button className="button button-quiet" type="button" onClick={onCancel} disabled={deleting}>Keep reading</button><button className="button button-danger" type="button" onClick={onConfirm} disabled={deleting}>{deleting ? "Removing…" : "Delete reading"}</button></div>
      </section>
    </div>
  );
}

function ReadingsSkeleton() {
  return <div className="readings-skeleton" aria-label="Loading readings" aria-live="polite"><div className="skeleton skeleton-title" /><div className="reading-summary-grid">{[1, 2, 3].map((item) => <div className="skeleton summary-skeleton" key={item} />)}</div><div className="skeleton history-skeleton" /></div>;
}

function ReadingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [formState, setFormState] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadReadings() {
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest("/readings");
      setReadings(result.readings || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReadings(); }, []);

  const displayedReadings = useMemo(() => {
    const filtered = dateFilter ? readings.filter((reading) => reading.reading_date === dateFilter) : [...readings];
    return filtered.sort((a, b) => {
      const first = `${a.reading_date}${a.created_at || ""}`;
      const second = `${b.reading_date}${b.created_at || ""}`;
      return sortNewest ? second.localeCompare(first) : first.localeCompare(second);
    });
  }, [dateFilter, readings, sortNewest]);

  function openEdit(reading) {
    setFormState({ ...reading, glucose_value: String(reading.glucose_value) });
  }

  async function handleSaved(reading, message) {
    setReadings((current) => {
      const withoutSaved = current.filter((item) => item.id !== reading.id);
      return [reading, ...withoutSaved];
    });
    setFormState(null);
    setNotice(message);
    addToast(message);
    window.dispatchEvent(new Event("sweety:readings-changed"));
  }

  async function confirmDelete() {
    setDeleteLoading(true);
    try {
      await apiRequest(`/readings/${deleting.id}`, { method: "DELETE" });
      setReadings((current) => current.filter((item) => item.id !== deleting.id));
      setNotice("Reading deleted successfully.");
      addToast("Reading deleted successfully.");
      setDeleting(null);
      window.dispatchEvent(new Event("sweety:readings-changed"));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <ReadingsSkeleton />;

  return (
    <section className="readings-page page-enter">
      <header className="readings-header"><div><span className="eyebrow"><span className="eyebrow-line" /> Your history</span><h1>Readings, <em>clearly.</em></h1><p>A calm, precise record of your everyday glucose rhythm.</p></div><button className="button button-dark add-reading-button" type="button" onClick={() => setFormState("new")}><span className="plus-symbol">+</span> Add reading <span>→</span></button></header>
      {notice && <div className="success-alert" role="status"><span>✓</span>{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
      {error && <div className="dashboard-alert" role="alert"><span>!</span>{error}<button onClick={loadReadings} type="button">Try again</button></div>}
      <div className="reading-summary-grid">
        <article className="reading-summary-card summary-primary"><span className="summary-icon">⌁</span><span className="panel-kicker">Displayed readings</span><strong>{displayedReadings.length}</strong><small>{dateFilter ? "matching selected date" : "across your history"}</small></article>
        <article className="reading-summary-card"><span className="summary-icon">◷</span><span className="panel-kicker">Latest entry</span><strong>{displayedReadings[0] ? `${displayedReadings[0].glucose_value}` : "—"}<small>{displayedReadings[0] && " mg/dL"}</small></strong><small>{displayedReadings[0] ? formatDate(displayedReadings[0].reading_date) : "No readings yet"}</small></article>
        <article className="reading-summary-card summary-accent"><span className="summary-icon">✦</span><span className="panel-kicker">Your cadence</span><strong>{readings.length ? "In motion" : "Ready when you are"}</strong><small>{readings.length ? "Keep building your rhythm" : "Add your first entry"}</small></article>
      </div>
      <section className="history-panel dashboard-panel">
        <div className="panel-heading history-heading"><div><span className="panel-kicker">The complete picture</span><h2>Reading history</h2></div><div className="history-actions"><label className="date-filter"><span>Filter date</span><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label><button className="sort-button" type="button" onClick={() => setSortNewest((current) => !current)} aria-label={`Sort ${sortNewest ? "oldest" : "newest"} first`}>{sortNewest ? "Newest first ↓" : "Oldest first ↑"}</button>{dateFilter && <button className="clear-filter" type="button" onClick={() => setDateFilter("")}>Clear</button>}</div></div>
        {displayedReadings.length ? <div className="reading-history-list"><div className="reading-history-head"><span>Date</span><span>Time of day</span><span>Glucose</span><span>Actions</span></div>{displayedReadings.map((reading) => <article className="history-reading-row" key={reading.id}><div className="history-date"><strong>{formatDate(reading.reading_date)}</strong><small>{reading.reading_date}</small></div><div className="history-slot"><span className="slot-dot" />{slotLabels[reading.time_slot] || reading.time_slot}</div><strong className="history-value">{reading.glucose_value}<small>mg/dL</small></strong><div className="history-row-actions"><button type="button" onClick={() => openEdit(reading)}>Edit</button><button className="delete-link" type="button" onClick={() => setDeleting(reading)}>Delete</button></div></article>)}</div> : <div className="history-empty"><span className="empty-chart-mark">⌁</span><h3>{dateFilter ? "No reading on this date." : "Your history starts here."}</h3><p>{dateFilter ? "Try another date or clear the filter." : "Add a reading to turn today’s small step into a useful pattern."}</p>{dateFilter ? <button className="text-button" type="button" onClick={() => setDateFilter("")}>Clear date filter <span>→</span></button> : <button className="button button-dark" type="button" onClick={() => setFormState("new")}>Add your first reading <span>→</span></button>}</div>}
      </section>
      <p className="dashboard-disclaimer">Your readings are private · Sweety provides tracking tools, not medical advice.</p>
      {formState && <ReadingForm initialValue={formState === "new" ? null : formState} timezone={user?.timezone} onClose={() => setFormState(null)} onSaved={handleSaved} />}
      {deleting && <DeleteDialog reading={deleting} deleting={deleteLoading} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
    </section>
  );
}

export default ReadingsPage;
