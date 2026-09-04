import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, X, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatElapsed(firstTime) {
  if (!firstTime) return '90 minutes';
  const diffMs = Date.now() - new Date(firstTime).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

export function EmergingAlertBanner({ refreshKey }) {
  const { api } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const stored = sessionStorage.getItem('dismissed_emerging_alerts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api('/alerts/emerging');
      if (Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err) {
      // Background alert fetch fails silently without disrupting the dashboard
      console.warn('Could not fetch emerging alerts:', err);
    }
  }, [api]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, refreshKey]);

  function handleDismiss(id) {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem('dismissed_emerging_alerts', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }

  const activeAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  if (!activeAlerts.length) return null;

  return (
    <div className="emerging-alerts-container" style={{ display: 'grid', gap: 12, marginBottom: 8 }}>
      {activeAlerts.map((alert) => {
        const timeSpan = formatElapsed(alert.first_complaint_time);
        return (
          <div
            key={alert.id}
            className="emerging-alert-card"
            style={{
              background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.95), rgba(254, 242, 242, 0.95))',
              border: '1.5px solid #F59E0B',
              borderRadius: 'var(--radius-card, 12px)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.16)',
              position: 'relative',
              animation: 'fadeIn .25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                }}
              >
                <AlertTriangle size={20} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span
                    style={{
                      background: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        display: 'inline-block',
                      }}
                    />
                    Emerging Incident
                  </span>

                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#92400E',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Zap size={11} />
                    {alert.velocity?.toFixed(1) || '0.0'} complaints/hr
                  </span>

                  <span style={{ fontSize: 11, color: '#78350F', fontWeight: 600 }}>
                    {alert.department}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#78350F',
                    lineHeight: 1.4,
                  }}
                >
                  ⚠ Emerging Incident: {alert.complaint_count} complaints about {alert.category || 'General'} in {alert.location || alert.department} in the last {timeSpan}.
                </div>

                {alert.title && (
                  <div style={{ fontSize: 12, color: '#92400E', marginTop: 3, opacity: 0.9 }}>
                    Cluster topic: <em>{alert.title}</em>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <Link
                to={`/staff/problems/${encodeURIComponent(alert.id)}`}
                style={{
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-btn, 8px)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background .15s',
                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#B45309')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#D97706')}
              >
                Investigate <ArrowRight size={13} />
              </Link>

              <button
                type="button"
                onClick={() => handleDismiss(alert.id)}
                title="Dismiss warning"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(180, 83, 9, 0.3)',
                  color: '#92400E',
                  width: 32,
                  height: 32,
                  minHeight: 32,
                  padding: 0,
                  borderRadius: 'var(--radius-btn, 8px)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  transition: 'background .15s, color .15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
