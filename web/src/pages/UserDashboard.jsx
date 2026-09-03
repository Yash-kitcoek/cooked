import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronDown, Lightbulb, ChevronRight, Filter, Mail, Bell } from 'lucide-react';

export function UserDashboard() {
  const { cases } = useAuth();
  const navigate = useNavigate();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All time');

  // Filter complaints based on search text
  const filteredCases = (cases || []).filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.title?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#000000', letterSpacing: '-0.02em' }}>
            My Complaints
          </h1>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>All complaints overview</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => navigate('/user/inbox')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#4B5563', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            <Mail size={16} /> Messages
          </button>
          <button 
            onClick={() => navigate('/user/notifications')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', color: '#4B5563', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            <Bell size={16} /> Notifications
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        {/* Search Bar */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              fontSize: '14px',
              backgroundColor: '#FFFFFF',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter Dropdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#6B7280',
          }}
        >
          <Filter size={16} />
          <span>Filter: <strong>{filter}</strong></span>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Complaint List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredCases.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
            No complaints found.
          </div>
        ) : (
          filteredCases.map(item => {
            const STEPS = ['pending', 'in_progress', 'resolved'];
            const currentStatus = (item.status || 'pending').toLowerCase();
            const currentIndex = STEPS.indexOf(currentStatus) === -1 ? 0 : STEPS.indexOf(currentStatus);
            
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/user/complaints/${item.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  gap: '24px'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', flexShrink: 0 }}>
                  <Lightbulb size={20} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{item.department || 'General'}</span>
                    <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
                    <span>SLA: 24h</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '24px' }}>
                    <div style={{ width: '4px', height: '40%', backgroundColor: '#D1D5DB', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '70%', backgroundColor: '#9CA3AF', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '100%', backgroundColor: '#6B7280', borderRadius: '2px' }} />
                    <div style={{ width: '4px', height: '60%', backgroundColor: '#9CA3AF', borderRadius: '2px' }} />
                  </div>
                  <span>Statistics in<br/>form of graphs</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0, marginLeft: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {STEPS.map((step, idx) => {
                      const isCurrent = idx === currentIndex;
                      const isCompleted = idx < currentIndex;
                      const bg = isCurrent ? '#000000' : isCompleted ? '#4B5563' : 'transparent';
                      const border = isCurrent ? '1px solid #000000' : isCompleted ? '1px solid #4B5563' : '1px solid #E5E7EB';
                      const color = isCurrent ? '#FFFFFF' : isCompleted ? '#FFFFFF' : '#9CA3AF';
                      const fw = isCurrent ? 800 : 600;
                      
                      return (
                        <React.Fragment key={step}>
                          <div style={{ backgroundColor: bg, border, color, fontWeight: fw, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', textTransform: 'capitalize' }}>
                            {step.replace('_', ' ')}
                          </div>
                          {idx < STEPS.length - 1 && <div style={{ width: '12px', height: '2px', backgroundColor: isCompleted ? '#4B5563' : '#E5E7EB' }} />}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <ChevronRight size={20} color="#9CA3AF" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
