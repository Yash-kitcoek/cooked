import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, role }) {
  const { token, session } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!session?.role) return <Navigate to="/login" replace />;
  if (role && session.role !== role) {
    const destination = session.role === 'admin' ? '/admin' : session.role === 'staff' ? '/staff' : session.role === 'student' ? '/student' : '/login';
    return <Navigate to={destination} replace />;
  }
  
  if (session.role === 'student' && !session.profile_completed && location.pathname !== '/profile/setup') {
    return <Navigate to="/profile/setup" replace state={{ from: location.pathname }} />;
  }

  return children;
}
