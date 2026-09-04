import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Compass, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const deps = [
  "Computer Science",
  "Mechanical",
  "Civil",
  "Electronics",
  "Information Technology",
  "Chemical",
];
const divs = ["A", "B", "C", "D"];

export function ProfileSetup() {
  const { api, session, setSession, message, setMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [f, setF] = useState({
    full_name: "",
    prn_number: "",
    roll_no: "",
    contact_number: "",
    department: "",
    division: "",
    year_semester: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // If the user somehow already has profile_completed = true, skip onboarding
  useEffect(() => {
    if (session?.profile_completed) {
      const from = location.state?.from || "/student";
      navigate(from, { replace: true });
    } else {
      setIsChecking(false);
    }
  }, [session, navigate, location]);

  const ch = (e) => setF({ ...f, [e.target.name]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await api("/students/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          full_name: f.full_name,
          department: f.department,
          prn_number: f.prn_number,
          division: f.division,
          roll_no: f.roll_no,
          year_semester: f.year_semester || null,
          contact_number: f.contact_number || null,
        }),
      });

      // Update session to reflect completion
      setSession({ ...session, profile_completed: true });
      setMessage("Profile setup complete!");
      
      // Redirect to intended destination or default dashboard
      const from = location.state?.from || "/student";
      navigate(from, { replace: true });
    } catch (e) {
      setErrorMessage(e.message);
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #DCEEF7 0%, #E4F5EE 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontWeight: 600, color: '#334155' }}>Checking your profile...</p>
      </main>
    );
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
          maxWidth: '520px',
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

        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: '#0B0B12',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Welcome to Resolve
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#64748b',
            margin: '0 0 28px 0',
            fontWeight: 500,
          }}
        >
          Let's set up your profile. This will only take a minute.
        </p>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              Full Name
            </label>
            <input
              name="full_name"
              type="text"
              placeholder="Your full name"
              required
              value={f.full_name}
              onChange={ch}
              style={{
                width: '100%',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                padding: '12px 14px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#0B0B12',
                backgroundColor: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Department
              </label>
              <select
                name="department"
                value={f.department}
                onChange={ch}
                required
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Select</option>
                {deps.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Division
              </label>
              <select
                name="division"
                value={f.division}
                onChange={ch}
                required
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">Select</option>
                {divs.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Roll Number
              </label>
              <input
                name="roll_no"
                type="text"
                placeholder="e.g. 101"
                required
                value={f.roll_no}
                onChange={ch}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                PRN Number
              </label>
              <input
                name="prn_number"
                type="text"
                placeholder="Required"
                required
                value={f.prn_number}
                onChange={ch}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px',
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

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Year / Semester (Optional)
              </label>
              <input
                name="year_semester"
                type="text"
                placeholder="e.g. 3rd Year"
                value={f.year_semester}
                onChange={ch}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#0B0B12',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Contact Number (Optional)
              </label>
              <input
                name="contact_number"
                type="text"
                placeholder="Phone number"
                value={f.contact_number}
                onChange={ch}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  padding: '12px 14px',
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

          {errorMessage && (
            <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, marginTop: '6px' }}>
              {errorMessage}
            </p>
          )}

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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? (
              'Saving...'
            ) : (
              <>
                <Save size={18} /> Continue
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
