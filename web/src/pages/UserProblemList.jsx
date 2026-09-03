import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Lightbulb, ChevronRight } from 'lucide-react';

export function UserProblemList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock sub-problems since backend doesn't explicitly store them as a list
  const subProblems = [
    { id: 'sub-1', title: 'Low water pressure in 3rd floor', status: 'Unresolved' },
    { id: 'sub-2', title: 'No water in washrooms (2nd floor)', status: 'Unresolved' },
    { id: 'sub-3', title: 'Water overflow in corridor', status: 'Unresolved' },
    { id: 'sub-4', title: 'Water timing not followed', status: 'Unresolved' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api(`/complaints/${id}`);
        setComplaint(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, api]);

  if (loading || !complaint) {
    return <div style={{ padding: '32px' }}>Loading...</div>;
  }

  const isHigh = complaint.priority === 'Critical' || complaint.priority === 'Urgent' || complaint.priority === 'High';
  const badgeColor = isHigh ? '#E5E7EB' : '#F3F4F6';
  const badgeText = isHigh ? '#4B5563' : '#4B5563';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '32px' }}>
      <button
        onClick={() => navigate('/user/dashboard')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#6B7280',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '24px'
        }}
      >
        <ChevronLeft size={16} /> Back to Complaints
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#000000', letterSpacing: '-0.02em' }}>
          Problem List
        </h1>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>List of problems raised under this complaint</p>
      </div>

      {/* Parent Complaint Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '32px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', flexShrink: 0, marginRight: '24px' }}>
          <Lightbulb size={20} />
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#000000' }}>
            {complaint.title}
          </h3>
          <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{complaint.department || 'General'}</span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
            <span>SLA: 24h</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>Priority</span>
            <span style={{ 
              display: 'inline-block', 
              backgroundColor: isHigh ? '#F9FAFB' : '#F9FAFB', 
              color: isHigh ? '#4B5563' : '#6B7280', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 600,
              border: `1px solid ${isHigh ? '#D1D5DB' : '#E5E7EB'}`
            }}>
              {complaint.priority || 'Medium'}
            </span>
          </div>
          
          {complaint.category && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, marginBottom: '6px' }}>Category</span>
              <span style={{ 
                display: 'inline-block', 
                backgroundColor: '#F9FAFB', 
                color: '#4B5563', 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '12px', 
                fontWeight: 600,
                border: '1px solid #E5E7EB'
              }}>
                {complaint.category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Problems List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subProblems.map((prob, index) => (
          <div
            key={prob.id}
            onClick={() => navigate(`/user/complaints/${id}/detail`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: index === 0 ? '#F9FAFB' : '#FFFFFF',
              border: index === 0 ? '1px solid #E5E7EB' : '1px solid transparent',
              borderBottom: index !== 0 ? '1px solid #E5E7EB' : '1px solid #E5E7EB',
              borderRadius: index === 0 ? '12px' : '0',
              padding: '16px 24px',
              cursor: 'pointer',
            }}
          >
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: '#000000' }}>
              {prob.title}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '100px',
                  backgroundColor: '#F3F4F6',
                  color: '#6B7280',
                  fontWeight: 600,
                  fontSize: '12px',
                }}
              >
                {prob.status}
              </div>
              <ChevronRight size={18} color="#9CA3AF" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
