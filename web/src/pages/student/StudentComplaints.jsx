import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const clean = (value) => String(value || '').toLowerCase();
const label = (value) => String(value || '—').replaceAll('_', ' ');

export function StudentComplaints() {
  const { api, setMessage } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    api('/complaints')
      .then((data) => setComplaints(Array.isArray(data) ? data : []))
      .catch((error) => setMessage(error.message));
  }, [api, setMessage]);

  const filtered = useMemo(() => complaints.filter((complaint) => {
    const haystack = `${complaint.title || ''} ${complaint.description || ''} ${complaint.department || ''}`.toLowerCase();
    return (status === 'all' || clean(complaint.status) === status) && haystack.includes(query.toLowerCase());
  }), [complaints, query, status]);

  return (
    <div className="admin-page">
      <section className="student-hero">
        <div>
          <div className="admin-kicker">MY COMPLAINTS</div>
          <h1>Your grievance history</h1>
          <p>One place for status, department, priority, solutions and feedback.</p>
        </div>
        <Link to="/student/new" className="admin-button primary"><Plus size={15} /> Raise complaint</Link>
      </section>

      <div className="admin-toolbar">
        <div className="search-wrap wide"><Search size={15} /><input placeholder="Search complaints…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="filter-wrap"><select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All status</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="escalated">Escalated</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
        </select></div>
      </div>

      <div className="student-cards">
        {filtered.length ? filtered.map((complaint) => (
          <Link className="student-card" to={`/student/complaints/${complaint.id}`} key={complaint.id}>
            <div className="student-card-top"><span className="student-card-code">{String(complaint.id).slice(0, 8).toUpperCase()}</span><span className={`priority-badge ${clean(complaint.priority)}`}>{complaint.priority || '—'}</span></div>
            <h2>{complaint.title}</h2>
            <p>{complaint.description || 'No description provided.'}</p>
            <div className="student-meta"><span>{complaint.department || 'Department pending'}</span><span>·</span><span>{label(complaint.status)}</span><span>·</span><span>{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '—'}</span><ArrowRight size={14} style={{ marginLeft: 'auto' }} /></div>
          </Link>
        )) : <div className="student-panel student-empty">No complaints match your search.</div>}
      </div>
    </div>
  );
}
