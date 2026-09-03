import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AdminSuggestionDetail() {
  const { id } = useParams();
  const { cases } = useAuth();
  
  const [complaint, setComplaint] = useState(null);

  useEffect(() => {
    const found = cases?.find((c) => String(c.id) === String(id));
    if (found) setComplaint(found);
  }, [id, cases]);

  if (!complaint) return <div style={{ padding: '48px' }}>Loading...</div>;

  return (
    <div style={{ padding: '48px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#000000', margin: 0, letterSpacing: '-0.02em' }}>
          Suggestion Details
        </h2>
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
        
        {/* Top Row */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
          
          {/* Left Box */}
          <div style={{ 
            flex: 1, 
            border: '2px solid var(--brand-primary)', 
            borderRadius: '8px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000' }}>
              Central Thought
            </div>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#000000' }}>
              No_of_application
            </div>
          </div>

          {/* Right Box (The Problem) */}
          <div style={{ 
            flex: 1,
            border: '2px solid var(--brand-primary)', 
            borderRadius: '8px', 
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
             <div style={{ fontSize: '18px', fontWeight: 700, color: '#000000' }}>
                The problem
             </div>
          </div>
        </div>

        {/* Improved Solution Box */}
        <div style={{
            flex: 1,
            width: '100%',
            border: '2px solid var(--brand-primary)',
            borderRadius: '8px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
           <div style={{ fontSize: '24px', fontWeight: 700, color: '#000000' }}>
              Improved solution
           </div>
        </div>

      </div>
    </div>
  );
}
