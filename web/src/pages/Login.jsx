import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Compass, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { token, session, setToken, setSession, message, setMessage, api, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();



  useEffect(() => {
    if (!token || !session?.role) return;
    if (session.role === 'admin') navigate('/admin', { replace: true });
    else if (session.role === 'staff') navigate('/staff', { replace: true });
    else if (session.role === 'student') {
      if (!session.profile_completed) navigate('/profile/setup', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [token, session, navigate]);

  async function login(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const cleanUsername = username.trim();

    if (cleanUsername.includes('@')) {
      setErrorMessage('Please enter your username, not an email address to log in.');
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const role = data.role || data.user?.role;
      const accessToken = data.access_token || data.token;
      const normalizedSession = { ...data, ...(data.user || {}), role };
      if (!accessToken || !role) throw new Error('Login response did not contain access_token and role.');
      if (!['admin', 'staff', 'student'].includes(role)) throw new Error('Unsupported account role.');
      setToken(accessToken);
      setSession(normalizedSession);
      setMessage('Welcome back to Resolve!');
      
      if (role === 'student' && !normalizedSession.profile_completed) {
        navigate('/profile/setup', { replace: true });
      } else {
        navigate(role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/student', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #DCEEF7 0%, #E4F5EE 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Top Left Navigation Buttons */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            color: '#0F0F14',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
          }}
        >
          <ArrowLeft size={16} /> Home
        </Link>

        <Link
          to="/transparency"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            color: '#5B4FE9',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid rgba(91, 79, 233, 0.2)',
            boxShadow: '0 4px 14px rgba(91, 79, 233, 0.08)',
          }}
        >
          <ShieldCheck size={16} /> Departmental Dashboard
        </Link>
      </div>

      <div
        style={{
          maxWidth: '440px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Circle Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#3D4FFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(61, 79, 255, 0.25)',
          }}
        >
          <Compass size={24} />
        </div>

        {/* Heading & Subtitle */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0B0B12',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome back
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 28px 0',
            fontWeight: 500,
          }}
        >
          Log in to your Resolve account
        </p>

        {/* Form */}
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          {/* Username / Email Field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="text"
                placeholder="Your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  paddingTop: '12px',
                  paddingRight: '14px',
                  paddingBottom: '12px',
                  paddingLeft: '42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  paddingTop: '12px',
                  paddingRight: '14px',
                  paddingBottom: '12px',
                  paddingLeft: '42px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  color: "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {(errorMessage || message) && (
              <p
                style={{
                  color: errorMessage ? '#ef4444' : '#0F6E82',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginTop: '6px',
                }}
              >
                {errorMessage || message}
              </p>
            )}
          </div>

          {/* Primary Log In Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              backgroundColor: '#3D4FFF',
              color: '#ffffff',
              fontWeight: 700,
              padding: '14px',
              borderRadius: '12px',
              fontSize: '15px',
              border: 0,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: '8px',
              boxShadow: '0 4px 14px rgba(61, 79, 255, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '28px 0 20px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ padding: '0 12px', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Bottom Link */}
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: '#3D4FFF', fontWeight: 700, textDecoration: 'none' }}>
            Sign up for free
          </Link>
        </p>

        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <Link to="/transparency" style={{ color: '#5B4FE9', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} /> View Departmental Dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}
