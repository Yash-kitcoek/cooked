import React from 'react';
import { CheckCircle2, Clock3, Layers3, RefreshCw, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { asArray } from '../admin/adminApi';
export function StaffHome() {
  const { api, setMessage } = useAuth();
  const [dashboard, setDashboard] = React.useState({});
  const [problems, setProblems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(async () => { setLoading(true); try { const [d, p] = await Promise.all([api('/staff/dashboard'), api('/staff/problems')]); setDashboard(d || {}); setProblems(asArray(p)); } catch (e) { setMessage(e.message || 'Unable to load staff dashboard.'); } finally { setLoading(false); } }, [api, setMessage]);
  React.useEffect(() => { load(); }, [load]);
  const value = (keys) => keys.reduce((v, k) => dashboard?.counts?.[k] ?? dashboard?.[k] ?? v, 0);
  return <div className="admin-page"><section className="admin-hero"><div><div className="eyebrow-neon">DEPARTMENT QUEUE</div><h1>Resolve the problems assigned to your team.</h1><p>Review AI-grouped problems and issue one coordinated solution to affected students.</p></div><button className="admin-button secondary" onClick={load}><RefreshCw size={15} /> Refresh</button></section><section className="admin-stat-grid"><Stat icon={Layers3} label="Core problems" value={value(['core_problems', 'total_problems'])} /><Stat icon={Clock3} label="Open" value={value(['open', 'open_problems'])} /><Stat icon={CheckCircle2} label="Resolved" value={value(['resolved', 'resolved_problems'])} /><Stat icon={Users} label="Affected" value={value(['affected_students', 'affected_users'])} /></section><section className="admin-panel"><div className="panel-heading"><div><div className="panel-eyebrow">WORK QUEUE</div><h2>Problems</h2></div></div><div className="problem-list compact">{problems.slice(0, 20).map(p => <Link className="problem-row" key={p.id || p.problem_id || p.problem_code} to={`/staff/problems/${encodeURIComponent(p.id || p.problem_id || p.problem_code)}`}><div className="problem-dot" /><div className="problem-main"><strong>{p.title || p.name || 'Core problem'}</strong><span>{p.department || 'Your department'} · {p.complaint_count ?? p.affected_users ?? 0} affected</span></div><span className="status-chip">{p.status || 'OPEN'}</span></Link>)}{!problems.length && <div className="empty-state">{loading ? 'Loading problems…' : 'No problems are assigned to this queue.'}</div>}</div></section></div>;
}
function Stat({ icon: Icon, label, value }) { return <div className="admin-stat-card"><div className="stat-icon"><Icon size={17} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>; }
