import React, { useState, useEffect } from 'react';
import { ClipboardList, AlertCircle } from 'lucide-react';

export function ComplaintIntake({ api, session, load, setMessage, studentOwnProfile, setActiveTab }) {
  const [descText, setDescText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [similarProblems, setSimilarProblems] = useState([]);

  useEffect(() => {
    if (session?.role !== 'student' || (!titleText && !descText)) {
      setSimilarProblems([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const dept = studentOwnProfile?.department || '';
        const query = new URLSearchParams({ title: titleText, description: descText, department: dept });
        const res = await api(`/problems/similar?${query.toString()}`);
        setSimilarProblems(res || []);
      } catch (e) {
        setSimilarProblems([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [titleText, descText, studentOwnProfile, api, session]);

  async function joinProblem(id) {
    try {
      await api(`/problems/${id}/report`, {
        method: 'POST',
        body: JSON.stringify({ title: titleText, description: descText })
      });
      setTitleText('');
      setDescText('');
      setSimilarProblems([]);
      setMessage('Successfully joined the problem');
      await load();
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function createComplaint(event) {
    event.preventDefault();
    if (session?.role === 'student' && (!studentOwnProfile || !studentOwnProfile.prn_number)) {
      setMessage("Please complete your Academic Profile in 'My Info' before submitting a grievance.");
      setActiveTab('my-info');
      return;
    }

    const formEl = event.currentTarget;
    try {
      await api('/complaints', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          title: titleText,
          description: descText,
          force_new: true,
        }),
      });
      formEl.reset();
      setTitleText('');
      setDescText('');
      setSimilarProblems([]);
      setMessage('Complaint submitted successfully');
      await load();
    } catch (err) {
      if (err.message?.includes('Academic Profile') || err.message?.includes('My Info')) {
        setActiveTab('my-info');
      }
      setMessage(err.message);
    }
  }

  const profileReady = studentOwnProfile && studentOwnProfile.prn_number && studentOwnProfile.full_name;

  return (
    <div className="panel form">
      <ClipboardList size={22} />
      <h2>Submit a grievance</h2>
      <div style={{ position: 'relative' }}>
        {!profileReady && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: '8px', padding: '20px', textAlign: 'center',
            border: '1.5px dashed #fb923c'
          }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</span>
            <strong style={{ fontSize: '15px', color: '#1F2937', marginBottom: '6px' }}>Form Locked</strong>
            <span style={{ fontSize: '13px', color: '#78350f', marginBottom: '16px' }}>
              You must complete your Academic Profile before you can submit a grievance.
            </span>
            <button type="button" onClick={() => setActiveTab('my-info')}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--brand-gradient)', color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
              Complete My Profile Now
            </button>
          </div>
        )}

        <form onSubmit={createComplaint} style={!profileReady ? { opacity: 0.4, pointerEvents: 'none' } : {}}>
          <p className="helper" style={{ marginBottom: '12px' }}>Describe issue clearly. Priority and routing remain subject to authorized review.</p>
          <input name="title" placeholder="Title" required disabled={!profileReady} value={titleText} onChange={(e) => setTitleText(e.target.value)} />
          <textarea
            name="description"
            placeholder="Describe issue"
            required
            minLength={20}
            maxLength={1000}
            value={descText}
            onChange={(e) => setDescText(e.target.value)}
            rows={5}
            disabled={!profileReady}
          />
          <p className="helper" style={{ marginTop: '-8px', fontSize: '11px' }}>
            Min. 20 characters required. Provide specific details (e.g., location, dates, people involved).
          </p>
          <p style={{ textAlign: 'right', fontSize: '11px', color: '#9CA3AF', margin: '-4px 0 8px' }}>
            {descText.length} / 1000
          </p>

          {similarProblems.length > 0 && (
            <div style={{ backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', marginBottom: '12px' }}>
                <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                Existing similar issues
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {similarProblems.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{p.affected_users} students affected</div>
                    </div>
                    <button type="button" onClick={() => joinProblem(p.id)} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--brand-gradient)', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Join this problem
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button disabled={!profileReady} style={{ width: '100%', marginTop: '4px', backgroundColor: !profileReady ? '#9CA3AF' : '#000000', color: '#FFFFFF', fontWeight: 700, fontSize: '15px', cursor: !profileReady ? 'not-allowed' : 'pointer', border: 'none', padding: '12px' }}>
            {similarProblems.length > 0 ? 'Submit as genuinely new' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
}
