import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Bell, ClipboardList, FilePlus2, GraduationCap, LayoutDashboard, LogOut, Menu, Sparkles, User, X, Users, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../admin/admin.css';
import './student.css';

const nav = [
  ['/student', 'Overview', LayoutDashboard, true],
  ['/student/problems', 'Existing Problems', Users],
  ['/student/complaints', 'My Complaints', ClipboardList],
  ['/student/new', 'Raise Complaint', FilePlus2],
  ['/student/profile', 'Profile', User],
  ['/student/notifications', 'Notifications', Bell],
];

export function StudentLayout() {
  const { session, logout } = useAuth();
  const navg = useNavigate();
  const [open, setOpen] = React.useState(false);
  const name = session?.username || session?.email || 'Student';

  return (
    <div className="admin-app student-app">
      <button className="admin-mobile-toggle" onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <Link to="/" className="admin-brand" style={{ textDecoration: 'none' }} title="Resolve Home">
          <div className="admin-brand-mark"><Sparkles size={18} /></div>
          <div>
            <strong>Resolve</strong>
            <span>Student Portal</span>
          </div>
        </Link>
        <div className="admin-user-card">
          <div className="admin-avatar"><GraduationCap size={18} /></div>
          <div className="admin-user-copy">
            <strong>{name}</strong>
            <span>Student account</span>
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
          <button className="admin-logout" onClick={() => { logout(); navg('/login'); }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-kicker">STUDENT PORTAL / 2026</div>
            <div className="admin-top-title">Your complaints, progress and resolutions</div>
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
