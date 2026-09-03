import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminLayout } from './pages/admin/AdminLayout';
import { StudentLayout } from './pages/student/StudentLayout';
import { StudentHome } from './pages/student/StudentHome';
import { StudentComplaints } from './pages/student/StudentComplaints';
import { StudentNewComplaint } from './pages/student/StudentNewComplaint';
import { StudentComplaintDetail } from './pages/student/StudentComplaintDetail';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentNotifications } from './pages/student/StudentNotifications';
import { StudentProblems } from './pages/student/StudentProblems';
import { StudentProblemDetail } from './pages/student/StudentProblemDetail';
import { AdminHome } from './pages/admin/AdminHome';
import { AdminProblems } from './pages/admin/AdminProblems';
import { AdminProblemDetail } from './pages/admin/AdminProblemDetail';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminComplaintDetail } from './pages/admin/AdminComplaintDetail';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminStaff } from './pages/admin/AdminStaff';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminProfile } from './pages/admin/AdminProfile';
import { StaffLayout } from './pages/staff/StaffLayout';
import { StaffHome } from './pages/staff/StaffHome';
import { StaffProblems } from './pages/staff/StaffProblems';
import { StaffProblemDetail } from './pages/staff/StaffProblemDetail';
import { StaffComplaints } from './pages/staff/StaffComplaints';
import { CheckCircle2, LogOut, Info, AlertTriangle, X } from 'lucide-react';
import './styles.css';

function ToastContainer() {
  const { message, setMessage } = useAuth();

  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage('');
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, setMessage]);

  if (!message) return null;

  const msgLower = String(message).toLowerCase();
  const isLogout = msgLower.includes('logout') || msgLower.includes('logged out') || msgLower.includes('sign out') || msgLower.includes('signed out');
  const isLoginOrSuccess = msgLower.includes('welcome') || msgLower.includes('login') || msgLower.includes('logged in') || msgLower.includes('success') || msgLower.includes('resolved') || msgLower.includes('created') || msgLower.includes('reopened');

  const type = isLogout ? 'error' : isLoginOrSuccess ? 'success' : 'info';

  return (
    <div key={message} className={`toast-popup toast-${type}`} role="status">
      {type === 'success' && <CheckCircle2 size={18} className="toast-icon success" />}
      {type === 'error' && <LogOut size={18} className="toast-icon error" />}
      {type === 'info' && <Info size={18} className="toast-icon info" />}
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={() => setMessage('')} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminHome />} />
            <Route path="problems" element={<AdminProblems />} />
            <Route path="problems/:id" element={<AdminProblemDetail />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="complaints/:id" element={<AdminComplaintDetail />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          <Route path="/staff" element={<ProtectedRoute role="staff"><StaffLayout /></ProtectedRoute>}>
            <Route index element={<StaffHome />} />
            <Route path="problems" element={<StaffProblems />} />
            <Route path="problems/:id" element={<StaffProblemDetail />} />
            <Route path="complaints" element={<StaffComplaints />} />
          </Route>

          <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
            <Route index element={<StudentHome />} />
            <Route path="problems" element={<StudentProblems />} />
            <Route path="problems/:id" element={<StudentProblemDetail />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="complaints/:id" element={<StudentComplaintDetail />} />
            <Route path="new" element={<StudentNewComplaint />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="notifications" element={<StudentNotifications />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}
