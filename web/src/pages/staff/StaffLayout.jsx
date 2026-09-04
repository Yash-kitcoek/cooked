import React from 'react';
import { Activity, ClipboardList, LayoutDashboard, LogOut, Menu, Sparkles, X, Home } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../admin/admin.css';

const nav = [
  ['/staff', 'Overview', LayoutDashboard, true],
  ['/staff/problems', 'Core Problems', Activity],
  ['/staff/complaints', 'Complaints', ClipboardList],
];

export function StaffLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const name = session?.username || session?.full_name || session?.email || 'Staff';

  return (
    <div className="admin-app">
      <button className="admin-mobile-toggle" onClick={() => setOpen(v => !v)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <Link to="/" className="admin-brand" style={{ textDecoration: 'none' }} title="Resolve Home">
          <div className="admin-brand-mark"><Sparkles size={18} /></div>
          <div>
            <strong>Resolve</strong>
            <span>Staff Workspace</span>
          </div>
        </Link>

        <div className="admin-user-card">
          <div className="admin-avatar"><Activity size={18} /></div>
          <div className="admin-user-copy">
            <strong>{name}</strong>
            <span>Department staff</span>
          </div>
          <span className="online-dot" />
        </div>

        <div className="admin-nav-label">Workspace</div>
        <nav className="admin-nav">
          {nav.map(([to, label, Icon, end]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="system-status">
            <span><i /> System online</span>
            <Activity size={14} />
          </div>
          <button className="admin-logout" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-kicker">STAFF WORKSPACE / 2026</div>
            <div className="admin-top-title">Department grievance resolution queue</div>
          </div>
          <div className="admin-top-actions">
            <Link to="/" className="admin-home-btn" title="Back to Home Page">
              <Home size={15} />
              <span>Home</span>
            </Link>
            <div className="admin-top-profile">
              <span className="mini-avatar">{name[0].toUpperCase()}</span>
              <span>{name}</span>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
