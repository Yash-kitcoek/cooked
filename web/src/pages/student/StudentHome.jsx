import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, ArrowRight, CheckCircle2, Clock3, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listStudentProblems } from '../../api/problems';

const countValue = (data, keys) => keys.reduce((value, key) => data?.counts?.[key] ?? data?.[key] ?? value, 0);
const priorityClass = (value) => String(value || 'low').toLowerCase();

export function StudentHome() {
  const { api, session, setMessage } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [summary, list, problemList] = await Promise.all([
        api('/students/me/dashboard'),
        api('/complaints'),
        listStudentProblems(api),
      ]);
      setDashboard(summary || {});
      setComplaints(Array.isArray(list) ? list : list?.items || list?.results || []);
      setProblems(problemList);
    } catch (error) { setMessage(error.message || 'Unable to load student dashboard.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [api]);

  const recent = [...complaints].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
  const groups = problems.slice(0, 4);
  const displayName = session?.username || session?.full_name || session?.email || 'Student';
  const stats = [
    ['Total', countValue(dashboard, ['total_complaints', 'total']), Activity],
    ['Open', countValue(dashboard, ['open_complaints', 'open']), AlertCircle],
    ['In progress', countValue(dashboard, ['in_progress']), Clock3],
    ['Resolved', countValue(dashboard, ['resolved_complaints', 'resolved']), CheckCircle2],
  ];

  return <div className="admin-page">
    <section className="student-hero"><div><div className="admin-kicker">STUDENT WORKSPACE</div><h1>Good to see you, {displayName}.</h1><p>Raise a grievance, follow its progress, and stay connected to the people resolving it.</p></div><Link to="/student/new" className="admin-button primary"><Plus size={15} /> Raise complaint</Link></section>
    <section className="student-stats">{stats.map(([label, value, Icon]) => <div className="student-stat" key={label}><div className="stat-icon"><Icon size={16} /></div><div className="stat-label">{label} complaints</div><div className="stat-value">{loading ? '…' : value}</div></div>)}</section>
    <div className="student-grid">
      <section className="student-panel"><div className="student-head"><div><div className="panel-eyebrow">ACTIVITY</div><h2>Recent complaints</h2></div><Link className="student-link" to="/student/complaints">View all <ArrowRight size={12} /></Link></div>
        {recent.length ? recent.map((complaint) => <Link className="student-row" key={complaint.id} to={`/student/complaints/${encodeURIComponent(complaint.id)}`}><i className="student-dot" /><div><strong>{complaint.title || 'Complaint'}</strong><span>{complaint.department || 'Department pending'} · {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '—'}</span></div><span className={`priority-badge ${priorityClass(complaint.priority)}`}>{complaint.priority || '—'}</span><ArrowRight size={14} /></Link>) : <div className="student-empty">No complaints yet. Your first report can start the workflow.</div>}
      </section>
      <section className="student-panel"><div className="student-head"><div><div className="panel-eyebrow">RESOLVE INTELLIGENCE</div><h2>Smart grievance intake</h2></div><Sparkles size={18} color="var(--accent, #5B4FE9)" /></div><div className="student-note"><Sparkles size={16} /><div><strong>You describe the problem.</strong> Resolve handles classification, priority, similarity detection and department routing automatically.</div></div><div className="student-process-list"><div><span>01</span> Submit the facts</div><div><span>02</span> Detect related problems</div><div><span>03</span> Group affected students around one core issue</div><div><span>04</span> Track the official resolution</div></div></section>
    </div>
    <section className="student-panel student-problems-preview"><div className="student-head"><div><div className="panel-eyebrow">CAMPUS PROBLEM DISCOVERY</div><h2>Existing problems</h2></div><Link className="student-link" to="/student/problems">Explore all <ArrowRight size={12} /></Link></div><p className="student-copy" style={{ marginTop: 2 }}>These are active core problems across the institution, including reports created by other students. Your own complaint history remains private.</p><div className="home-problem-list">{groups.length ? groups.map((problem) => <div className="home-problem-row" key={problem.id}><div className="home-problem-main"><span className="problem-code">{problem.problem_code || 'CORE PROBLEM'}</span><Link to={`/student/problems/${encodeURIComponent(problem.id)}`}><strong>{problem.title}</strong></Link><span>{problem.department || 'Department pending'} · {problem.affected_users ?? problem.complaint_count ?? 0} affected students · {problem.complaint_count ?? 0} reports</span></div><span className={`priority-badge ${priorityClass(problem.priority)}`}>{problem.priority || '—'}</span></div>) : <div className="student-empty">{loading ? 'Loading existing problems…' : 'No active institutional problems are currently available.'}</div>}</div></section>
  </div>;
}
