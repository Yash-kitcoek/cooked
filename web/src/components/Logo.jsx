import React from 'react';
import { Link } from 'react-router-dom';

export function Logo({ to = "/", style = {} }) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', ...style }}>
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #fb923c 0%, #e11d48 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '13px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0
        }}
      >
        R
      </div>
      <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.03em', color: '#000000' }}>Resolve</span>
    </Link>
  );
}
