import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminSuggestionsList() {
  const { cases } = useAuth();
  const navigate = useNavigate();

  const groupedCases = React.useMemo(() => {
    const groups = {};
    (cases || []).forEach(c => {
      const key = c.title;
      if (!groups[key]) {
        groups[key] = {
          centralThought: c.title,
          noOfApplications: 0,
          cases: [],
          problemDescription: c.description
        };
      }
      groups[key].noOfApplications += 1;
      groups[key].cases.push(c);
    });
    return Object.values(groups);
  }, [cases]);

  return (
    <div style={{ padding: '48px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
          Admin Suggestions
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {groupedCases.map((group, idx) => (
          <div key={idx} style={{
            backgroundColor: '#FFFFFF',
            border: '4px solid var(--brand-primary)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            gap: '24px'
          }}>
            
            {/* Left: Stacked Box */}
            <div style={{ 
              border: '2px solid var(--brand-primary)', 
              borderRadius: '8px', 
              padding: '20px 24px', 
              width: '280px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000' }}>
                Central Thought
              </div>
              <div style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>
                No_of_application
              </div>
            </div>

            {/* Middle: The Problem Box */}
            <div style={{ 
              flex: 1, 
              border: '2px solid var(--brand-primary)', 
              borderRadius: '8px', 
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 500, color: '#000000' }}>
                The problem
              </div>
            </div>

            {/* Right: Resolve Button */}
            <div>
              <button
                onClick={() => navigate(`/department/suggestions/${group.cases[0].id}`)}
                style={{
                  backgroundColor: '#4B5563', // Green
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Resolve
              </button>
            </div>

          </div>
        ))}

        {groupedCases.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: '#6B7280', fontSize: '16px' }}>
            No suggestions available.
          </div>
        )}
      </div>
    </div>
  );
}
