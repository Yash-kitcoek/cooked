import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, LogOut, Menu, X, Shield, Activity, ClipboardList, Mail, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import '../admin/admin.css';

const navItems = [
  { to: '/department', label: 'Problem Queue', icon: LayoutDashboard, end: true },
  { to: '/department/complaints', label: 'Complaints', icon: ClipboardList },
  { to: '/department/suggestions', label: 'Admin Suggestions', icon: MessageSquare },
  { to: '/department/inbox', label: 'Messages', icon: Mail },
  { to: '/department/notifications', label: 'Notifications', icon: Bell },
];

export function DepartmentLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <div className="admin-app">
      <button className="admin-mobile-toggle" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle navigation">
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <Logo />
        </div>

        <div className="admin-user-card">
          <div className="admin-avatar"><Shield size={18} /></div>
          <div className="admin-user-copy">
            <strong>{session?.username || session?.email || 'Staff Member'}</strong>
            <span>Department Staff</span>
          </div>
          <span className="online-dot" />
        </div>

        <div className="admin-nav-label">Workspace</div>
        <nav className="admin-nav" onClick={() => setMobileOpen(false)}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
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
            <div className="admin-kicker">DEPARTMENT DASHBOARD</div>
            <div className="admin-top-title">Staff grievance management</div>
          </div>
          <div className="admin-top-actions">
            <div className="admin-top-profile">
              <span className="mini-avatar">{(session?.username || 'S').slice(0, 1).toUpperCase()}</span>
              <span>{session?.username || 'Staff'}</span>
            </div>
          </div>
        </header>
        <div className="admin-content"><Outlet /></div>
      </main>
    </div>
  );
}
