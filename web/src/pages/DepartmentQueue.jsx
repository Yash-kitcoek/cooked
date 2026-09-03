import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, RefreshCw, AlertTriangle, Clock, CheckCircle, Zap } from 'lucide-react';

// ─── Priority colour system ────────────────────────────────────────────────────
function priorityBand(score) {
  if (score >= 90) return { label: 'CRITICAL', color: '#DC2626', bg: '#FEF2F2', textColor: '#FFFFFF' };
  if (score >= 75) return { label: 'HIGH',     color: '#EA580C', bg: '#FFF7ED', textColor: '#FFFFFF' };
  if (score >= 50) return { label: 'MEDIUM',   color: '#D97706', bg: '#FFFBEB', textColor: '#FFFFFF' };
  return              { label: 'LOW',      color: '#6B7280', bg: '#F9FAFB', textColor: '#FFFFFF' };
}

// ─── Score → bar colour ───────────────────────────────────────────────────────
function scoreColor(score) {
  if (score >= 70) return '#DC2626'; // red
  if (score >= 40) return '#D97706'; // amber
  return '#16A34A';                  // green
}

// ─── SLA helpers ──────────────────────────────────────────────────────────────
const SLA_HOURS = 48;
function slaInfo(createdAt) {
  const deadline = new Date(new Date(createdAt).getTime() + SLA_HOURS * 3600 * 1000);
  const hoursLeft = Math.round((deadline - Date.now()) / 3600000);
  return { hoursLeft, overdue: hoursLeft <= 0 };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DepartmentQueue() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [problems,      setProblems]      = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [takingAction,  setTakingAction]  = useState({}); // { [problemId]: true }
  const [dismissedAlert, setDismissedAlert] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [probs, dashboardStats] = await Promise.all([
        api('/staff/problems'),
        api('/dashboard/department'),
      ]);
      setProblems(probs || []);
      setStats(dashboardStats || { open: 0, in_progress: 0, escalated: 0, resolved: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── "Take it" — transition all complaints to in_progress ───────────────────
  async function takeIt(group) {
    setTakingAction(prev => ({ ...prev, [group.id]: true }));
    try {
      const detail = await api(`/staff/problems/${group.id}`);
      const complaints = detail?.complaints || [];
      await Promise.all(
        complaints
          .filter(c => c.status === 'open')
          .map(c => api(`/complaints/${c.id}/transition`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'in_progress' }),
          }))
      );
      await loadData(true);
    } catch (e) {
      console.error('Take it failed:', e);
    } finally {
      setTakingAction(prev => ({ ...prev, [group.id]: false }));
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const overdueProblemCount = problems.filter(p => slaInfo(p.created_at).overdue).length;

  const totalApplications   = stats ? (stats.open + stats.in_progress + stats.escalated + stats.resolved) : 0;
  const pendingApplications = stats ? (stats.open + stats.in_progress) : 0;
  const urgentApplications  = problems.filter(p => p.priority_score >= 90).length;
  const resolvedApplications = stats ? stats.resolved : 0;

  const distribution = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  problems.forEach(p => { distribution[priorityBand(p.priority_score).label]++; });

  const filteredProblems = problems
    .filter(p => {
      const matchSearch   = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPriority = priorityFilter === 'All' || priorityBand(p.priority_score).label === priorityFilter;
      const matchStatus   = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchPriority && matchStatus;
    })
    .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  // ── Stat card config ────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Applications', value: totalApplications,   accent: '#6B7280', icon: CheckCircle },
    { label: 'Pending',      value: pendingApplications, accent: '#D97706', icon: Clock },
    { label: 'Urgent',       value: urgentApplications,  accent: '#DC2626', icon: Zap },
    { label: 'Resolved',     value: resolvedApplications,accent: '#16A34A', icon: CheckCircle },
  ];

  // ── Status tabs ─────────────────────────────────────────────────────────────
  const statusTabs = [
    { key: 'all',         label: 'All',         count: problems.length },
    { key: 'open',        label: 'Open',        count: problems.filter(p => p.status === 'open').length },
    { key: 'in_progress', label: 'In Progress', count: problems.filter(p => p.status === 'in_progress').length },
    { key: 'resolved',    label: 'Resolved',    count: problems.filter(p => p.status === 'resolved').length },
  ];

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="admin-page">
        <div className="empty-state skeleton-panel" style={{ height: '60px', marginBottom: '16px' }} />
        <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
          {[0,1,2,3].map(i => <div key={i} className="skeleton-panel" />)}
        </div>
        <div className="skeleton-panel" style={{ height: '160px' }} />
      </div>
    );
  }

  return (
    <div className="admin-page">

      {/* ── Overdue Alert Banner ── */}
      {overdueProblemCount > 0 && !dismissedAlert && (
        <div className="alert-box" style={{
          backgroundColor: '#FEF2F2',
          borderLeft: '4px solid #DC2626',
          color: '#991B1B',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} color="#DC2626" />
            <strong style={{ fontSize: '12px' }}>
              {overdueProblemCount} complaint{overdueProblemCount > 1 ? 's are' : ' is'} overdue — SLA breached. Take action immediately.
            </strong>
          </div>
          <button
            onClick={() => setDismissedAlert(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', fontSize: '18px', lineHeight: 1, padding: 0 }}
          >×</button>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="admin-toolbar">
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="All">All priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
        <button
          className="admin-button secondary"
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={{ gap: '6px', minWidth: '100px' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Status Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: '.15s',
              backgroundColor: statusFilter === tab.key ? '#000000' : 'transparent',
              color:           statusFilter === tab.key ? '#ffffff' : '#777a86',
            }}
          >
            {tab.label}
            <span style={{
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              backgroundColor: statusFilter === tab.key ? 'rgba(255,255,255,0.2)' : '#e7e8ef',
              color: statusFilter === tab.key ? '#fff' : '#555',
              fontSize: '9px',
              fontWeight: 900,
              display: 'grid',
              placeItems: 'center',
              padding: '0 4px',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Stat Cards ── */}
      <div className="admin-stat-grid" style={{ marginBottom: '8px' }}>
        {statCards.map((stat, idx) => (
          <div key={idx} className="admin-stat-card" style={{ borderLeft: `4px solid ${stat.accent}` }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.accent}18`, color: stat.accent }}>
              <stat.icon size={16} />
            </div>
            <div className="stat-label" style={{ marginBottom: '4px' }}>{stat.label}</div>
            <div className="stat-value" style={{ color: stat.accent }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── Priority Distribution ── */}
      <section className="admin-panel" style={{ marginBottom: '24px' }}>
        <div className="panel-heading">
          <div><div className="panel-eyebrow">DISTRIBUTION</div><h2>Priority Tracking</h2></div>
        </div>
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
          {Object.entries(distribution).map(([label, count]) => {
            const band = priorityBand(label === 'CRITICAL' ? 90 : label === 'HIGH' ? 75 : label === 'MEDIUM' ? 50 : 0);
            return (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '100%', height: '100px',
                  backgroundColor: band.bg,
                  borderRadius: '8px', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: `${problems.length ? (count / problems.length) * 100 : 0}%`,
                    backgroundColor: band.color,
                    transition: 'height 0.4s ease'
                  }} />
                </div>
                <div style={{ marginTop: '10px', fontWeight: 800, fontSize: '11px', color: band.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ color: '#9295a0', fontSize: '10px', fontWeight: 500, marginTop: '2px' }}>{count} problems</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Problem Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredProblems.map(group => {
          const band  = priorityBand(group.priority_score || 0);
          const sla   = slaInfo(group.created_at);
          const isTaking = !!takingAction[group.id];

          return (
            <div key={group.id} className="problem-card" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px' }}>

              {/* ── Left: Info ── */}
              <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="problem-code" style={{ color: band.color }}>{group.problem_code || group.id.slice(0, 12).toUpperCase()}</div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '999px',
                    backgroundColor: band.color, color: '#fff',
                    fontSize: '9px', fontWeight: 900, letterSpacing: '0.06em',
                  }}>{band.label}</span>
                </div>

                {/* SLA Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '3px 8px', borderRadius: '6px', width: 'fit-content',
                  backgroundColor: sla.overdue ? '#FEF2F2' : '#F3F4F6',
                  color: sla.overdue ? '#DC2626' : '#6B7280',
                  fontSize: '10px', fontWeight: 700,
                  ...(sla.overdue ? { animation: 'none' } : {}),
                }}>
                  <Clock size={10} />
                  {sla.overdue ? `Overdue by ${Math.abs(sla.hoursLeft)}h` : `${sla.hoursLeft}h left`}
                </div>

                <h2 style={{ fontSize: '16px', margin: 0, letterSpacing: '-0.02em', color: '#000', fontWeight: 800, lineHeight: 1.3 }}>
                  {group.title}
                </h2>
                <div style={{ fontSize: '11px', color: '#9295a0', fontWeight: 500 }}>
                  {group.complaint_count} complaint{group.complaint_count !== 1 ? 's' : ''} · {group.affected_users} student{group.affected_users !== 1 ? 's' : ''} affected
                </div>
              </div>

              {/* ── Middle: Bars ── */}
              <div style={{ flex: 1, padding: '0 32px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid #e7e8ef', borderRight: '1px solid #e7e8ef' }}>
                {[
                  { label: 'Urgency', score: group.urgency_score || 0 },
                  { label: 'Impact',  score: group.impact_score  || 0 },
                ].map(({ label, score }) => {
                  const barColor = scoreColor(score);
                  return (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#a0a2ad', letterSpacing: '0.05em' }}>{label}</span>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: barColor, lineHeight: 1 }}>
                          {score}<span style={{ fontSize: '10px', color: '#a0a2ad', fontWeight: 600 }}>/100</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#eef0f4', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${score}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Right: Actions ── */}
              <div style={{ width: '140px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/department/problems/${group.id}/students`)}
                  className="admin-button secondary"
                  style={{ fontSize: '11px', width: '100%' }}
                >
                  View Students
                </button>
                {group.status === 'open' && (
                  <button
                    onClick={() => takeIt(group)}
                    disabled={isTaking}
                    className="admin-button"
                    style={{
                      fontSize: '11px', width: '100%',
                      backgroundColor: '#D97706', color: '#fff',
                      border: 'none',
                      opacity: isTaking ? 0.7 : 1,
                      cursor: isTaking ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    {isTaking ? <><RefreshCw size={11} className="spin" /> Working…</> : <>Take it →</>}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/department/problems/${group.id}/resolve`)}
                  className="admin-button primary"
                  style={{ fontSize: '11px', width: '100%' }}
                >
                  View & Resolve
                </button>
              </div>

            </div>
          );
        })}

        {filteredProblems.length === 0 && (
          <div className="empty-state" style={{ padding: '48px', fontSize: '13px' }}>
            No problems match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
