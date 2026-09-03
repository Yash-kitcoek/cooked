import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Building,
  Layers,
  Sparkles,
  RefreshCw,
  RotateCcw,
  Check,
  AlertTriangle,
  Paperclip,
  FileText,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { firstSuccessful } from './adminApi';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const STEPS = ['Submitted', 'In Review', 'Action Taken', 'Resolved', 'Closed'];

function getStepIndex(status) {
  const s = String(status || '').toLowerCase().replace(' ', '_');
  if (s === 'open') return 0;
  if (s === 'in_progress') return 1;
  if (s === 'escalated') return 2;
  if (s === 'resolved') return 3;
  if (s === 'closed') return 4;
  return 0;
}

export function AdminComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, setMessage, apiBaseUrl } = useAuth();

  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [solutionText, setSolutionText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const complaintData = await firstSuccessful(api, [
        `/complaints/${encodeURIComponent(id)}`,
        `/admin/complaints/${encodeURIComponent(id)}`,
      ]);

      if (!complaintData) throw new Error('Complaint not found.');

      setItem(complaintData);
      setNewStatus(complaintData.status || 'open');
      if (complaintData.solution_text) {
        setSolutionText(complaintData.solution_text);
      }

      // Load comments, timeline & attachments safely
      const [cmts, tml, atts] = await Promise.all([
        api(`/complaints/${encodeURIComponent(id)}/comments`).catch(() => []),
        api(`/complaints/${encodeURIComponent(id)}/timeline`).catch(() => []),
        api(`/complaints/${encodeURIComponent(id)}/attachments`).catch(() => []),
      ]);

      setComments(Array.isArray(cmts) ? cmts : []);
      setTimeline(Array.isArray(tml) ? tml : []);
      setAttachments(Array.isArray(atts) ? atts : []);
    } catch (e) {
      setMessage(e.message || 'Unable to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [api, id, setMessage]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Handle status update
  async function handleStatusChange(e) {
    e.preventDefault();
    if (!newStatus || newStatus === item?.status) return;
    setSubmittingStatus(true);
    try {
      await api(`/complaints/${encodeURIComponent(id)}/transition`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, note: 'Status updated by administrator' }),
      });
      setMessage(`Case status updated to ${newStatus.replace('_', ' ')}.`);
      await loadAll();
    } catch (err) {
      setMessage(err.message || 'Failed to update status.');
    } finally {
      setSubmittingStatus(false);
    }
  }

  // Handle solution submit
  async function handleSaveSolution(e) {
    e.preventDefault();
    if (!solutionText.trim()) {
      setMessage('Please enter resolution notes or official solution.');
      return;
    }
    setSubmittingSolution(true);
    try {
      await api(`/complaints/${encodeURIComponent(id)}/solution`, {
        method: 'PUT',
        body: JSON.stringify({ solution: solutionText }),
      });
      setMessage('Official solution submitted and complaint marked resolved!');
      await loadAll();
    } catch (err) {
      setMessage(err.message || 'Failed to submit solution.');
    } finally {
      setSubmittingSolution(false);
    }
  }

  // Handle post comment
  async function handlePostComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const created = await api(`/complaints/${encodeURIComponent(id)}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentBody }),
      });
      setComments((prev) => [...prev, created]);
      setCommentBody('');
      setMessage('Comment posted.');
    } catch (err) {
      setMessage(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading && !item) {
    return (
      <div className="admin-page">
        <div className="skeleton-panel">Loading grievance case details…</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="admin-page">
        <Link to="/admin/complaints" className="back-link">
          <ArrowLeft size={15} /> Back to complaints
        </Link>
        <div className="empty-state">Complaint not found or has been removed.</div>
      </div>
    );
  }

  const currentStep = getStepIndex(item.status);
  const isResolved = ['resolved', 'closed'].includes(String(item.status).toLowerCase());

  return (
    <div className="admin-page">
      {/* Navigation & Header */}
      <div>
        <Link to="/admin/complaints" className="back-link">
          <ArrowLeft size={15} /> Back to complaints queue
        </Link>
      </div>

      <section className="detail-hero">
        <div>
          <div className="eyebrow-neon">CASE #{String(item.id).slice(0, 8).toUpperCase()} / {item.department || 'GENERAL'}</div>
          <h1>{item.title || 'Untitled Complaint'}</h1>
          <p>{item.description || 'No description provided.'}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span className={`priority-badge ${String(item.priority || 'low').toLowerCase()}`} style={{ fontSize: 11, padding: '4px 14px' }}>
            {item.priority || 'NORMAL'} PRIORITY
          </span>
          <span className={`status-chip ${String(item.status || '').toLowerCase()}`} style={{ fontSize: 11, padding: '4px 14px' }}>
            {String(item.status || 'open').replaceAll('_', ' ')}
          </span>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <section className="detail-stats">
        <div className="detail-stat">
          <Building size={18} />
          <span>Department</span>
          <strong>{item.department || 'Unassigned'}</strong>
        </div>
        <div className="detail-stat">
          <User size={18} />
          <span>Student Submitter</span>
          <strong>{item.student?.username || item.student?.email || 'Student user'}</strong>
        </div>
        <div className="detail-stat">
          <Layers size={18} />
          <span>Problem Group</span>
          <strong>
            {item.problem_group_id ? (
              <Link to={`/admin/problems/${encodeURIComponent(item.problem_group_id)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                Group #{String(item.problem_group_id).slice(0, 8)}
              </Link>
            ) : (
              'Individual case'
            )}
          </strong>
        </div>
        <div className="detail-stat">
          <Clock3 size={18} />
          <span>Date Submitted</span>
          <strong>{item.created_at ? new Date(item.created_at).toLocaleString() : '—'}</strong>
        </div>
      </section>

      {/* Main Review & Resolution Grid */}
      <div className="admin-grid-2">
        {/* Left column: Resolution actions & details */}
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Action Card: Provide Solution */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-eyebrow">ADMIN / STAFF ACTION</div>
                <h2>Official Resolution & Solution</h2>
              </div>
              {isResolved && (
                <span className="status-chip resolved" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> Resolved
                </span>
              )}
            </div>

            <p className="detail-copy" style={{ marginTop: 0 }}>
              Provide the official solution or resolution steps. Submitting this will automatically mark this grievance as <strong>Resolved</strong> and notify the student.
            </p>

            <form onSubmit={handleSaveSolution}>
              <div className="solution-panel">
                <textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Describe the action taken and official solution to resolve this grievance..."
                  rows={4}
                />
                <div className="solution-actions">
                  <button type="submit" className="admin-button primary" disabled={submittingSolution}>
                    <Check size={15} />
                    {submittingSolution ? 'Submitting Solution…' : isResolved ? 'Update Solution' : 'Resolve & Save Solution'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Action Card: Case Status & Triage */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-eyebrow">TRIAGE WORKFLOW</div>
                <h2>Update Case Status</h2>
              </div>
            </div>

            <form onSubmit={handleStatusChange} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{
                  minHeight: 40,
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid var(--border)',
                  padding: '0 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  flex: 1,
                }}
              >
                <option value="open">Open (Awaiting Review)</option>
                <option value="in_progress">In Progress (Department Active)</option>
                <option value="escalated">Escalated (Urgent Attention)</option>
                <option value="resolved">Resolved (Solution Provided)</option>
                <option value="closed">Closed (Finished)</option>
              </select>

              <button
                type="submit"
                className="admin-button secondary"
                disabled={submittingStatus || newStatus === item.status}
              >
                {submittingStatus ? 'Updating…' : 'Apply Status'}
              </button>
            </form>
          </section>

          {/* Comments & Activity Log */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-eyebrow">COMMUNICATION</div>
                <h2>Staff & Student Notes</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
              {comments.length ? (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius-btn)',
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{c.author?.username || c.author?.email || 'User'}</strong>
                      <span className="mono" style={{ fontSize: 11 }}>
                        {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {c.body || c.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
                  No messages or internal notes yet.
                </div>
              )}
            </div>

            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a message or internal note to this case..."
                style={{
                  flex: 1,
                  minHeight: 40,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-btn)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                }}
              />
              <button type="submit" className="admin-button primary" disabled={submittingComment || !commentBody.trim()}>
                <Send size={14} /> Send
              </button>
            </form>
          </section>
        </div>

        {/* Right column: Progress Tracker & Metadata */}
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Progress Tracker */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-eyebrow">LIFECYCLE</div>
                <h2>Resolution Progress</h2>
              </div>
            </div>

            <div className="student-timeline" style={{ marginTop: 14 }}>
              {STEPS.map((step, index) => (
                <div
                  className={`timeline-item ${index < currentStep ? 'done' : ''} ${index === currentStep ? 'current' : ''}`}
                  key={step}
                >
                  <div>
                    <div className="timeline-dot" />
                    {index < STEPS.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div>
                    <strong>{step}</strong>
                    <small>
                      {index < currentStep
                        ? 'Completed'
                        : index === currentStep
                        ? `Current state: ${String(item.status).replaceAll('_', ' ')}`
                        : 'Pending'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Intake & Intelligence Info */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-eyebrow">RESOLVE INTELLIGENCE</div>
                <h2>Triage Insights</h2>
              </div>
              <Sparkles size={18} color="var(--accent, #5B4FE9)" />
            </div>

            <div className="ai-callout" style={{ marginTop: 8 }}>
              <Sparkles size={16} />
              <div>
                <strong>Auto-Routed to {item.department || 'Department'}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Assigned priority: <strong>{item.priority || 'Normal'}</strong> based on campus impact and keyword similarity.
                </p>
              </div>
            </div>

            {item.priority_reasons && item.priority_reasons.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Escalation & Priority Triggers:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {item.priority_reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Attachments Panel */}
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <div className="panel-eyebrow">EVIDENCE</div>
                <h2>Attachments</h2>
              </div>
              <Paperclip size={18} color="var(--accent, #5B4FE9)" />
            </div>

            {attachments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0', marginTop: 8 }}>
                No supporting documents or images attached to this case.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {attachments.map((att) => {
                  const isImage = att.content_type?.startsWith('image/');
                  const isPdf = att.content_type === 'application/pdf';
                  const fileUrl = `${apiBaseUrl}/complaints/${encodeURIComponent(id)}/attachments/${att.id}`;
                  return (
                    <a
                      key={att.id}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-btn)',
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border)',
                        textDecoration: 'none',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: isPdf ? '#FEF2F2' : '#EDEBFC',
                          color: isPdf ? '#DC2626' : '#5B4FE9',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0
                        }}>
                          {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
                        </div>
                        <div>
                          <strong style={{ fontSize: 12, color: 'var(--text-primary)', display: 'block', wordBreak: 'break-all' }}>
                            {att.filename}
                          </strong>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {isPdf ? 'PDF Document' : 'Image'} · {formatBytes(att.size_bytes)}
                          </span>
                        </div>
                      </div>
                      <ExternalLink size={14} color="var(--accent, #5B4FE9)" />
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
