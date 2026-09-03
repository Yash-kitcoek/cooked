import React, { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const steps = ['Submitted', 'Department review', 'Action taken', 'Resolved'];
function stepIndex(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'open') return 1;
  if (['in_progress', 'escalated'].includes(value)) return 2;
  if (['resolved', 'closed'].includes(value)) return 3;
  return 0;
}

export function StudentComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, setMessage } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setComplaint(await api(`/complaints/${encodeURIComponent(id)}`));
    } catch (error) {
      setMessage(error.message || 'Unable to load complaint.');
      navigate('/student/complaints', { replace: true });
    }
  }

  useEffect(() => { load(); }, [id]);

  async function reopen() {
    setBusy(true);
    try {
      await api(`/complaints/${encodeURIComponent(id)}/reopen`, { method: 'POST' });
      setMessage('Complaint reopened.');
      await load();
    } catch (error) {
      setMessage(error.message || 'Could not reopen complaint.');
    } finally { setBusy(false); }
  }

  if (!complaint) return <div className="admin-page"><div className="skeleton-panel">Loading complaint…</div></div>;
  const current = stepIndex(complaint.status);
  const status = String(complaint.status || 'unknown');

  return <div className="admin-page">
    <section className="student-hero">
      <div>
        <Link className="student-link" to="/student/complaints"><ArrowLeft size={12} /> Back to complaints</Link>
        <div className="admin-kicker" style={{ marginTop: 14 }}>{String(complaint.id).slice(0, 8).toUpperCase()}</div>
        <h1>{complaint.title || 'Complaint'}</h1>
        <p>{complaint.department || 'Department pending'} · {complaint.created_at ? new Date(complaint.created_at).toLocaleString() : 'Date unavailable'}</p>
      </div>
      <span className={`priority-badge ${String(complaint.priority || 'low').toLowerCase()}`}>{complaint.priority || '—'}</span>
    </section>

    <div className="student-detail">
      <section className="student-panel">
        <div className="panel-eyebrow">YOUR REPORT</div>
        <h2>{complaint.category || 'Grievance'}</h2>
        <p className="student-copy" style={{ marginTop: 14 }}>{complaint.description || 'No description supplied.'}</p>
        <div className="student-meta"><span>Status: <b>{status.replaceAll('_', ' ')}</b></span>{complaint.problem_group_id && <><span>·</span><span>Problem group: <b>{String(complaint.problem_group_id).slice(0, 8)}</b></span></>}</div>
        {complaint.solution_text && <><div className="panel-eyebrow" style={{ marginTop: 24 }}>OFFICIAL SOLUTION</div><div className="student-solution" style={{ marginTop: 8 }}>{complaint.solution_text}</div></>}

        <div className="panel-eyebrow" style={{ marginTop: 24 }}>PROGRESS</div>
        <div className="student-timeline">
          {steps.map((step, index) => <div className={`timeline-item ${index < current ? 'done' : ''} ${index === current ? 'current' : ''}`} key={step}>
            <div><div className="timeline-dot" />{index < 3 && <div className="timeline-line" />}</div>
            <div><strong>{step}</strong><small>{index < current ? 'Completed' : index === current ? `Current: ${status.replaceAll('_', ' ')}` : 'Waiting'}</small></div>
          </div>)}
        </div>

        {['resolved', 'closed'].includes(status) && <div className="student-note" style={{ marginTop: 20 }}><strong>Need another review?</strong><button className="admin-button secondary" onClick={reopen} disabled={busy}><RotateCcw size={13} /> {busy ? 'Reopening…' : 'Reopen complaint'}</button></div>}
      </section>
    </div>
  </div>;
}
