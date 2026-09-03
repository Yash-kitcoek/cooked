import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, RefreshCw, Clock, MessageSquare, CheckCircle2, Send, X } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

const STATUS_MAP = {
  open:        { bg: '#FEF2F2', color: '#DC2626', label: 'Open' },
  in_progress: { bg: '#FFF7ED', color: '#EA580C', label: 'In Progress' },
  resolved:    { bg: '#F0FDF4', color: '#16A34A', label: 'Resolved' },
  closed:      { bg: '#F3F4F6', color: '#6B7280', label: 'Closed' },
};

// ── Mini solution modal ──────────────────────────────────────────────────────
function SolutionModal({ complaint, api, onClose, onSaved }) {
  const [text, setText] = useState(complaint.solution_text || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api(`/complaints/${complaint.id}/solution`, {
        method: 'PUT',
        body: JSON.stringify({ solution: text }),
      });
      // Also transition to resolved if still open
      if (complaint.status !== 'resolved') {
        try {
          await api(`/complaints/${complaint.id}/transition`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'resolved' }),
          });
        } catch { /* transition may fail if already resolved */ }
      }
      onSaved();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: 'min(520px, 95vw)', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#9295a0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resolve Complaint</div>
            <h2 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800 }}>{complaint.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9295a0' }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>Student: <strong>{complaint.student_name}</strong> · {complaint.student_prn}</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type the resolution / solution for this specific complaint…"
          rows={6}
          style={{ width: '100%', padding: '12px', border: '1px solid #e7e8ef', borderRadius: '10px', fontSize: '13px', outline: 'none', resize: 'vertical', marginTop: '12px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', border: '1px solid #e7e8ef', borderRadius: '8px', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancel</button>
          <button
            onClick={save}
            disabled={saving || !text.trim()}
            style={{ padding: '9px 18px', backgroundColor: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            {saving ? <RefreshCw size={13} className="spin" /> : <Send size={13} />}
            {saving ? 'Saving…' : 'Save & Resolve'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mini assign modal ────────────────────────────────────────────────────────
function AssignModal({ complaint, api, onClose, onAssigned }) {
  const [staffId, setStaffId] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!staffId.trim()) return;
    setSaving(true);
    try {
      await api(`/complaints/${complaint.id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigned_to_id: parseInt(staffId, 10) }),
      });
      onAssigned();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: 'min(400px, 95vw)', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#9295a0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reassign Complaint</div>
            <h2 style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800 }}>{complaint.title}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9295a0' }}><X size={18} /></button>
        </div>
        <input
          value={staffId}
          onChange={e => setStaffId(e.target.value)}
          placeholder="Enter Staff User ID"
          style={{ width: '100%', padding: '12px', border: '1px solid #e7e8ef', borderRadius: '10px', fontSize: '13px', outline: 'none', marginTop: '12px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', border: '1px solid #e7e8ef', borderRadius: '8px', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancel</button>
          <button
            onClick={save}
            disabled={saving || !staffId.trim()}
            style={{ padding: '9px 18px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            {saving ? <RefreshCw size={13} className="spin" /> : <Send size={13} />}
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function StaffComplaints() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [complaints,   setComplaints]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolveModal, setResolveModal] = useState(null); // complaint object
  const [assignModal, setAssignModal]   = useState(null); // complaint object

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await api('/staff/complaints');
      setComplaints(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  async function quickTransition(complaint, status) {
    try {
      await api(`/complaints/${complaint.id}/transition`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load(true);
    } catch (e) { console.error(e); }
  }

  const filtered = complaints.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        (c.student_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    in_progress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="admin-page">

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search size={14} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or student name…"
          />
        </div>
        <button className="admin-button secondary" onClick={() => load(true)} disabled={refreshing} style={{ gap: '6px' }}>
          <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {[
          { key: 'all',         label: 'All' },
          { key: 'open',        label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'resolved',    label: 'Resolved' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setStatusFilter(t.key)}
            style={{
              padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: 700,
              backgroundColor: statusFilter === t.key ? '#000' : 'transparent',
              color:           statusFilter === t.key ? '#fff' : '#777a86',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {t.label}
            <span style={{ minWidth: '18px', height: '18px', borderRadius: '999px', backgroundColor: statusFilter === t.key ? 'rgba(255,255,255,0.2)' : '#e7e8ef', color: statusFilter === t.key ? '#fff' : '#555', fontSize: '9px', fontWeight: 900, display: 'grid', placeItems: 'center', padding: '0 4px' }}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="skeleton-panel" style={{ height: '300px' }} />
      ) : (
        <div className="admin-table-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Student</th>
                <th>Status</th>
                <th>SLA Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="empty-state">No complaints match this filter.</td></tr>
              )}
              {filtered.map(c => {
                const st = STATUS_MAP[c.status] || STATUS_MAP.open;
                const slaDate = new Date(c.sla_due_at);
                const overdue = slaDate < new Date() && c.status !== 'resolved';
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#000' }}>{c.title}</div>
                      <div className="table-sub">{c.description}</div>
                      <div style={{ fontSize: '10px', color: '#9295a0', marginTop: '4px' }}>
                        {c.department} · Submitted {timeAgo(c.created_at)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '12px' }}>{c.student_name || '—'}</div>
                      <div className="table-sub">{c.student_prn} · Div {c.student_division} · Roll {c.student_roll_no}</div>
                    </td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: '999px', backgroundColor: st.bg, color: st.color, fontSize: '9px', fontWeight: 900, letterSpacing: '0.05em' }}>
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: overdue ? '#DC2626' : '#6B7280', fontWeight: overdue ? 700 : 400 }}>
                        <Clock size={11} />
                        {overdue ? 'Overdue' : slaDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {c.status === 'open' && (
                          <button className="admin-button" onClick={() => quickTransition(c, 'in_progress')} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#1F2937', color: '#fff', border: 'none' }}>
                            Take It
                          </button>
                        )}
                        {(c.status === 'open' || c.status === 'in_progress') && (
                          <>
                            <button className="admin-button secondary" onClick={() => setAssignModal(c)} style={{ padding: '6px 12px', fontSize: '11px' }}>
                              Assign
                            </button>
                            <button className="admin-button" onClick={() => setResolveModal(c)} style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: '#16A34A', color: '#fff', border: 'none' }}>
                              Resolve
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/department/problems/${c.problem_group_id}/resolve`)}
                          className="admin-button secondary"
                          style={{ fontSize: '10px' }}
                        >
                          View Group
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {resolveModal && (
        <SolutionModal
          complaint={resolveModal}
          api={api}
          onClose={() => setResolveModal(null)}
          onSaved={() => load(true)}
        />
      )}

      {assignModal && (
        <AssignModal
          complaint={assignModal}
          api={api}
          onClose={() => setAssignModal(null)}
          onAssigned={() => load(true)}
        />
      )}
    </div>
  );
}
