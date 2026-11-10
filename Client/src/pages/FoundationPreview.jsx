const week = [
  { day: "M", value: 92, height: "36%" },
  { day: "T", value: 108, height: "54%" },
  { day: "W", value: 96, height: "43%" },
  { day: "T", value: 124, height: "72%" },
  { day: "F", value: 112, height: "60%" },
  { day: "S", value: 101, height: "48%" },
  { day: "S", value: 88, height: "30%" }
];

function PulseChart() {
  return (
    <div className="pulse-chart" aria-label="Illustrative weekly glucose rhythm chart">
      <div className="chart-grid"><span /><span /><span /></div>
      <svg viewBox="0 0 640 180" role="img" aria-label="A gentle glucose trend line">
        <defs>
          <linearGradient id="pulseFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef8c63" stopOpacity=".26" />
            <stop offset="100%" stopColor="#ef8c63" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="pulse-area" d="M0 126 C45 115 56 65 105 85 S160 132 207 92 S275 40 315 76 S370 140 420 101 S465 54 512 80 S570 119 640 42 L640 180 L0 180Z" />
        <path className="pulse-line" d="M0 126 C45 115 56 65 105 85 S160 132 207 92 S275 40 315 76 S370 140 420 101 S465 54 512 80 S570 119 640 42" />
        <circle cx="512" cy="80" r="6" />
      </svg>
      <div className="chart-labels">{week.map((item, index) => <span key={`${item.day}-${index}`}>{item.day}</span>)}</div>
    </div>
  );
}

function FoundationPreview() {
  return (
    <section className="preview page-enter">
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> A calmer health ritual</span>
          <h1>Know your rhythm.<br /><em>Feel your best.</em></h1>
          <p className="hero-lede">Sweety turns everyday glucose moments into a clear, compassionate picture of your wellbeing.</p>
          <div className="hero-actions">
            <button className="button button-dark">Explore your rhythm <span>→</span></button>
            <button className="text-button">See how it works <span>↗</span></button>
          </div>
          <div className="trust-row"><span className="avatar-stack"><i>R</i><i>A</i><i>M</i></span><span>Made for steady progress</span><b>·</b><span>Private & secure</span></div>
        </div>

        <div className="hero-art" aria-label="Illustrative glucose rhythm preview">
          <div className="art-sun" />
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-leaf leaf-one" />
          <div className="art-leaf leaf-two" />
          <div className="art-card">
            <div className="art-card-top"><span>Today’s rhythm</span><span className="live-dot">●</span></div>
            <strong>In balance</strong>
            <span className="art-card-note">Your calmest window is ahead</span>
            <div className="art-wave"><span /><span /><span /><span /><span /><span /><span /></div>
          </div>
          <span className="float-label label-top">08:30 <b>mg/dL</b></span>
          <span className="float-label label-bottom">steady <i>↗</i></span>
        </div>
      </div>

      <div className="section-rule" />
      <div className="section-intro">
        <div><span className="eyebrow">A little clarity, every day</span><h2>Built around <em>you.</em></h2></div>
        <p>Thoughtful tools for noticing patterns, celebrating progress, and making health feel a little less overwhelming.</p>
      </div>

      <div className="feature-grid">
        <article className="feature-card chart-card">
          <div className="card-heading"><div><span className="card-kicker">Weekly overview</span><h3>Your rhythm at a glance</h3></div><span className="trend-badge">+12% <span>↗</span></span></div>
          <PulseChart />
          <div className="chart-footer"><span>Last 7 days</span><strong>104 <small>mg/dL avg.</small></strong></div>
        </article>
        <article className="feature-card insight-card">
          <span className="card-kicker">A small insight</span>
          <div className="insight-icon">✦</div>
          <h3>Consistency<br /><em>looks good on you.</em></h3>
          <p>You’ve logged your mornings for 5 days in a row. That’s a rhythm worth keeping.</p>
          <div className="progress-track"><span /></div>
          <span className="progress-label">5 of 7 day streak <b>71%</b></span>
        </article>
        <article className="feature-card quick-card">
          <div className="quick-orb"><span>+</span></div>
          <span className="card-kicker">When you’re ready</span>
          <h3>Make a note<br />of how you feel.</h3>
          <p>Your story is more than a number.</p>
          <button className="circle-arrow" aria-label="Add a note">↗</button>
        </article>
      </div>
      <p className="demo-disclaimer">Illustrative preview · Demo data only · Not medical advice</p>
    </section>
  );
}

export default FoundationPreview;
