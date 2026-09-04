import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './admin.css';

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/problems', label: 'Core Problems', icon: Activity },
  { to: '/admin/complaints', label: 'Complaints', icon: ClipboardList },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/staff', label: 'Staff', icon: Users },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/profile', label: 'Admin Profile', icon: Settings },
];

export function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function signOut() {
    logout();
    navigate('/login');
  }

  return (
    <div className="admin-app">
      <button className="admin-mobile-toggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle admin navigation">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <Link to="/" className="admin-brand" style={{ textDecoration: 'none' }} title="Resolve Home">
          <div className="admin-brand-mark"><Sparkles size={18} /></div>
          <div>
            <strong>Resolve</strong>
            <span>Governance OS</span>
          </div>
        </Link>

        <div className="admin-user-card">
          <div className="admin-avatar"><ShieldCheck size={18} /></div>
          <div className="admin-user-copy">
            <strong>{session?.username || session?.email || 'Administrator'}</strong>
            <span>Administrator</span>
          </div>
          <span className="online-dot" />
        </div>

        <div className="admin-nav-label">Workspace</div>
        <nav className="admin-nav" onClick={() => setMobileOpen(false)}>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
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
          <button className="admin-logout" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-kicker">ADMIN CONSOLE / 2026</div>
            <div className="admin-top-title">Institutional grievance control center</div>
          </div>
          <div className="admin-top-actions">
            <Link to="/" className="admin-home-btn" title="Back to Home Page">
              <Home size={15} />
              <span>Home</span>
            </Link>
            <NavLink to="/admin/complaints" className="admin-top-link"><FileText size={15} /> Review complaints</NavLink>
            <div className="admin-top-profile">
              <span className="mini-avatar">{(session?.username || 'A').slice(0, 1).toUpperCase()}</span>
              <span>{session?.username || 'Admin'}</span>
            </div>
          </div>
        </header>
        <div className="admin-content"><Outlet /></div>
      </main>
    </div>
  );
}
