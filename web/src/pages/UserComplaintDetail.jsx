import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft, CheckCircle2, ThumbsUp, ThumbsDown,
  MessageSquare, Activity, Clock, RefreshCw, Send,
  AlertTriangle, RotateCcw, Trash2, User, Shield, Paperclip, File as FileIcon, Upload
} from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

const STATUS_STYLES = {
  open:        { bg: '#FEF2F2', color: '#DC2626', label: 'Open' },
  in_progress: { bg: '#FFF7ED', color: '#EA580C', label: 'In Progress' },
  resolved:    { bg: '#F0FDF4', color: '#16A34A', label: 'Resolved' },
  closed:      { bg: '#F3F4F6', color: '#6B7280', label: 'Closed' },
};

export function UserComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, token, apiBaseUrl } = useAuth();

  const [complaint,  setComplaint]  = useState(null);
  const [solution,   setSolution]   = useState(null);
  const [comments,   setComments]   = useState([]);
  const [timeline,   setTimeline]   = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('comments');

  // Actions state
  const [feedback,   setFeedback]   = useState(null); // 'accepted' | 'rejected'
  const [feedbackComment, setFeedbackComment] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopen, setShowReopen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Loading states
  const [sendingComment, setSendingComment] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [sendingReopen,  setSendingReopen]  = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cmts, tl, att] = await Promise.all([
        api(`/complaints/${id}`),
        api(`/complaints/${id}/comments`),
        api(`/complaints/${id}/timeline`),
        api(`/complaints/${id}/attachments`).catch(() => []),
      ]);
      setComplaint(c);
      setComments(cmts || []);
      setTimeline(tl || []);
      setAttachments(att || []);

      // Load solution separately (may 404 if not resolved yet)
      if (c.status === 'resolved' || c.solution_text) {
        try {
          const sol = await api(`/complaints/${id}/solution`);
          setSolution(sol);
        } catch { setSolution(null); }
      }

      // Pre-fill feedback state if already given
      if (c.feedback_accepted !== null && c.feedback_accepted !== undefined) {
        setFeedback(c.feedback_accepted ? 'accepted' : 'rejected');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  async function postComment() {
    if (!commentBody.trim()) return;
    setSendingComment(true);
    try {
      const c = await api(`/complaints/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentBody }),
      });
      setComments(prev => [...prev, c]);
      setCommentBody('');
    } catch (e) { console.error(e); }
    finally { setSendingComment(false); }
  }

  async function submitFeedback(accepted) {
    setSendingFeedback(true);
    try {
      await api(`/complaints/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ accepted, comment: feedbackComment || null }),
      });
      setFeedback(accepted ? 'accepted' : 'rejected');
      await fetchAll();
    } catch (e) { console.error(e); }
    finally { setSendingFeedback(false); }
  }

  async function doReopen() {
    if (!reopenReason.trim()) return;
    setSendingReopen(true);
    try {
      await api(`/complaints/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({ reason: reopenReason }),
      });
      setShowReopen(false);
      await fetchAll();
    } catch (e) { console.error(e); }
    finally { setSendingReopen(false); }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await api(`/complaints/${id}`, { method: 'DELETE' });
      navigate('/user/dashboard');
    } catch (e) { console.error(e); setDeleting(false); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Use apiBaseUrl from context so this works in any deployment environment
      const res = await fetch(`${apiBaseUrl}/complaints/${id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchAll();
    } catch (e) { console.error(e); }
    finally { setUploadingFile(false); }
  }

  if (loading || !complaint) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ height: '24px', width: '120px', backgroundColor: '#f1f2f7', borderRadius: '6px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: '200px', backgroundColor: '#f1f2f7', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const st = STATUS_STYLES[complaint.status] || STATUS_STYLES.open;
  const isResolved = complaint.status === 'resolved';
  const isClosed   = complaint.status === 'closed';
  const solutionText = solution?.solution_text || complaint.solution_text;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Back */}
      <button
        onClick={() => navigate('/user/dashboard')}
        style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
      >
        <ChevronLeft size={15} /> Back to Dashboard
      </button>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#9295a0', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            {complaint.department} · {complaint.category || 'General'}
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#000', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {complaint.title}
          </h1>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 12px', borderRadius: '999px',
              backgroundColor: st.bg, color: st.color,
              fontSize: '10px', fontWeight: 900, letterSpacing: '0.05em'
            }}>{st.label}</span>
            <span style={{ fontSize: '11px', color: '#9295a0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={11} /> Submitted {timeAgo(complaint.created_at)}
            </span>
            {complaint.priority && (
              <span style={{ fontSize: '11px', color: '#9295a0' }}>Priority: <strong>{complaint.priority}</strong></span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={fetchAll} style={{ background: 'none', border: '1px solid #e7e8ef', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#6B7280' }}>
            <RefreshCw size={13} />
          </button>
          {!isResolved && !isClosed && (
            <button
              onClick={() => setShowDelete(true)}
              style={{ background: 'none', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#DC2626' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e7e8ef', borderRadius: '14px', padding: '20px 24px', marginBottom: '20px', fontSize: '13px', color: '#4b5563', lineHeight: 1.75 }}>
        {complaint.description}
      </div>

      {/* ── RESOLVED: Show solution + feedback ── */}
      {isResolved && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '14px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <CheckCircle2 size={20} color="#16A34A" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#15803D' }}>Resolution from Department</h2>
          </div>

          <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.75, marginBottom: '20px' }}>
            {solutionText || 'The department has marked this complaint as resolved. No additional notes were provided.'}
          </div>

          {/* Feedback section */}
          {feedback ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#fff', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: feedback === 'accepted' ? '#16A34A' : '#DC2626' }}>
              {feedback === 'accepted' ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
              You marked this resolution as {feedback === 'accepted' ? 'Helpful ✓' : 'Not Helpful ✗'}
              {complaint.feedback_comment && (
                <span style={{ color: '#6B7280', fontWeight: 400, marginLeft: '8px' }}>"{complaint.feedback_comment}"</span>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Was this resolution helpful?</div>
              <input
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Optional comment…"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e7e8ef', fontSize: '12px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => submitFeedback(true)}
                  disabled={sendingFeedback}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  <ThumbsUp size={13} /> Yes, it helped
                </button>
                <button
                  onClick={() => submitFeedback(false)}
                  disabled={sendingFeedback}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  <ThumbsDown size={13} /> Not helpful
                </button>
              </div>
            </div>
          )}

          {/* Reopen button */}
          <div style={{ marginTop: '14px' }}>
            <button
              onClick={() => setShowReopen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: '#6B7280' }}
            >
              <RotateCcw size={12} /> Issue not fixed? Reopen
            </button>
            {showReopen && (
              <div style={{ marginTop: '10px', backgroundColor: '#fff', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <AlertTriangle size={13} /> Explain why the issue is not resolved
                </div>
                <textarea
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  placeholder="Describe what's still wrong…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e7e8ef', fontSize: '12px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                />
                <button
                  onClick={doReopen}
                  disabled={sendingReopen || !reopenReason.trim()}
                  style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                >
                  {sendingReopen ? 'Submitting…' : 'Submit Reopen Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Comments & Timeline tabs ── */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e7e8ef', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e7e8ef' }}>
          {[
            { key: 'comments', label: 'Discussion', icon: MessageSquare, count: comments.length },
            { key: 'attachments', label: 'Attachments', icon: Paperclip, count: attachments.length },
            { key: 'timeline', label: 'Activity',   icon: Activity,     count: timeline.length },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '13px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                borderBottom: tab === key ? '2px solid #000' : '2px solid transparent',
                color: tab === key ? '#000' : '#9295a0',
              }}
            >
              <Icon size={13} /> {label}
              <span style={{ padding: '1px 7px', borderRadius: '999px', backgroundColor: tab === key ? '#000' : '#e7e8ef', color: tab === key ? '#fff' : '#6B7280', fontSize: '9px', fontWeight: 900 }}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {tab === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comments.length === 0 && (
                <div style={{ fontSize: '12px', color: '#9295a0', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                  No comments yet. Start the conversation.
                </div>
              )}
              {comments.map(cm => (
                <div key={cm.id} style={{
                  display: 'flex', gap: '10px', padding: '12px 14px',
                  backgroundColor: cm.author_role === 'staff' ? '#f4f5ff' : '#fafafb',
                  borderRadius: '10px',
                }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                    backgroundColor: cm.author_role === 'staff' ? '#000' : '#e7e8ef',
                    display: 'grid', placeItems: 'center',
                  }}>
                    {cm.author_role === 'staff' ? <Shield size={14} color="#fff" /> : <User size={14} color="#6b7280" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#000' }}>
                        {cm.author_name} {cm.author_role === 'staff' && <span style={{ fontSize: '9px', color: '#6B7280', fontWeight: 600, marginLeft: '4px' }}>Staff</span>}
                      </span>
                      <span style={{ fontSize: '10px', color: '#9295a0' }}>{timeAgo(cm.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6 }}>{cm.body}</div>
                  </div>
                </div>
              ))}

              {/* Comment input */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && postComment()}
                  placeholder="Add a comment or question…"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e7e8ef', fontSize: '13px', outline: 'none' }}
                />
                <button
                  onClick={postComment}
                  disabled={sendingComment || !commentBody.trim()}
                  style={{ padding: '0 16px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  {sendingComment ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          )}

          {tab === 'attachments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Attached Files</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#F3F4F6', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  {uploadingFile ? <Clock size={14} className="spin" /> : <Upload size={14} />}
                  {uploadingFile ? 'Uploading…' : 'Upload File'}
                  <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploadingFile} />
                </label>
              </div>

              {attachments.length === 0 && (
                <div style={{ fontSize: '12px', color: '#9295a0', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                  No attachments yet.
                </div>
              )}
              {attachments.map(att => {
                const isPdf = att.content_type === 'application/pdf';
                const isImage = att.content_type?.startsWith('image/');
                const fileUrl = `${apiBaseUrl}/complaints/${id}/attachments/${att.id}`;
                return (
                  <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', backgroundColor: '#fafafb', border: '1px solid #e7e8ef', borderRadius: '8px' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      backgroundColor: isPdf ? '#FEF2F2' : '#EDEBFC',
                      color: isPdf ? '#DC2626' : '#5B4FE9',
                      display: 'grid', placeItems: 'center'
                    }}>
                      <FileIcon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{att.filename || 'File'}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {isPdf ? 'PDF' : isImage ? 'Image' : 'File'} · Uploaded {timeAgo(att.created_at)}
                      </div>
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', color: '#5B4FE9', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      View / Download
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {timeline.length === 0 && (
                <div style={{ fontSize: '12px', color: '#9295a0', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>No activity recorded.</div>
              )}
              {timeline.map((event, i) => (
                <div key={event.id} style={{ display: 'flex', gap: '12px', paddingBottom: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18px', flexShrink: 0 }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#000', marginTop: '4px', flexShrink: 0 }} />
                    {i < timeline.length - 1 && <div style={{ flex: 1, width: '1px', backgroundColor: '#e7e8ef', marginTop: '5px' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#22242d', fontFamily: 'monospace' }}>{event.action}</div>
                    <div style={{ fontSize: '10px', color: '#9295a0', marginTop: '2px' }}>{timeAgo(event.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: 'min(420px, 90vw)', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={20} color="#DC2626" />
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Delete this complaint?</h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 20px' }}>
              This action is permanent and cannot be undone. The complaint and all associated data will be removed.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDelete(false)} style={{ padding: '9px 18px', border: '1px solid #e7e8ef', borderRadius: '8px', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancel</button>
              <button
                onClick={doDelete}
                disabled={deleting}
                style={{ padding: '9px 18px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
