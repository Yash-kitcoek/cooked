import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { asArray, groupComplaints } from './adminApi';

export function AdminProblemDetail() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  const [problem, setProblem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api('/admin/complaints').then((data) => {
      const groups = groupComplaints(asArray(data));
      setProblem(groups.find((p) => String(p.id) === String(id)) || null);
    }).catch((e) => setMessage(e.message || 'Unable to load problem.')).finally(() => setLoading(false));
  }, [api, id, setMessage]);

  if (loading) return <div className="admin-page"><div className="skeleton-panel">Loading core problem…</div></div>;
  if (!problem) return <div className="admin-page"><Link to="/admin/problems" className="back-link"><ArrowLeft size={15} /> Back</Link><div className="empty-state">Core problem not found.</div></div>;

  return <div className="admin-page"><Link to="/admin/problems" className="back-link"><ArrowLeft size={15} /> Back to core problems</Link><section className="detail-hero"><div><div className="eyebrow-neon">{problem.problem_code || `PROBLEM / ${String(id).slice(0, 8)}`}</div><h1>{problem.title}</h1><p>{problem.description || 'AI-grouped institutional issue.'}</p></div><span className={`priority-badge ${String(problem.priority || 'low').toLowerCase()}`}>{String(problem.priority || 'LOW').toUpperCase()}</span></section><section className="detail-stats"><Metric icon={Users} label="Grouped complaints" value={problem.complaint_count} /><Metric icon={FileText} label="Department" value={problem.department || 'Unassigned'} /><Metric icon={CheckCircle2} label="Status" value={String(problem.status || 'OPEN').replaceAll('_', ' ')} /></section><section className="admin-panel"><div className="panel-eyebrow">AI SUMMARY</div><h2>Institutional context</h2><p className="detail-copy">This admin view is derived from complaint records because the current FastAPI contract does not expose an admin-specific problem-group endpoint. Department staff continue to use the staff problem endpoint to issue solutions.</p><div className="ai-callout"><Sparkles size={17} /><span>One problem group can contain multiple student complaints.</span></div></section><section className="admin-panel"><div className="panel-heading"><div><div className="panel-eyebrow">EVIDENCE</div><h2>Related complaints</h2></div><span className="count-pill">{problem.complaints.length}</span></div><div className="complaint-mini-list">{problem.complaints.map(c => <Link className="complaint-mini" key={c.id} to={`/admin/complaints/${encodeURIComponent(c.id)}`}><span className="mono">#{String(c.id).slice(0, 8)}</span><strong>{c.title || 'Complaint'}</strong><span>{c.status || '—'}</span></Link>)}</div></section></div>;
}
function Metric({ icon: Icon, label, value }) { return <div className="detail-stat"><Icon size={16} /><span>{label}</span><strong>{value}</strong></div>; }
