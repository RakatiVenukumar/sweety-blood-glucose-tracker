function AuthBrandPanel({ mode }) {
  return (
    <aside className="auth-brand-panel">
      <div className="auth-panel-orbit orbit-a" />
      <div className="auth-panel-orbit orbit-b" />
      <span className="auth-panel-spark spark-a">✦</span>
      <span className="auth-panel-spark spark-b">+</span>
      <div className="auth-panel-copy">
        <span className="brand-mark auth-mark" aria-hidden="true">✦</span>
        <span className="auth-panel-kicker">Sweety / {mode === "login" ? "Welcome back" : "A good beginning"}</span>
        <h2>{mode === "login" ? "Your rhythm is waiting." : "Make space for feeling good."}</h2>
        <p>Small moments of clarity can change the way a whole day feels.</p>
      </div>
      <div className="auth-quote">
        <span>“</span>
        <p>Health is a practice, not a performance.</p>
      </div>
    </aside>
  );
}

export default AuthBrandPanel;
