import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Shield, BookOpen, Mail, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

export function UserLayout() {
  const { session } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'My Complaints', path: '/user/dashboard', icon: Shield },
    { name: 'My Profile', path: '/user/profile', icon: BookOpen },
    { name: 'Messages', path: '/user/messages', icon: Mail },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
        }}
      >
        {/* Logo */}
        <Logo style={{ marginBottom: '40px', padding: '0 8px' }} />

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isActive ? '#000000' : '#6B7280',
                  backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 8px', borderTop: '1px solid #E5E7EB', marginTop: 'auto' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#E5E7EB',
              color: '#4B5563',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {session?.username ? session.username.substring(0, 2).toUpperCase() : 'ST'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#000000', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {session?.username || 'Student User'}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Student
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar with bell icon */}
        <header style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 32px', backgroundColor: '#F9FAFB' }}>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <Bell size={20} />
          </button>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
