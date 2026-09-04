import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  Users,
  Sparkles,
  RefreshCw,
  MapPin,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function StaffProblemDetail() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  const [problem, setProblem] = useState(null);
  const [solution, setSolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [showComplaints, setShowComplaints] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(`/staff/problems/${encodeURIComponent(id)}`);
      setProblem(data);
      if (data.solution_text) {
        setSolution(data.solution_text);
      }
    } catch (e) {
      setMessage(e.message || 'Unable to load problem cluster.');
    } finally {
      setLoading(false);
    }
  }, [api, id, setMessage]);

  useEffect(() => {
    load();
  }, [load]);

  // Generate or regenerate AI Action Brief
  const handleGenerateBrief = async () => {
    setGeneratingBrief(true);
    try {
      const result = await api(`/staff/problems/${encodeURIComponent(id)}/brief?force=true`, {
        method: 'POST',
      });
      setProblem((prev) => (prev ? {
        ...prev,
        generated_brief: result.generated_brief,
        generated_brief_at: result.generated_brief_at,
      } : prev));
      setMessage('AI Action Brief generated successfully.');
    } catch (e) {
      setMessage(e.message || 'Could not generate brief. Summary unavailable.');
    } finally {
      setGeneratingBrief(false);
    }
  };

  async function submitSolution(markResolved) {
    if (!solution.trim()) return setMessage('Please enter a solution description first.');
    setSaving(true);
    try {
      await api(`/staff/problems/${encodeURIComponent(id)}/solution`, {
        method: 'PUT',
        body: JSON.stringify({
          solution: solution.trim(),
          status: markResolved ? 'resolved' : 'in_progress',
        }),
      });
      setMessage(markResolved ? 'Problem marked as resolved for all students!' : 'Solution update submitted.');
      await load();
    } catch (e) {
      setMessage(e.message || 'Could not submit solution.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="skeleton-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA0A8' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <div>Loading problem cluster…</div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="admin-page">
        <Link to="/staff/problems" className="back-link"><ArrowLeft size={15} /> Back to problems</Link>
        <div className="empty-state">Problem cluster not found.</div>
      </div>
    );
  }

  const briefTime = problem.generated_brief_at
    ? new Date(problem.generated_brief_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="admin-page">
      <Link to="/staff/problems" className="back-link"><ArrowLeft size={15} /> Back to problems</Link>

      {/* Hero Header */}
      <section className="detail-hero">
        <div>
          <div className="eyebrow-neon" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{problem.problem_code || 'CORE PROBLEM'}</span>
            {problem.is_emerging && (
              <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 800 }}>
                ⚡ EMERGING INCIDENT
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '26px', margin: '8px 0', fontWeight: 800 }}>{problem.title}</h1>
          <p style={{ color: '#6B6F76', lineHeight: 1.5, maxWidth: '800px' }}>{problem.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link className="admin-button secondary" to={`/staff/problems/${encodeURIComponent(id)}/intelligence`}>
            <Sparkles size={15} /> Understand problem
          </Link>
          <span className={`priority-badge ${String(problem.priority || 'normal').toLowerCase()}`}>
            {String(problem.priority || 'NORMAL').toUpperCase()}
          </span>
          <span className={`priority-badge ${String(problem.status || 'open').toLowerCase()}`}>
            {String(problem.status || 'OPEN').replaceAll('_', ' ').toUpperCase()}
          </span>
        </div>
      </section>

      {/* Metric Chips */}
      <section className="detail-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="detail-stat">
          <Users size={16} color="#5B4FE9" />
          <span>Affected Students</span>
          <strong>{problem.affected_users || problem.complaint_count || 1}</strong>
        </div>
        <div className="detail-stat">
          <FileText size={16} color="#5B4FE9" />
          <span>Total Complaints</span>
          <strong>{problem.complaint_count || 1}</strong>
        </div>
        <div className="detail-stat">
          <MapPin size={16} color="#1E9E5A" />
          <span>Location</span>
          <strong>{problem.location || problem.department || 'Campus'}</strong>
        </div>
        <div className="detail-stat">
          <Tag size={16} color="#D98A1F" />
          <span>Category</span>
          <strong>{problem.category || 'General'}</strong>
        </div>
      </section>

      {/* ── AI ACTION BRIEF CALLOUT BOX (ABOVE COMPLAINTS & RESPONSE) ───────── */}
      <section style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF9FE 100%)',
        border: '1.5px solid #5B4FE9',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 8px 24px rgba(91, 79, 233, 0.09)',
        position: 'relative',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#5B4FE9',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: '9999px',
            }}>
              <Sparkles size={13} /> AI Action Brief
            </span>
            {briefTime && (
              <span style={{ fontSize: '11px', color: '#9CA0A8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Generated: {briefTime}
              </span>
            )}
          </div>

          <button
            id="btn-regenerate-brief"
            onClick={handleGenerateBrief}
            disabled={generatingBrief}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E8EE',
              color: '#5B4FE9',
              fontSize: '12px',
              fontWeight: 700,
              cursor: generatingBrief ? 'wait' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={13} style={{ animation: generatingBrief ? 'spin 1s linear infinite' : 'none' }} />
            {generatingBrief ? 'Synthesizing…' : problem.generated_brief ? 'Regenerate' : 'Generate Brief'}
          </button>
        </div>

        {generatingBrief ? (
          <div style={{ padding: '16px 0', color: '#5B4FE9', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Analyzing {problem.complaint_count || 1} complaints and retrieving past resolution precedents…</span>
          </div>
        ) : problem.generated_brief ? (
          <div style={{
            fontSize: '14.5px',
            lineHeight: 1.7,
            color: '#1F2937',
            backgroundColor: '#F7F6FD',
            borderLeft: '4px solid #5B4FE9',
            padding: '14px 18px',
            borderRadius: '0 10px 10px 0',
          }}>
            {problem.generated_brief}
          </div>
        ) : (
          <div style={{
            padding: '16px',
            backgroundColor: '#F8F9FC',
            borderRadius: '10px',
            color: '#6B6F76',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Summary unavailable. Click &ldquo;Generate Brief&rdquo; to summarize this incident with AI.</span>
            <button
              onClick={handleGenerateBrief}
              style={{
                backgroundColor: '#5B4FE9',
                color: '#fff',
                border: 0,
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Generate Now
            </button>
          </div>
        )}
      </section>

      {/* ── DEPARTMENT RESPONSE & COORDINATED SOLUTION ──────────────────────── */}
      <section className="admin-panel solution-panel" style={{ marginBottom: '24px' }}>
        <div className="panel-eyebrow">DEPARTMENT RESPONSE</div>
        <h2 style={{ fontSize: '18px', margin: '4px 0 12px' }}>Issue one coordinated resolution</h2>
        <p style={{ fontSize: '13px', color: '#6B6F76', margin: '0 0 16px' }}>
          Submitting a solution here automatically notifies all {problem.affected_users || problem.complaint_count || 1} students linked to this cluster.
        </p>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Write the resolution steps or instructions to broadcast to all affected students…"
          style={{ width: '100%', minHeight: '110px', padding: '14px', borderRadius: '10px', border: '1px solid #E7E8EE', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical' }}
        />
        <div className="solution-actions" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button className="admin-button secondary" disabled={saving} onClick={() => submitSolution(false)}>
            <Send size={15} /> Save Solution Draft
          </button>
          <button className="admin-button primary" disabled={saving} onClick={() => submitSolution(true)}>
            <CheckCircle2 size={15} /> Mark Resolved for All
          </button>
        </div>
      </section>

      {/* ── INDIVIDUAL COMPLAINTS IN CLUSTER ─────────────────────────────────── */}
      <section className="admin-panel">
        <div
          onClick={() => setShowComplaints(!showComplaints)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
        >
          <div>
            <div className="panel-eyebrow">CLUSTER EVIDENCE</div>
            <h2 style={{ fontSize: '18px', margin: '4px 0 0' }}>
              Linked Student Complaints ({problem.complaints ? problem.complaints.length : problem.complaint_count || 0})
            </h2>
          </div>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 0,
              color: '#5B4FE9',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {showComplaints ? <><ChevronUp size={16} /> Collapse</> : <><ChevronDown size={16} /> Expand</>}
          </button>
        </div>

        {showComplaints && (
          <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
            {(!problem.complaints || problem.complaints.length === 0) ? (
              <div style={{ color: '#9CA0A8', fontSize: '13px', padding: '16px 0' }}>
                No individual complaints listed for this cluster.
              </div>
            ) : (
              problem.complaints.map((c, i) => (
                <div
                  key={c.id || i}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7E8EE',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F0F14', marginBottom: '3px' }}>
                      {c.title}
                    </div>
                    {c.description && (
                      <div style={{ fontSize: '12.5px', color: '#6B6F76', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span className={`priority-badge ${String(c.priority || 'normal').toLowerCase()}`} style={{ height: '22px', fontSize: '9.5px' }}>
                      {String(c.priority || 'NORMAL').toUpperCase()}
                    </span>
                    <span className={`priority-badge ${String(c.status || 'open').toLowerCase()}`} style={{ height: '22px', fontSize: '9.5px' }}>
                      {String(c.status || 'OPEN').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
