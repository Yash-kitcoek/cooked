import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Building2,
  Flame,
  Activity,
} from 'lucide-react';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

function slaColor(rate) {
  if (rate <= 0.05) return { dot: '#1E9E5A', bg: '#EAF7F0', label: 'Good', text: '#1E9E5A' };
  if (rate <= 0.15) return { dot: '#D98A1F', bg: '#FDF4E7', label: 'Watch', text: '#D98A1F' };
  return { dot: '#DC2626', bg: '#FEF2F2', label: 'At Risk', text: '#DC2626' };
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E7E8EE',
      borderRadius: '16px',
      padding: '28px 24px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        backgroundColor: '#EDEBFC', color: accent || '#5B4FE9',
        display: 'grid', placeItems: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.04em', color: '#0F0F14' }}>
          {value ?? '—'}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F0F14', marginTop: '2px' }}>{label}</div>
        {sub && <div style={{ fontSize: '12px', color: '#9CA0A8', marginTop: '3px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function SlaIndicator({ rate }) {
  const c = slaColor(rate);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '9999px',
      backgroundColor: c.bg, color: c.text,
      fontSize: '11px', fontWeight: 800,
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
      {c.label} · {(rate * 100).toFixed(1)}%
    </span>
  );
}

export function PublicDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // Deliberately NOT using useAuth().api — this endpoint requires NO token
      const res = await fetch(`${API}/public/stats`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      setError(e.message || 'Failed to load stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const lastUpdated = stats?.last_updated
    ? new Date(stats.last_updated).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  const maxTrending = stats?.trending_categories?.[0]?.count_last_7_days || 1;

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#F4F5FA', minHeight: '100vh', color: '#0F0F14' }}>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #E7E8EE',
        padding: '0 clamp(18px,4vw,60px)', height: '68px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg,#5B4FE9,#3D4FFF)',
            color: '#fff', fontWeight: 800, fontSize: '15px',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 10px rgba(91,79,233,0.3)',
          }}>R</div>
          <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em', color: '#0F0F14' }}>Resolve</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '9999px',
          backgroundColor: '#EDEBFC', color: '#5B4FE9', fontSize: '12px', fontWeight: 700,
        }}>
          <ShieldCheck size={14} />
          Departmental Dashboard
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btn-refresh-stats"
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE',
              color: '#0F0F14', fontSize: '12px', fontWeight: 700,
              cursor: refreshing ? 'wait' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link to="/login" style={{
            backgroundColor: '#5B4FE9', color: '#fff',
            padding: '8px 18px', borderRadius: '8px',
            fontSize: '12px', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(91,79,233,0.28)',
          }}>Sign In</Link>
        </div>
      </nav>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <header style={{
        backgroundColor: '#FFFFFF', borderBottom: '1px solid #E7E8EE',
        padding: '48px clamp(18px,4vw,60px) 40px',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '9999px',
            backgroundColor: '#EDEBFC', color: '#5B4FE9',
            fontSize: '11px', fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', marginBottom: '14px',
          }}>
            <Activity size={12} /> Live Data · No Login Required
          </div>
          <h1 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 10px 0', lineHeight: 1.1 }}>
            Departmental Dashboard
          </h1>
          <p style={{ fontSize: '15px', color: '#6B6F76', margin: 0, maxWidth: '680px', lineHeight: 1.65 }}>
            Aggregated complaint resolution data across all departments. No personal or identifying information is shown — only counts, averages, and response rates.
          </p>
          {lastUpdated && (
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#9CA0A8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} /> Last updated: {lastUpdated}
              <span style={{ marginLeft: '8px', padding: '2px 8px', backgroundColor: '#EAF7F0', color: '#1E9E5A', borderRadius: '9999px', fontSize: '11px', fontWeight: 700 }}>
                LIVE
              </span>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px clamp(18px,4vw,60px) 80px' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA0A8', fontSize: '15px' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <div>Loading live stats…</div>
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#FEF2F2', border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: '12px', padding: '24px', color: '#DC2626',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <AlertTriangle size={20} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Unable to load stats</div>
              <div style={{ fontSize: '13px', opacity: 0.8 }}>{error}</div>
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* ── OVERALL SUMMARY STRIP ─────────────────────────────────────── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5B4FE9', marginBottom: '16px' }}>
                Overall Summary
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
                <StatCard
                  icon={<AlertTriangle size={18} />}
                  label="Open Complaints"
                  value={stats.overall.total_open}
                  sub="Across all departments"
                  accent="#D98A1F"
                />
                <StatCard
                  icon={<CheckCircle2 size={18} />}
                  label="Resolved This Month"
                  value={stats.overall.total_resolved_this_month}
                  sub="Closed or resolved status"
                  accent="#1E9E5A"
                />
                <StatCard
                  icon={<Clock size={18} />}
                  label="Avg Resolution Time"
                  value={stats.overall.avg_resolution_hours != null ? `${stats.overall.avg_resolution_hours}h` : 'N/A'}
                  sub="Institution-wide average"
                  accent="#5B4FE9"
                />
              </div>
            </section>

            {/* ── DEPARTMENT GRID ───────────────────────────────────────────── */}
            <section style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5B4FE9', margin: 0 }}>
                  Department Breakdown
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', fontWeight: 700, color: '#6B6F76' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1E9E5A', display: 'inline-block' }} /> ≤ 5% breach
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D98A1F', display: 'inline-block' }} /> 5–15%
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626', display: 'inline-block' }} /> &gt;15%
                  </span>
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr repeat(4,1fr)',
                  gap: '0',
                  padding: '12px 24px',
                  borderBottom: '1px solid #F0F1F5',
                  backgroundColor: '#F8F9FC',
                  fontSize: '11px', fontWeight: 800, color: '#9CA0A8', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  <span>Department</span>
                  <span style={{ textAlign: 'center' }}>Open</span>
                  <span style={{ textAlign: 'center' }}>Resolved</span>
                  <span style={{ textAlign: 'center' }}>Avg Time</span>
                  <span style={{ textAlign: 'center' }}>SLA Status</span>
                </div>

                {stats.departments.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#9CA0A8', fontSize: '14px' }}>
                    No complaint data yet
                  </div>
                )}

                {stats.departments.map((dept, i) => (
                  <div
                    key={dept.name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr repeat(4,1fr)',
                      padding: '16px 24px',
                      borderBottom: i < stats.departments.length - 1 ? '1px solid #F0F1F5' : 'none',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFBFE'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        backgroundColor: '#EDEBFC', color: '#5B4FE9',
                        display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        <Building2 size={15} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{dept.name}</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 800, fontSize: '16px',
                        color: dept.open_count > 0 ? '#D98A1F' : '#9CA0A8',
                      }}>
                        {dept.open_count}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: '#1E9E5A' }}>
                        {dept.resolved_count}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '13px', color: '#6B6F76', fontWeight: 600 }}>
                      {dept.avg_resolution_hours != null ? `${dept.avg_resolution_hours}h` : '—'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <SlaIndicator rate={dept.sla_breach_rate} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── TRENDING CATEGORIES ───────────────────────────────────────── */}
            <section style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#5B4FE9', marginBottom: '16px' }}>
                Trending Issues — Last 7 Days
              </h2>

              {stats.trending_categories.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#9CA0A8', fontSize: '14px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E7E8EE' }}>
                  No complaints in the last 7 days
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE',
                  borderRadius: '16px', padding: '24px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  display: 'flex', flexDirection: 'column', gap: '14px',
                }}>
                  {stats.trending_categories.map((cat, i) => {
                    const pct = Math.round((cat.count_last_7_days / maxTrending) * 100);
                    return (
                      <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '22px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: '#9CA0A8', flexShrink: 0 }}>
                          #{i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F0F14' }}>{cat.category}</span>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#5B4FE9' }}>
                              {cat.count_last_7_days} complaints
                            </span>
                          </div>
                          <div style={{ height: '6px', backgroundColor: '#F0F1F5', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${pct}%`, height: '100%', borderRadius: '9999px',
                              background: i === 0
                                ? 'linear-gradient(90deg,#DC2626,#F87171)'
                                : i < 3
                                  ? 'linear-gradient(90deg,#D98A1F,#FBB955)'
                                  : 'linear-gradient(90deg,#5B4FE9,#8B83F5)',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── DISCLAIMER ───────────────────────────────────────────────────── */}
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E7E8EE',
          borderRadius: '12px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          fontSize: '12px', color: '#9CA0A8', lineHeight: 1.6,
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#1E9E5A' }} />
          <span>
            This dashboard displays <strong style={{ color: '#0F0F14' }}>aggregated, anonymized statistics only</strong>.
            No complaint content, student identities, staff names, or any personally identifiable information is shown or stored in this response.
            Data refreshes every 5 minutes from the live database.
          </span>
        </div>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #E7E8EE', backgroundColor: '#FFFFFF',
        padding: '28px clamp(18px,4vw,60px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#9CA0A8',
      }}>
        <span>© 2026 Resolve Platform · SIH-2026 Submission</span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ color: '#9CA0A8', textDecoration: 'none' }}>Home</Link>
          <Link to="/login" style={{ color: '#9CA0A8', textDecoration: 'none' }}>Sign In</Link>
          <a href="http://localhost:8000/docs#/public/public_stats_public_stats_get"
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#5B4FE9', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            API Docs <ExternalLink size={11} />
          </a>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
