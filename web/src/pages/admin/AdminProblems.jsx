import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { asArray, groupComplaints } from './adminApi';

export function AdminProblems() {
  const { api, setMessage } = useAuth();
  const [complaints, setComplaints] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [priority, setPriority] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setComplaints(asArray(await api('/admin/complaints'))); }
    catch (e) { setMessage(e.message || 'Unable to load complaints.'); }
    finally { setLoading(false); }
  }, [api, setMessage]);
  React.useEffect(() => { load(); }, [load]);

  const problems = groupComplaints(complaints);
  const filtered = problems.filter((p) => {
    const text = `${p.title} ${p.problem_code || ''} ${p.department || ''}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (priority === 'all' || String(p.priority || '').toLowerCase() === priority) && (status === 'all' || String(p.status || '').toLowerCase() === status);
  });

  return <div className="admin-page"><section className="admin-hero page-hero"><div><div className="eyebrow-neon">AI-GROUPED ISSUES</div><h1>Core problems</h1><p>Groups are built from problem_group_id values returned by the current admin complaint API.</p></div><button className="admin-button secondary" onClick={load} disabled={loading}><RefreshCw size={15} /> Refresh</button></section><section className="admin-toolbar"><div className="search-wrap"><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search problem, code, or department…" /></div><div className="filter-wrap"><SlidersHorizontal size={15} /><select value={priority} onChange={e => setPriority(e.target.value)}><option value="all">All priorities</option><option value="critical">Critical</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">All status</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div></section><section className="problem-list large">{filtered.map(p => <Link className="problem-card" key={p.id} to={`/admin/problems/${encodeURIComponent(p.id)}`}><div className="problem-card-top"><span className="problem-code">{p.problem_code || `GROUP-${String(p.id).slice(0, 8)}`}</span><PriorityBadge value={p.priority} /></div><h2>{p.title}</h2><p>{p.description || 'Grouped complaints indicate a shared institutional issue.'}</p><div className="problem-meta"><span><strong>{p.complaint_count}</strong> complaints</span><span>{p.department || 'Unassigned'}</span><span>{String(p.status || 'OPEN').replaceAll('_', ' ')}</span><ArrowUpRight size={16} /></div></Link>)}{!filtered.length && <div className="empty-state panel-empty">{loading ? 'Loading core problems…' : 'No core problems match these filters.'}</div>}</section></div>;
}
function PriorityBadge({ value }) { const v = String(value || 'LOW').toUpperCase(); return <span className={`priority-badge ${v.toLowerCase()}`}>{v}</span>; }
