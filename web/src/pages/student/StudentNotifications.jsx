import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function StudentNotifications() {
  const { api, setMessage } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/complaints').then((data) => setComplaints(Array.isArray(data) ? data : data?.items || []))
      .catch((error) => setMessage(error.message || 'Unable to load updates.'))
      .finally(() => setLoading(false));
  }, [api, setMessage]);

  const updates = complaints.filter((c) => c.solution_text || ['resolved', 'closed', 'in_progress', 'escalated'].includes(String(c.status).toLowerCase())).slice(0, 10);
  return <div className="admin-page">
    <section className="student-hero"><div><div className="admin-kicker">UPDATES</div><h1>Stay in the loop.</h1><p>The current backend does not expose a notifications route, so this page derives updates from your complaint records.</p></div></section>
    <section className="student-panel">
      <div className="student-head"><div><div className="panel-eyebrow">ACTIVITY</div><h2>Recent updates</h2></div><Bell size={18} color="#3d4fff" /></div>
      {loading ? <div className="student-empty">Loading updates…</div> : updates.length ? updates.map((x) => <div className="notice" key={x.id}><strong>{x.title || 'Complaint update'}</strong><p>Status: {String(x.status || 'unknown').replaceAll('_', ' ')}{x.solution_text ? ` · ${x.solution_text}` : ''}</p></div>) : <div className="student-empty">No updates yet.</div>}
    </section>
  </div>;
}
