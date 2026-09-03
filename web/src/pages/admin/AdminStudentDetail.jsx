import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Building, BookOpen, Clock, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function AdminStudentDetail() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api(`/admin/student-profiles/${encodeURIComponent(id)}`);
        setProfile(data);
        
        // Try fetching complaints for this student. If the endpoint doesn't exist or filtering fails, just swallow error
        try {
          const allComplaints = await api('/admin/complaints').catch(() => []);
          setComplaints(allComplaints.filter(c => c.student_id === data.user_id || c.student_id === parseInt(id)));
        } catch (e) { console.error(e); }
        
      } catch (e) {
        setMessage(e.message || 'Unable to load student profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [api, id, setMessage]);

  if (loading) return <div className="admin-page"><div className="skeleton-panel" style={{ height: '300px' }}></div></div>;
  if (!profile) return <div className="admin-page"><div className="empty-state">Student profile not found.</div></div>;

  return (
    <div className="admin-page">
      <Link to="/admin/students" className="back-link" style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6B7280', textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>
        <ArrowLeft size={15} /> Back to students
      </Link>

      <section className="admin-panel" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexShrink: 0 }}>
          <User size={32} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="panel-eyebrow">STUDENT PROFILE / ID: {profile.user_id}</div>
          <h1 style={{ margin: '4px 0 8px', fontSize: '24px', fontWeight: 800 }}>{profile.full_name || profile.username || 'Unnamed Student'}</h1>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#6B7280', fontSize: '13px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {profile.user_email || profile.email || 'No email provided'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {profile.contact_number || 'No contact provided'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</span>
          </div>
        </div>
      </section>

      <div className="admin-grid-2" style={{ marginTop: '24px' }}>
        <section className="admin-panel">
          <div className="panel-eyebrow">ACADEMIC INFO</div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Metric icon={Building} label="Department" value={profile.department || '—'} />
            <Metric icon={ShieldCheck} label="PRN Number" value={profile.prn_number || '—'} />
            <Metric icon={BookOpen} label="Division / Roll No" value={`${profile.division || '—'} / ${profile.roll_no || '—'}`} />
            <Metric icon={Activity} label="Year / Semester" value={profile.year_semester || '—'} />
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-eyebrow">GRIEVANCE HISTORY</div>
          {complaints.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '16px', padding: '32px 16px' }}>
              No complaints filed by this student.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {complaints.map(c => (
                <Link key={c.id} to={`/admin/complaints/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.15s ease' }} className="hover-border">
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '2px' }}>{c.title || 'Untitled'}</div>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{c.department} • {timeAgo(c.created_at)}</div>
                    </div>
                    <span className={`status-chip ${c.status}`}>{c.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
        <Icon size={16} />
      </div>
      <div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{value}</div>
      </div>
    </div>
  );
}
