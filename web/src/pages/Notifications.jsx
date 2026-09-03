import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function timeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function Notifications() {
  const { api, session } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await api('/notifications');
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  async function markRead(n) {
    if (n.read_at) return;
    try {
      // Assuming notifications are a type of message or use the same read endpoint
      await api(`/messages/${n.id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x));
    } catch (e) { console.error(e); }
  }

  return (
    <div className="admin-page">
      <div className="admin-toolbar" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Bell size={18} />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Notifications</h1>
        </div>
        
        <button className="admin-button secondary" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="skeleton-panel" style={{ height: '400px' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '48px' }}>
              <CheckCircle2 size={32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#4B5563' }}>All caught up!</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>You have no notifications.</div>
            </div>
          ) : notifications.map(n => (
            <div 
              key={n.id}
              onClick={() => markRead(n)}
              style={{
                backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 20px',
                borderLeft: !n.read_at ? '4px solid #F59E0B' : '1px solid #E5E7EB',
                cursor: !n.read_at ? 'pointer' : 'default',
                opacity: n.read_at ? 0.6 : 1,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: !n.read_at ? 700 : 500 }}>{n.title || 'Notification'}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#4B5563' }}>{n.body || n.message}</p>
                {n.complaint_id && (
                  <a 
                    href={session?.role === 'admin' ? `/admin/complaints/${n.complaint_id}` : `/user/complaints/${n.complaint_id}`} 
                    style={{ fontSize: '11px', color: '#2563EB', textDecoration: 'none', display: 'block', marginTop: '6px', fontWeight: 600 }}
                  >
                    View related item →
                  </a>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{timeAgo(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
