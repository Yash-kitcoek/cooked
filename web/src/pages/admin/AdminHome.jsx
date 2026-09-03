import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, Clock3, Layers3, UsersRound, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { asArray, normalizeDashboard, groupComplaints } from './adminApi';

export function AdminHome() {
  const { api, setMessage } = useAuth();
  const [data, setData] = React.useState({ stats: normalizeDashboard(), complaints: [] });
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, complaintData] = await Promise.all([api('/admin/dashboard'), api('/admin/complaints')]);
      const complaints = asArray(complaintData);
      const groups = groupComplaints(complaints);
      setData({ stats: normalizeDashboard(dashboard, complaints, groups), complaints });
    } catch (error) { setMessage(error.message || 'Unable to load admin dashboard.'); }
    finally { setLoading(false); }
  }, [api, setMessage]);

  React.useEffect(() => { load(); }, [load]);
  const s = data.stats;
  const groups = groupComplaints(data.complaints).slice(0, 5);
  const statCards = [
    { label: 'Core problems', value: s.core_problems, icon: Layers3, note: 'Grouped from complaint records' },
    { label: 'Open complaints', value: s.open, icon: Clock3, note: 'Awaiting active resolution' },
    { label: 'Resolved', value: s.resolved, icon: CheckCircle2, note: 'Resolved or closed' },
    { label: 'Affected students', value: s.affected_students || '—', icon: UsersRound, note: 'Reported by dashboard' },
  ];

  return <div className="admin-page">
    <section className="admin-hero"><div><div className="eyebrow-neon">CONTROL / OVERVIEW</div><h1>Good to see you, Administrator.</h1><p>Monitor complaints and the problem groups produced by the grievance pipeline.</p></div><button className="admin-button secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh</button></section>
    <section className="admin-stat-grid">{statCards.map(({ label, value, icon: Icon, note }) => <div className="admin-stat-card" key={label}><div className="stat-icon"><Icon size={17} /></div><div className="stat-label">{label}</div><div className="stat-value">{loading ? '…' : value}</div><div className="stat-note">{note}</div></div>)}</section>
    <div className="admin-grid-2">
      <section className="admin-panel"><div className="panel-heading"><div><div className="panel-eyebrow">AI TRIAGE</div><h2>Core problems</h2></div><Link to="/admin/problems" className="panel-link">View all <ArrowUpRight size={14} /></Link></div><div className="problem-list compact">{groups.length ? groups.map((p) => <Link className="problem-row" key={p.id} to={`/admin/problems/${encodeURIComponent(p.id)}`}><div className="problem-dot" /><div className="problem-main"><strong>{p.title}</strong><span>{p.department || 'Unassigned'} · {p.complaint_count} complaints</span></div><PriorityBadge value={p.priority} /><ArrowUpRight size={15} /></Link>) : <Empty text={loading ? 'Loading complaint groups…' : 'No complaint groups returned yet.'} />}</div></section>
      <section className="admin-panel attention-panel"><div className="panel-heading"><div><div className="panel-eyebrow">ATTENTION</div><h2>Resolution health</h2></div></div><div className="health-metric"><span>Open workload</span><strong>{s.open}</strong></div><div className="health-bar"><span style={{ width: `${Math.min(100, s.total ? (s.open / s.total) * 100 : 0)}%` }} /></div><div className="health-metric"><span>In progress</span><strong>{s.in_progress}</strong></div><div className="health-metric"><span>Overdue</span><strong className={s.overdue ? 'danger-text' : ''}>{s.overdue}</strong></div>{s.overdue > 0 && <div className="alert-box"><AlertTriangle size={16} /><span>{s.overdue} item(s) need attention.</span></div>}</section>
    </div>
    <section className="admin-panel"><div className="panel-heading"><div><div className="panel-eyebrow">PIPELINE</div><h2>Operational flow</h2></div></div><div className="workflow-grid">{['Student complaint', 'AI grouping', 'Department routing', 'Staff solution', 'Student resolution'].map((item, i) => <div className="workflow-step" key={item}><span>0{i + 1}</span><strong>{item}</strong>{i < 4 && <ArrowUpRight size={14} />}</div>)}</div></section>
  </div>;
}
function PriorityBadge({ value }) { const v = String(value || 'LOW').toUpperCase(); return <span className={`priority-badge ${v.toLowerCase()}`}>{v}</span>; }
function Empty({ text }) { return <div className="empty-state">{text}</div>; }
