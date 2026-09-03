import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Signup() {
  const { setMessage, api } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  async function handleSignup(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, username: username.trim() }),
      });
      setMessage('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Email may already be registered.');
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
      }}
    >
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
          Create your account
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 28px 0',
            fontWeight: 500,
          }}
        >
          Join Resolve and start managing grievances
        </p>

        {/* Form */}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          {/* Username Field */}
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
                placeholder="e.g. johndoe"
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

          {/* Email address Field */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type="password"
                placeholder="Min. 8 characters"
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
            </div>
            {errorMessage && (
              <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, marginTop: '6px' }}>
                {errorMessage}
              </p>
            )}
          </div>

          {/* Primary Create Account Button */}
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
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
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
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3D4FFF', fontWeight: 700, textDecoration: 'none' }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
