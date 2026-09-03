import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ViewStudents() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [problemGroup, setProblemGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProblem() {
      try {
        const data = await api(`/staff/problems/${id}`);
        setProblemGroup(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [id, api]);

  if (loading || !problemGroup) return <div style={{ padding: '48px' }}>Loading...</div>;

  // Filter for unique students in case one student submitted multiple complaints
  const uniqueStudents = Array.from(new Map(problemGroup.students.map(s => [s.user_id, s])).values());

  return (
    <div style={{ padding: '48px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/department')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          >
            ← Back
          </button>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
            Affected Students
          </h2>
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '4px solid var(--brand-primary)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        minHeight: '600px'
      }}>
        
        {/* Top Row - Problem Details */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{ 
            flex: 1, 
            border: '2px solid var(--brand-primary)', 
            borderRadius: '8px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#F9FAFB'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000' }}>
              {problemGroup.title}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>
              {problemGroup.complaint_count} applications • {uniqueStudents.length} distinct students affected
            </div>
          </div>
        </div>

        {/* Student List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#000000' }}>Student Details</h3>
          
          {uniqueStudents.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Email</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>PRN</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Division</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueStudents.map(student => (
                    <tr key={student.user_id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{student.name || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#4B5563' }}>{student.email || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#4B5563' }}>{student.prn || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#4B5563' }}>{student.division || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: '#4B5563' }}>{student.contact_number || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#6B7280' }}>No student data available.</div>
          )}
        </div>

      </div>
    </div>
  );
}
