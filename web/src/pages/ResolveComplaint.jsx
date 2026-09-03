import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Users, MessageSquare, Clock, CheckCircle2,
  AlertCircle, Send, RefreshCw, ChevronDown, ChevronUp,
  Activity, User, Shield
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusPill(status) {
  const map = {
    open:        { bg: '#FEF2F2', color: '#DC2626', label: 'Open' },
    in_progress: { bg: '#FFF7ED', color: '#EA580C', label: 'In Progress' },
    resolved:    { bg: '#F0FDF4', color: '#16A34A', label: 'Resolved' },
    closed:      { bg: '#F3F4F6', color: '#6B7280', label: 'Closed' },
  };
  return map[status] || map.open;
}

function timeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ─── Complaint panel (per individual complaint) ───────────────────────────────
function ComplaintPanel({ complaint, api, onRefresh }) {
  const [expanded,  setExpanded]  = useState(false);
  const [comments,  setComments]  = useState([]);
  const [timeline,  setTimeline]  = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [sending,   setSending]   = useState(false);
  const [tab,       setTab]       = useState('comments'); // 'comments' | 'timeline'
  const [loadingDetails, setLoadingDetails] = useState(false);

  const pill = statusPill(complaint.status);

  async function loadDetails() {
    if (loadingDetails) return;
    setLoadingDetails(true);
    try {
      const [c, t] = await Promise.all([
        api(`/complaints/${complaint.id}/comments`),
        api(`/complaints/${complaint.id}/timeline`),
      ]);
      setComments(c || []);
      setTimeline(t || []);
    } catch (e) { console.error(e); }
    finally { setLoadingDetails(false); }
  }

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && comments.length === 0 && timeline.length === 0) loadDetails();
  }

  async function postComment() {
    if (!commentBody.trim()) return;
    setSending(true);
    try {
      const c = await api(`/complaints/${complaint.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentBody }),
      });
      setComments(prev => [...prev, c]);
      setCommentBody('');
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  }

  async function transitionStatus(status) {
    try {
      await api(`/complaints/${complaint.id}/transition`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await onRefresh();
      await loadDetails();
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{ border: '1px solid #e7e8ef', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
      {/* Header row */}
      <div
        onClick={toggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 18px', cursor: 'pointer',
          backgroundColor: expanded ? '#fafaff' : '#fff',
          borderBottom: expanded ? '1px solid #e7e8ef' : 'none',
        }}
      >
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: pill.color, flexShrink: 0
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {complaint.title}
          </div>
          <div style={{ fontSize: '10px', color: '#9295a0', marginTop: '2px' }}>
            Submitted {timeAgo(complaint.created_at)}
          </div>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: '999px',
          backgroundColor: pill.bg, color: pill.color,
          fontSize: '9px', fontWeight: 900, letterSpacing: '0.06em',
          flexShrink: 0,
        }}>{pill.label}</span>
        {expanded ? <ChevronUp size={15} color="#9295a0" /> : <ChevronDown size={15} color="#9295a0" />}
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Description */}
          <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.7, backgroundColor: '#f8f9fb', borderRadius: '8px', padding: '12px' }}>
            {complaint.description}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {complaint.status === 'open' && (
              <button
                onClick={() => transitionStatus('in_progress')}
                className="admin-button"
                style={{ fontSize: '10px', backgroundColor: '#EA580C', color: '#fff', border: 'none' }}
              >
                Take it →
              </button>
            )}
            {complaint.status !== 'resolved' && (
              <button
                onClick={() => transitionStatus('resolved')}
                className="admin-button"
                style={{ fontSize: '10px', backgroundColor: '#16A34A', color: '#fff', border: 'none' }}
              >
                Mark Resolved
              </button>
            )}
            {complaint.status === 'resolved' && (
              <button
                onClick={() => transitionStatus('open')}
                className="admin-button secondary"
                style={{ fontSize: '10px' }}
              >
                Reopen
              </button>
            )}
          </div>

          {/* Tabs: Comments | Timeline */}
          <div>
            <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e7e8ef', marginBottom: '14px' }}>
              {['comments', 'timeline'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
                    borderBottom: tab === t ? '2px solid #000' : '2px solid transparent',
                    color: tab === t ? '#000' : '#9295a0',
                  }}
                >
                  {t === 'comments' ? <><MessageSquare size={11} style={{ display: 'inline', marginRight: '4px' }} />{t} ({comments.length})</> 
                                   : <><Activity size={11} style={{ display: 'inline', marginRight: '4px' }} />{t}</>}
                </button>
              ))}
              {loadingDetails && <RefreshCw size={12} className="spin" style={{ alignSelf: 'center', marginLeft: '8px', color: '#9295a0' }} />}
            </div>

            {/* Comments tab */}
            {tab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {comments.length === 0 && (
                  <div style={{ fontSize: '11px', color: '#9295a0', fontStyle: 'italic', padding: '8px 0' }}>No comments yet.</div>
                )}
                {comments.map(cm => (
                  <div key={cm.id} style={{
                    display: 'flex', gap: '10px', padding: '10px',
                    backgroundColor: cm.author_role === 'staff' ? '#f4f5ff' : '#fafafb',
                    borderRadius: '8px',
                  }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                      backgroundColor: cm.author_role === 'staff' ? '#000' : '#e7e8ef',
                      display: 'grid', placeItems: 'center',
                    }}>
                      {cm.author_role === 'staff'
                        ? <Shield size={13} color="#fff" />
                        : <User size={13} color="#6b7280" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#000' }}>{cm.author_name}</span>
                        <span style={{ fontSize: '10px', color: '#9295a0' }}>{timeAgo(cm.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.6 }}>{cm.body}</div>
                    </div>
                  </div>
                ))}

                {/* New comment input */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    value={commentBody}
                    onChange={e => setCommentBody(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                    placeholder="Add an internal note…"
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: '8px',
                      border: '1px solid #e7e8ef', fontSize: '12px', outline: 'none',
                    }}
                  />
                  <button
                    onClick={postComment}
                    disabled={sending || !commentBody.trim()}
                    className="admin-button primary"
                    style={{ padding: '0 14px', minHeight: '36px', opacity: sending ? 0.6 : 1 }}
                  >
                    {sending ? <RefreshCw size={12} className="spin" /> : <Send size={12} />}
                  </button>
                </div>
              </div>
            )}

            {/* Timeline tab */}
            {tab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {timeline.length === 0 && (
                  <div style={{ fontSize: '11px', color: '#9295a0', fontStyle: 'italic' }}>No activity recorded.</div>
                )}
                {timeline.map((event, i) => (
                  <div key={event.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px', flexShrink: 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#000', marginTop: '3px', flexShrink: 0 }} />
                      {i < timeline.length - 1 && <div style={{ flex: 1, width: '1px', backgroundColor: '#e7e8ef', marginTop: '4px' }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: '4px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#22242d', fontFamily: 'monospace' }}>
                        {event.action}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9295a0', marginTop: '2px' }}>
                        {timeAgo(event.created_at)}
                        {event.event_metadata && Object.keys(event.event_metadata).length > 0 && (
                          <span style={{ marginLeft: '8px', color: '#b4b7c2' }}>
                            {Object.entries(event.event_metadata)
                              .filter(([,v]) => v !== null && v !== false && !(Array.isArray(v) && v.length === 0))
                              .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ResolveComplaint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();

  const [problemGroup, setProblemGroup] = useState(null);
  const [solution,     setSolution]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);

  const fetchProblem = useCallback(async () => {
    try {
      const data = await api(`/staff/problems/${id}`);
      setProblemGroup(data);
      if (data.solution_text) setSolution(data.solution_text);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id, api]);

  useEffect(() => { fetchProblem(); }, [fetchProblem]);

  async function handleSend() {
    if (!solution.trim()) return;
    setSending(true);
    try {
      await api(`/staff/problems/${id}/solution`, {
        method: 'PUT',
        body: JSON.stringify({ solution }),
      });
      setSent(true);
      setTimeout(() => navigate('/department'), 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to resolve: ' + err.message);
    } finally { setSending(false); }
  }

  if (loading || !problemGroup) {
    return (
      <div className="admin-page">
        <div className="skeleton-panel" style={{ height: '60px', borderRadius: '12px' }} />
        <div className="skeleton-panel" style={{ height: '200px', borderRadius: '12px' }} />
      </div>
    );
  }

  const resolvedCount = problemGroup.complaints?.filter(c => c.status === 'resolved').length || 0;
  const totalCount    = problemGroup.complaints?.length || 0;

  return (
    <div className="admin-page">

      {/* ── Page Header ── */}
      <div className="admin-hero">
        <div>
          <button onClick={() => navigate('/department')} className="back-link" style={{ marginBottom: '10px' }}>
            <ArrowLeft size={14} /> Back to dashboard
          </button>
          <div className="panel-eyebrow">RESOLVE / {problemGroup.department?.toUpperCase()}</div>
          <h1 style={{ margin: '6px 0 6px', fontSize: '26px', letterSpacing: '-0.04em' }}>
            {problemGroup.title}
          </h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '11px', color: '#777a86' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={12} /> {problemGroup.affected_users} students affected
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MessageSquare size={12} /> {totalCount} complaints
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} color="#16A34A" /> {resolvedCount}/{totalCount} resolved
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchProblem} className="admin-button secondary">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Progress bar across resolved complaints ── */}
      {totalCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9295a0', fontWeight: 700 }}>
            <span>COMPLAINT RESOLUTION PROGRESS</span>
            <span>{Math.round((resolvedCount / totalCount) * 100)}%</span>
          </div>
          <div style={{ height: '6px', backgroundColor: '#eef0f4', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              width: `${(resolvedCount / totalCount) * 100}%`,
              backgroundColor: resolvedCount === totalCount ? '#16A34A' : '#000',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

        {/* ── Left column: Individual complaints ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="panel-eyebrow">INDIVIDUAL COMPLAINTS</div>
            <span style={{ fontSize: '9px', fontWeight: 900, backgroundColor: '#e7e8ef', padding: '2px 8px', borderRadius: '999px' }}>
              {totalCount}
            </span>
          </div>
          {problemGroup.complaints?.length > 0
            ? problemGroup.complaints.map(c => (
                <ComplaintPanel key={c.id} complaint={c} api={api} onRefresh={fetchProblem} />
              ))
            : <div className="empty-state" style={{ borderRadius: '12px' }}>No individual complaints attached.</div>
          }
        </div>

        {/* ── Right column: Group resolution ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', top: '24px' }}>

          {/* Stats mini-bar */}
          <div className="admin-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Priority Score', value: problemGroup.priority_score?.toFixed(1) || '—' },
              { label: 'Urgency',        value: `${problemGroup.urgency_score || 0}/100` },
              { label: 'Impact',         value: `${problemGroup.impact_score  || 0}/100` },
              { label: 'Status',         value: problemGroup.status || 'open' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#a0a2ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#000', textTransform: 'capitalize' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Group solution textarea */}
          <div className="admin-panel solution-panel">
            <div className="panel-eyebrow" style={{ marginBottom: '6px' }}>GROUP RESOLUTION</div>
            <div style={{ fontSize: '11px', color: '#7d808c', marginBottom: '12px', lineHeight: 1.5 }}>
              This solution is sent to <strong>all {problemGroup.affected_users} affected students</strong> at once.
            </div>
            <textarea
              value={solution}
              onChange={e => setSolution(e.target.value)}
              placeholder="Type the official resolution here. This will be broadcast to all affected students…"
              rows={8}
            />
            <div className="solution-actions">
              <button
                onClick={handleSend}
                disabled={sending || !solution.trim() || sent}
                className="admin-button primary"
                style={{
                  minWidth: '180px',
                  backgroundColor: sent ? '#16A34A' : undefined,
                  transition: 'background-color 0.3s',
                  display: 'flex', alignItems: 'center', gap: '7px',
                }}
              >
                {sent
                  ? <><CheckCircle2 size={14} /> Resolved!</>
                  : sending
                    ? <><RefreshCw size={14} className="spin" /> Sending…</>
                    : <><Send size={14} /> Resolve & Notify All</>
                }
              </button>
            </div>
          </div>

          {/* Affected students list */}
          {problemGroup.students?.length > 0 && (
            <div className="admin-panel">
              <div className="panel-eyebrow" style={{ marginBottom: '10px' }}>
                AFFECTED STUDENTS ({problemGroup.students.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {problemGroup.students.map(s => (
                  <div key={s.user_id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="person-icon"><User size={13} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#9295a0' }}>
                        {s.prn} · Div {s.division} · Roll {s.roll_no}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
