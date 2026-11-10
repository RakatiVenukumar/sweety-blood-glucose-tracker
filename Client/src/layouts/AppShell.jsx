import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Overview", icon: "◌" },
  { to: "/readings", label: "Readings", icon: "⌁" },
  { to: "/reports", label: "Reports", icon: "↗" }
];

function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand-lockup" to="/" aria-label="Sweety home">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>
            <strong>Sweety</strong>
            <small>glucose, with clarity</small>
          </span>
        </NavLink>

        <div className="sidebar-section">
          <span className="nav-caption">Workspace</span>
          <nav className="primary-nav" aria-label="Primary navigation">
            {links.map((link) => (
              <NavLink
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                key={link.to}
                to={link.to}
              >
                <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-note">
          <span className="mini-orbit" aria-hidden="true">+</span>
          <p>Small, steady steps add up.</p>
          <span>Built for your everyday rhythm.</span>
        </div>

        <footer className="sidebar-footer">
          <span className="status-dot" />
          <span>Private by design</span>
        </footer>
      </aside>

      <main className="main-canvas">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Preview</strong></div>
          <div className="topbar-actions">
            <span className="demo-pill"><span className="status-dot" /> Demo mode</span>
            <button className="avatar-button" aria-label="Profile preview">SK</button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
