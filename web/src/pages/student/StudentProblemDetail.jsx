import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentProblem, reportStudentProblem } from '../../api/problems';

export function StudentProblemDetail() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setProblem(await getStudentProblem(api, id)); }
    catch (error) { setMessage(error.message || 'Unable to load problem.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id, api]);

  async function report() {
    if (!problem || problem.already_reported || reporting) return;
    setReporting(true);
    try {
      const result = await reportStudentProblem(api, id);
      setMessage(result?.message || 'Your complaint has been linked to this problem.');
      await load();
      if (result?.complaint_id) navigate(`/student/complaints/${encodeURIComponent(result.complaint_id)}`);
    } catch (error) { setMessage(error.message || 'Could not join this problem.'); }
    finally { setReporting(false); }
  }

  if (loading) return <div className="admin-page"><div className="skeleton-panel">Loading problem…</div></div>;
  if (!problem) return <div className="admin-page"><Link to="/student/problems" className="back-link"><ArrowLeft size={15} /> Back</Link><div className="empty-state">This problem is not currently active or could not be found.</div></div>;

  return <div className="admin-page">
    <Link to="/student/problems" className="back-link"><ArrowLeft size={15} /> Back to existing problems</Link>
    <section className="detail-hero"><div><div className="eyebrow-neon">{problem.problem_code || 'PROBLEM GROUP'}</div><h1>{problem.title}</h1><p>{problem.description || 'No description supplied.'}</p></div><span className={`priority-badge ${String(problem.priority || 'low').toLowerCase()}`}>{problem.priority || '—'}</span></section>
    <section className="detail-stats"><Metric icon={Users} label="Affected students" value={problem.affected_users ?? 0} /><Metric icon={FileText} label="Reports" value={problem.complaint_count ?? 0} /><Metric icon={FileText} label="Department" value={problem.department || 'Pending'} /><Metric icon={CheckCircle2} label="Status" value={String(problem.status || 'open').replaceAll('_', ' ')} /></section>
    <section className="admin-panel"><div className="panel-eyebrow">YOUR CONNECTION TO THIS PROBLEM</div><p>{problem.already_reported ? `You have already reported this problem (${String(problem.my_complaint_status || 'active').replaceAll('_', ' ')}).` : 'You have not reported this problem yet. If you are affected by the same issue, join the existing problem instead of creating a duplicate.'}</p><div className="student-actions"><Link className="admin-button secondary" to="/student/problems">Back</Link>{problem.already_reported ? <Link className="admin-button primary" to={`/student/complaints/${encodeURIComponent(problem.my_complaint_id)}`}>View my complaint</Link> : <button className="admin-button primary" onClick={report} disabled={reporting}>{reporting ? 'Linking…' : 'I have this problem too'}</button>}</div></section>
    {problem.solution_text && <section className="admin-panel"><div className="panel-eyebrow">OFFICIAL RESOLUTION</div><p>{problem.solution_text}</p>{problem.solution_at && <small>Resolved {new Date(problem.solution_at).toLocaleString()}</small>}</section>}
  </div>;
}
function Metric({ icon: Icon, label, value }) { return <div className="detail-stat"><Icon size={16} /><span>{label}</span><strong>{value}</strong></div>; }
