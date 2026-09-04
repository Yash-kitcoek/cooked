import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Mail,
  ScanLine,
  Layers,
  BarChart3,
  Cpu,
  UserCheck,
  Send,
  Sliders,
  TrendingUp,
  History,
  Check,
  ChevronRight,
  Activity,
  AlertCircle,
  ExternalLink,
  BookOpen,
  DollarSign,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Home() {
  const { session } = useAuth();
  const navigate = useNavigate();

  // Hero interactive state
  const [analyzed, setAnalyzed] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Section 4 Prioritization tabs
  const [priorityTab, setPriorityTab] = useState('priority'); // 'priority' | 'impact' | 'sla'

  // Section 9 Grounded Response button state
  const [responseAction, setResponseAction] = useState('idle'); // 'idle' | 'editing' | 'sent'
  const [draftText, setDraftText] = useState(
    "We acknowledge the disruption in Hostel Block A. The issue has been assigned to the Estate Department and is currently being investigated. We will provide an update as soon as the next resolution milestone is reached."
  );

  const handleHeroAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 600);
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', backgroundColor: '#FFFFFF', color: '#0F0F14', minHeight: '100vh' }}>
      
      {/* ── TOP NAVIGATION ────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E7E8EE',
        padding: '0 clamp(20px, 4vw, 60px)',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #5B4FE9 0%, #3D4FFF 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '16px',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 4px 12px rgba(91, 79, 233, 0.3)'
          }}>
            R
          </div>
          <span style={{ fontWeight: 800, fontSize: '21px', letterSpacing: '-0.03em', color: '#0F0F14' }}>
            Resolve
          </span>
        </Link>

        {/* Center Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden-mobile">
          <a href="#intake" style={{ color: '#6B6F76', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Intake</a>
          <a href="#incident-intelligence" style={{ color: '#6B6F76', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Incident Clustering</a>
          <a href="#prioritization" style={{ color: '#6B6F76', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Prioritization</a>
          <a href="#routing" style={{ color: '#6B6F76', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Smart Routing</a>
          <a href="#analytics" style={{ color: '#6B6F76', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>Analytics</a>
          <Link to="/transparency" style={{ color: '#5B4FE9', textDecoration: 'none', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> View Departmental Dashboard
          </Link>
        </div>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {session ? (
            <Link
              to={session.role === 'admin' ? '/admin' : session.role === 'staff' ? '/staff' : '/student'}
              style={{
                backgroundColor: '#5B4FE9',
                color: '#ffffff',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(91, 79, 233, 0.28)',
              }}
            >
              Open Console →
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ color: '#0F0F14', textDecoration: 'none', fontSize: '13px', fontWeight: 700, padding: '8px 14px' }}>
                Sign In
              </Link>
              <Link
                to="/signup"
                style={{
                  backgroundColor: '#5B4FE9',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(91, 79, 233, 0.28)',
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── 1. HERO SECTION ────────────────────────────────────────── */}
      <section style={{
        padding: '72px clamp(20px, 4vw, 60px) 80px',
        backgroundColor: '#F4F5FA',
        borderBottom: '1px solid #E7E8EE',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: '48px', alignItems: 'center' }}>
          {/* Left Hero Text */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#EDEBFC',
              color: '#5B4FE9',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}>
              <Sparkles size={14} /> AI-POWERED GRIEVANCE INTELLIGENCE
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 4.5vw, 54px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              color: '#0F0F14',
              margin: '0 0 20px 0'
            }}>
              Turn every complaint into actionable intelligence.
            </h1>

            <p style={{
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#6B6F76',
              maxWidth: '560px',
              margin: '0 0 32px 0'
            }}>
              Understand what is happening across your institution, prioritize what matters most, and move every grievance toward resolution.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <Link
                to="/login"
                style={{
                  backgroundColor: '#5B4FE9',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(91, 79, 233, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Explore the console <ArrowRight size={16} />
              </Link>
              <a
                href="#intake"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#0F0F14',
                  border: '1px solid #E7E8EE',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right Floating UI Mock: Complaint Intelligence Panel */}
          <div>
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E7E8EE',
              boxShadow: '0 20px 50px rgba(15, 15, 20, 0.08), 0 4px 12px rgba(0,0,0,0.02)',
              padding: '28px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F1F5', paddingBottom: '16px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5B4FE9' }} />
                  <strong style={{ fontSize: '13px', letterSpacing: '0.02em' }}>Complaint Intelligence Panel</strong>
                </div>
                <span style={{ font: '800 11px monospace', color: '#9CA0A8', backgroundColor: '#F4F5FA', padding: '3px 8px', borderRadius: '6px' }}>
                  INCIDENT #1042
                </span>
              </div>

              {/* Submitter Quote Box */}
              <div style={{ backgroundColor: '#F4F5FA', borderRadius: '12px', padding: '16px', border: '1px solid #E7E8EE', marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', color: '#6B6F76', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Student Submission
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F0F14', lineHeight: 1.45 }}>
                  “Block A has had no water supply for three days.”
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <button
                  onClick={handleHeroAnalyze}
                  disabled={analyzing}
                  style={{
                    backgroundColor: '#EDEBFC',
                    color: '#5B4FE9',
                    border: '1px solid rgba(91,79,233,0.2)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} /> {analyzing ? 'Analyzing…' : 'Re-Analyze AI Signals'}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 800, backgroundColor: '#FEF2F2', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(220,38,38,0.2)' }}>
                    SLA Risk 89% · Escalation approaching
                  </span>
                </div>
              </div>

              {/* AI Analysis Grid */}
              <div style={{
                backgroundColor: '#FBFBFE',
                border: '1px solid #E7E8EE',
                borderRadius: '14px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px 16px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: '#6B6F76', fontSize: '11px', fontWeight: 600, display: 'block' }}>Category</span>
                  <strong style={{ color: '#0F0F14' }}>Infrastructure</strong>
                </div>
                <div>
                  <span style={{ color: '#6B6F76', fontSize: '11px', fontWeight: 600, display: 'block' }}>Department</span>
                  <strong style={{ color: '#0F0F14' }}>Estate / Maintenance</strong>
                </div>
                <div>
                  <span style={{ color: '#6B6F76', fontSize: '11px', fontWeight: 600, display: 'block' }}>Urgency</span>
                  <strong style={{ color: '#DC2626' }}>HIGH</strong>
                </div>
                <div>
                  <span style={{ color: '#6B6F76', fontSize: '11px', fontWeight: 600, display: 'block' }}>Impact</span>
                  <strong style={{ color: '#0F0F14' }}>126 students affected</strong>
                </div>
                <div>
                  <span style={{ color: '#6B6F76', fontSize: '11px', fontWeight: 600, display: 'block' }}>Sentiment</span>
                  <strong style={{ color: '#D98A1F' }}>Distressed</strong>
                </div>
                <div>
                  <span style={{ color: '#6B6F76', fontSize: '11px', fontWeight: 600, display: 'block' }}>Similar Cases</span>
                  <strong style={{ color: '#5B4FE9' }}>47 related reports</strong>
                </div>
              </div>

              {/* Priority Bottom Banner */}
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                border: '1px solid rgba(220,38,38,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>Calculated Priority</span>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#DC2626', letterSpacing: '0.05em' }}>P1 — CRITICAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. INTAKE CHANNELS ──────────────────────────────────────── */}
      <section id="intake" style={{ padding: '88px clamp(20px, 4vw, 60px)', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E7E8EE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              ONE INTELLIGENCE LAYER
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 14px 0' }}>
              Every way a complaint reaches you.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
              From online complaints and official email to PDFs, scanned letters and structured forms, bring every grievance into one intelligent workflow.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {/* Card 1 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <Send size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0' }}>Student portal</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
                Submit and track complaints directly with real-time milestone updates and resolution feedback.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <Mail size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0' }}>Official email</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
                Automatically extract, classify and route incoming grievances sent to dean, warden or registrar mailboxes.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <FileText size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0' }}>PDF & documents</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
                Extract complaint information from structured and unstructured representations, circulars and forms.
              </p>
            </div>

            {/* Card 4 */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <ScanLine size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0' }}>Scanned letters</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
                OCR converts physical submissions and handwritten grievance letters into actionable digital cases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. INCIDENT INTELLIGENCE (CLUSTERING) ──────────────────── */}
      <section id="incident-intelligence" style={{ padding: '88px clamp(20px, 4vw, 60px)', backgroundColor: '#F4F5FA', borderBottom: '1px solid #E7E8EE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              SEMANTIC DEDUPLICATION
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px 0', lineHeight: 1.15 }}>
              Don’t just count complaints. Understand the incident.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.65, margin: '0 0 24px 0' }}>
              Multiple people can report the same underlying problem. Resolve connects semantically similar complaints and creates a <strong>Master Incident</strong>—giving administrators a real picture of institutional impact.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', fontWeight: 600, color: '#0F0F14' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#1E9E5A" /> Eliminates duplicate triage effort for staff
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#1E9E5A" /> Calculates true student impact and population affected
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#1E9E5A" /> One resolution broadcasts to every affected student
              </div>
            </div>
          </div>

          {/* Visual: 3 Stacked Complaint Cards Merging into Master Incident */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#9CA0A8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Individual Inflow Submissions
            </div>
            
            {/* Stacked Incoming Cards */}
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <span>“Water unavailable in Hostel Block A”</span>
                <span style={{ fontSize: '11px', color: '#9CA0A8', font: '700 11px monospace' }}>#1042-A</span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <span>“No water supply since yesterday evening”</span>
                <span style={{ fontSize: '11px', color: '#9CA0A8', font: '700 11px monospace' }}>#1042-B</span>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <span>“Hostel Block A water problem continues”</span>
                <span style={{ fontSize: '11px', color: '#9CA0A8', font: '700 11px monospace' }}>#1042-C</span>
              </div>
            </div>

            {/* Merge Arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', color: '#5B4FE9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, backgroundColor: '#EDEBFC', padding: '4px 14px', borderRadius: '9999px' }}>
                <Layers size={14} /> Semantic Grouping Engine (98.4% Match)
              </div>
            </div>

            {/* Master Incident Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #5B4FE9',
              borderRadius: '16px',
              padding: '22px',
              boxShadow: '0 12px 30px rgba(91,79,233,0.12)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5B4FE9', backgroundColor: '#EDEBFC', padding: '3px 8px', borderRadius: '4px' }}>
                  MASTER INCIDENT CLUSTER
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '3px 8px', borderRadius: '4px' }}>
                  CRITICAL
                </span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0', color: '#0F0F14' }}>
                Hostel Block A — Water Supply Failure
              </h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', margin: '0 0 16px 0' }}>
                Unified incident handling 47 student complaints across 3 floors.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #F0F1F5', paddingTop: '14px', fontSize: '12px' }}>
                <div><strong>47</strong> <span style={{ color: '#6B6F76' }}>complaints</span></div>
                <div>·</div>
                <div><strong>126</strong> <span style={{ color: '#6B6F76' }}>students affected</span></div>
                <div>·</div>
                <div><strong>3d</strong> <span style={{ color: '#DC2626', fontWeight: 700 }}>unresolved</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PRIORITIZATION ENGINE (BRIGHT-INDIGO & GREY PALETTE) ─ */}
      <section id="prioritization" style={{
        padding: '88px clamp(20px, 4vw, 60px)',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E7E8EE',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F5FA 100%)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              MULTI-SIGNAL ENGINE
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 14px 0', color: '#0F0F14' }}>
              Prioritize by impact.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
              Every complaint gets a reason. Every priority can be explained. The system continuously considers impact, recurrence, sentiment, unresolved duration and SLA pressure.
            </p>
          </div>

          {/* Interactive Tab Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
            {[
              { id: 'priority', label: 'Priority Distribution' },
              { id: 'impact', label: 'Affected Population' },
              { id: 'sla', label: 'SLA Pressure' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPriorityTab(t.id)}
                style={{
                  backgroundColor: priorityTab === t.id ? '#5B4FE9' : '#FFFFFF',
                  color: priorityTab === t.id ? '#FFFFFF' : '#6B6F76',
                  border: priorityTab === t.id ? '1px solid #5B4FE9' : '1px solid #E7E8EE',
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: priorityTab === t.id ? '0 4px 12px rgba(91, 79, 233, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          {priorityTab === 'priority' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#DC2626', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>P1 — CRITICAL</div>
                <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.04em', color: '#0F0F14' }}>90</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '6px', margin: 0 }}>Campus-wide outages, safety, urgent health</p>
                <div style={{ height: '6px', backgroundColor: '#F0F1F5', borderRadius: '9999px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ width: '90%', height: '100%', backgroundColor: '#DC2626', borderRadius: '9999px' }} />
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#D98A1F', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>P2 — HIGH</div>
                <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.04em', color: '#0F0F14' }}>49</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '6px', margin: 0 }}>Block disruptions, exam portal delays</p>
                <div style={{ height: '6px', backgroundColor: '#F0F1F5', borderRadius: '9999px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ width: '49%', height: '100%', backgroundColor: '#D98A1F', borderRadius: '9999px' }} />
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#E0A93B', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>P3 — MEDIUM</div>
                <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.04em', color: '#0F0F14' }}>56</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '6px', margin: 0 }}>Classroom maintenance, library tickets</p>
                <div style={{ height: '6px', backgroundColor: '#F0F1F5', borderRadius: '9999px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ width: '56%', height: '100%', backgroundColor: '#E0A93B', borderRadius: '9999px' }} />
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#1E9E5A', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>P4 — LOW</div>
                <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.04em', color: '#0F0F14' }}>31 <span style={{ fontSize: '13px', color: '#1E9E5A', fontWeight: 700 }}>+24.8%</span></div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '6px', margin: 0 }}>General queries, elective overlap</p>
                <div style={{ height: '6px', backgroundColor: '#F0F1F5', borderRadius: '9999px', marginTop: '16px', overflow: 'hidden' }}>
                  <div style={{ width: '31%', height: '100%', backgroundColor: '#1E9E5A', borderRadius: '9999px' }} />
                </div>
              </div>
            </div>
          )}

          {priorityTab === 'impact' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#5B4FE9', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>HIGH IMPACT</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>&gt; 50 Students</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Automatically boosted to P1 or Urgent tier</p>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#5B4FE9', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>MEDIUM IMPACT</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>10 – 50 Students</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Escalated to High priority with priority audit note</p>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#5B4FE9', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>LOW IMPACT</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>2 – 9 Students</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Grouped under shared departmental topic</p>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#5B4FE9', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>INDIVIDUAL</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>1 Student</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Direct one-on-one student grievance track</p>
              </div>
            </div>
          )}

          {priorityTab === 'sla' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#DC2626', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>CRITICAL RISK</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>&gt; 90% SLA Consumed</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Immediate automated notification to HOD/Dean</p>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#D98A1F', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>APPROACHING</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>75% – 90% SLA</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Warning badge highlighted in department queue</p>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#1E9E5A', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>ON TRACK</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>&lt; 75% SLA</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Standard operational processing velocity</p>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                <div style={{ color: '#5B4FE9', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>RESOLVED</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F0F14' }}>87.4% Met SLA</div>
                <p style={{ fontSize: '12px', color: '#6B6F76', marginTop: '8px', margin: 0 }}>Institutional compliance across all 11 depts</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. EXPLAINABLE PRIORITY ─────────────────────────────────── */}
      <section style={{ padding: '88px clamp(20px, 4vw, 60px)', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E7E8EE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              TRANSPARENT AI SCORING
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px 0', lineHeight: 1.15 }}>
              Every priority has a reason.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.65, margin: '0 0 24px 0' }}>
              AI should not produce a mysterious number. Administrators can see exactly which signals contributed to a complaint's priority.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#6B6F76' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#5B4FE9' }} />
                No black-box ranking algorithms
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#5B4FE9' }} />
                Weighted scoring backed by student volume, duration and severity
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#5B4FE9' }} />
                Auditable decision trail for UGC / NAAC compliance
              </div>
            </div>
          </div>

          {/* Example Score Breakdown Card */}
          <div style={{
            backgroundColor: '#F4F5FA',
            border: '1px solid #E7E8EE',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ font: '800 11px monospace', color: '#6B6F76' }}>CASE #1042 BREAKDOWN</span>
              <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '9999px' }}>
                PRIORITY P1 (CRITICAL)
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F0F14', marginBottom: '20px' }}>
              Hostel Block A – Water Supply Failure
            </div>

            {/* Signals Stack */}
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E7E8EE', fontSize: '13px' }}>
                <span>Affected students (126 reports)</span>
                <strong style={{ color: '#5B4FE9' }}>+35</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E7E8EE', fontSize: '13px' }}>
                <span>Service disruption (Essential water supply)</span>
                <strong style={{ color: '#5B4FE9' }}>+25</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E7E8EE', fontSize: '13px' }}>
                <span>Repeated complaints (47 duplicates)</span>
                <strong style={{ color: '#5B4FE9' }}>+20</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E7E8EE', fontSize: '13px' }}>
                <span>SLA proximity (&gt; 80% consumed)</span>
                <strong style={{ color: '#5B4FE9' }}>+10</strong>
              </div>
            </div>

            {/* Total Score Bar */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#5B4FE9',
              borderRadius: '12px',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                  Total Priority Score
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em' }}>
                  90 / 100
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                Exceeds 85 Threshold<br />Immediate Escalation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. SMART ROUTING ────────────────────────────────────────── */}
      <section id="routing" style={{ padding: '88px clamp(20px, 4vw, 60px)', backgroundColor: '#F4F5FA', borderBottom: '1px solid #E7E8EE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              ZERO MANUAL SORTING
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 14px 0' }}>
              The right complaint. To the right department.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
              AI classification turns unstructured grievances into clear, actionable workflows—without forcing administrators to manually sort every submission.
            </p>
          </div>

          {/* Workflow Flow Visual */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '48px'
          }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              1. Student Complaint
            </div>
            <ArrowRight size={16} color="#9CA0A8" />
            <div style={{ backgroundColor: '#5B4FE9', color: '#FFFFFF', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, boxShadow: '0 2px 8px rgba(91,79,233,0.28)' }}>
              2. AI Classification & Keyword Policy
            </div>
            <ArrowRight size={16} color="#9CA0A8" />
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              3. Responsible Team Queue
            </div>
          </div>

          {/* 4 Department Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                <Building size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0' }}>Hostel</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                Maintenance, cleanliness, mess food quality and warden notifications.
              </p>
              <div style={{ fontSize: '11px', font: '700 11px monospace', color: '#5B4FE9', backgroundColor: '#EDEBFC', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                Maintenance / Warden
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                <BookOpen size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0' }}>Academic</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                Exam timetables, hall tickets, elective registrations and faculty coordination.
              </p>
              <div style={{ fontSize: '11px', font: '700 11px monospace', color: '#5B4FE9', backgroundColor: '#EDEBFC', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                Academic Section / HOD
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                <DollarSign size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0' }}>Finance</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                Fee verification, scholarship disbursement and security refund processing.
              </p>
              <div style={{ fontSize: '11px', font: '700 11px monospace', color: '#5B4FE9', backgroundColor: '#EDEBFC', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                Accounts / Scholarship Cell
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '16px' }}>
                <ShieldAlert size={20} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px 0' }}>Safety</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.5, margin: '0 0 14px 0' }}>
                Campus security, emergency alerts, laboratory protocols and discipline.
              </p>
              <div style={{ fontSize: '11px', font: '700 11px monospace', color: '#5B4FE9', backgroundColor: '#EDEBFC', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>
                Security / Administration
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. SLA & ESCALATION (BRIGHT LAVENDER & INDIGO PALETTE) ─ */}
      <section style={{
        padding: '88px clamp(20px, 4vw, 60px)',
        backgroundColor: '#F8F9FD',
        borderBottom: '1px solid #E7E8EE',
        background: 'linear-gradient(135deg, #F4F5FA 0%, #EDEBFC 100%)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              AUTOMATED ACCOUNTABILITY
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px 0', color: '#0F0F14', lineHeight: 1.15 }}>
              Never let an important complaint disappear.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.65, margin: '0 0 32px 0' }}>
              Monitor resolution commitments in real time. When an incident approaches its SLA threshold, automatically escalate it through the configured institutional hierarchy.
            </p>
            <Link
              to="/login"
              style={{
                backgroundColor: '#5B4FE9',
                color: '#FFFFFF',
                padding: '13px 26px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(91, 79, 233, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Explore escalation <ArrowRight size={16} />
            </Link>
          </div>

          {/* Example Card: Master Incident #1042 Escalation */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid rgba(91, 79, 233, 0.2)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 16px 40px rgba(91, 79, 233, 0.08), 0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', font: '800 11px monospace', color: '#5B4FE9', backgroundColor: '#EDEBFC', padding: '3px 8px', borderRadius: '4px' }}>
                MASTER INCIDENT #1042
              </span>
              <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.25)', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '9999px' }}>
                ESCALATION RISK (89%)
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#0F0F14' }}>
              Hostel Water Supply
            </h3>

            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6B6F76', marginBottom: '20px' }}>
              <span>Priority: <strong style={{ color: '#DC2626' }}>P1</strong></span>
              <span>·</span>
              <span>Affected: <strong style={{ color: '#0F0F14' }}>126 students</strong></span>
              <span>·</span>
              <span>Open for: <strong style={{ color: '#D98A1F' }}>68h / 72h max</strong></span>
            </div>

            {/* SLA Consumed Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#6B6F76' }}>
                <span>SLA Consumed (89%)</span>
                <span style={{ color: '#DC2626' }}>4h remaining</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#F0F1F5', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: '89%', height: '100%', backgroundColor: '#DC2626', borderRadius: '9999px' }} />
              </div>
            </div>

            {/* Escalation Hierarchy Chain */}
            <div style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              padding: '16px',
              display: 'grid',
              gap: '10px',
              fontSize: '12px',
              border: '1px solid #E7E8EE'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B6F76' }}>Current Owner:</span>
                <strong style={{ color: '#0F0F14' }}>Estate Department</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6B6F76' }}>Next Escalation Tier:</span>
                <strong style={{ color: '#DC2626' }}>Dean / Administration (in 4 hours)</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. HUMAN IN THE LOOP ────────────────────────────────────── */}
      <section style={{ padding: '88px clamp(20px, 4vw, 60px)', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E7E8EE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              GOVERNANCE & TRUST
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 14px 0' }}>
              AI where it helps. Humans where it matters.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
              Uncertain classifications, duplicate merges and AI-generated responses remain reviewable by authorized officers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Card 1 */}
            <div style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '28px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <Cpu size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0' }}>AI analysis</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
                Classification, extraction, sentiment, impact and similarity are handled automatically in real-time.
              </p>
            </div>

            {/* Card 2 */}
            <div style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '28px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <UserCheck size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0' }}>Human review</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
                Officers can approve uncertain classifications, merges and actions before they become operational.
              </p>
            </div>

            {/* Card 3 */}
            <div style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '28px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#EDEBFC', color: '#5B4FE9', display: 'grid', placeItems: 'center', marginBottom: '20px' }}>
                <History size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0' }}>Audit trail</h3>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
                Every important action is recorded with the responsible user, reason and immutable timestamp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. GROUNDED RESPONSE ────────────────────────────────────── */}
      <section style={{ padding: '88px clamp(20px, 4vw, 60px)', backgroundColor: '#F4F5FA', borderBottom: '1px solid #E7E8EE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '48px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              POLICY-GROUNDED ASSISTANCE
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 16px 0', lineHeight: 1.15 }}>
              Generate responses. Keep the decision with the officer.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.65, margin: '0 0 24px 0' }}>
              Create context-aware response drafts using the current incident, institutional policies and resolution status—then let an authorized officer review, edit and send.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#0F0F14', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#1E9E5A" /> Gathers relevant campus rules and SLA commitments
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#1E9E5A" /> Drafts professional, empathetic resolution notices
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={16} color="#1E9E5A" /> Full editorial override before anything reaches students
              </div>
            </div>
          </div>

          {/* Example Draft Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E7E8EE',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#5B4FE9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AI-GENERATED RESPONSE DRAFT
              </span>
              <span style={{ fontSize: '11px', color: '#6B6F76' }}>Grounded in 3 sources</span>
            </div>

            {/* Editable or Text Box */}
            <div style={{
              backgroundColor: '#F4F5FA',
              border: '1px solid #E7E8EE',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#0F0F14',
              marginBottom: '16px'
            }}>
              {responseAction === 'editing' ? (
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', border: 0, background: 'transparent', font: 'inherit', outline: 'none', resize: 'vertical' }}
                />
              ) : (
                draftText
              )}
            </div>

            {/* Sources Chips */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6F76', marginBottom: '8px' }}>Grounded Sources:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
                <span style={{ backgroundColor: '#EDEBFC', color: '#5B4FE9', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                  Maintenance policy (Section 4.2)
                </span>
                <span style={{ backgroundColor: '#EDEBFC', color: '#5B4FE9', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                  Hostel grievance procedure
                </span>
                <span style={{ backgroundColor: '#EDEBFC', color: '#5B4FE9', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                  Current incident status
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #F0F1F5', paddingTop: '16px' }}>
              {responseAction === 'sent' ? (
                <div style={{ color: '#1E9E5A', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> Official response sent to all 47 students!
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setResponseAction('idle')}
                    style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Review draft
                  </button>
                  <button
                    onClick={() => setResponseAction(responseAction === 'editing' ? 'idle' : 'editing')}
                    style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {responseAction === 'editing' ? 'Done Editing' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setResponseAction('sent')}
                    style={{ backgroundColor: '#5B4FE9', color: '#FFFFFF', border: 0, padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    Send Response
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. INSTITUTIONAL ANALYTICS ─────────────────────────────── */}
      <section id="analytics" style={{ padding: '88px clamp(20px, 4vw, 60px)', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E7E8EE' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '10px' }}>
              EXECUTIVE OVERSIGHT
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 14px 0' }}>
              See what your institution is struggling with.
            </h2>
            <p style={{ fontSize: '15px', color: '#6B6F76', lineHeight: 1.6, margin: 0 }}>
              Turn thousands of individual complaints into a clear picture of recurring problems, response performance and institutional risk.
            </p>
          </div>

          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6F76', textTransform: 'uppercase' }}>Total Complaints</div>
              <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', margin: '6px 0 4px', color: '#0F0F14' }}>
                12,842
              </div>
              <div style={{ fontSize: '12px', color: '#1E9E5A', fontWeight: 700 }}>
                ↑ 18.0% this month
              </div>
            </div>

            <div style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6F76', textTransform: 'uppercase' }}>Master Incidents</div>
              <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', margin: '6px 0 4px', color: '#0F0F14' }}>
                1,284
              </div>
              <div style={{ fontSize: '12px', color: '#5B4FE9', fontWeight: 700 }}>
                ~9% of total complaints (91% clustered)
              </div>
            </div>

            <div style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6F76', textTransform: 'uppercase' }}>Within SLA</div>
              <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', margin: '6px 0 4px', color: '#0F0F14' }}>
                87%
              </div>
              <div style={{ fontSize: '12px', color: '#1E9E5A', fontWeight: 700 }}>
                ↑ 3.2% improvement
              </div>
            </div>

            <div style={{ backgroundColor: '#F4F5FA', border: '1px solid #E7E8EE', borderRadius: '16px', padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6F76', textTransform: 'uppercase' }}>Critical Incidents</div>
              <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', margin: '6px 0 4px', color: '#DC2626' }}>
                23
              </div>
              <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>
                6 currently escalating
              </div>
            </div>
          </div>

          {/* Institutional Pressure Category Chart */}
          <div style={{
            backgroundColor: '#F4F5FA',
            border: '1px solid #E7E8EE',
            borderRadius: '20px',
            padding: '32px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Institutional pressure</h3>
                <p style={{ fontSize: '13px', color: '#6B6F76', margin: '4px 0 0' }}>Complaints by category</p>
              </div>
              <span style={{ fontSize: '12px', color: '#5B4FE9', fontWeight: 700 }}>Current Academic Term</span>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { name: 'Infrastructure', count: 90, percent: 90, color: '#5B4FE9' },
                { name: 'Academic', count: 69, percent: 69, color: '#3D4FFF' },
                { name: 'Hostel', count: 57, percent: 57, color: '#6366F1' },
                { name: 'Finance', count: 40, percent: 40, color: '#818CF8' },
                { name: 'Administration', count: 21, percent: 21, color: '#A5B4FC' },
              ].map((row) => (
                <div key={row.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                    <span>{row.name}</span>
                    <span>{row.count} cases</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#FFFFFF', borderRadius: '9999px', overflow: 'hidden', border: '1px solid #E7E8EE' }}>
                    <div style={{ width: `${row.percent}%`, height: '100%', backgroundColor: row.color, borderRadius: '9999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER (COOL GRAY & INDIGO THEME) ──────────────────────── */}
      <footer style={{ backgroundColor: '#F4F5FA', color: '#0F0F14', borderTop: '1px solid #E7E8EE', padding: '64px clamp(20px, 4vw, 60px) 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #5B4FE9 0%, #3D4FFF 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  display: 'grid',
                  placeItems: 'center',
                }}>
                  R
                </div>
                <span style={{ fontWeight: 800, fontSize: '18px', color: '#0F0F14' }}>Resolve</span>
              </div>
              <p style={{ fontSize: '13px', color: '#6B6F76', lineHeight: 1.6, margin: 0, maxWidth: '280px' }}>
                The intelligent institutional grievance orchestration platform for modern colleges and universities.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '14px' }}>Platform</div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <a href="#intake" style={{ color: '#6B6F76', textDecoration: 'none' }}>Intake Channels</a>
                <a href="#incident-intelligence" style={{ color: '#6B6F76', textDecoration: 'none' }}>Clustering Engine</a>
                <a href="#prioritization" style={{ color: '#6B6F76', textDecoration: 'none' }}>Impact Scoring</a>
                <a href="#routing" style={{ color: '#6B6F76', textDecoration: 'none' }}>Department Routing</a>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '14px' }}>Workspaces</div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <Link to="/login" style={{ color: '#6B6F76', textDecoration: 'none' }}>Student Portal</Link>
                <Link to="/login" style={{ color: '#6B6F76', textDecoration: 'none' }}>Staff Workspace</Link>
                <Link to="/login" style={{ color: '#6B6F76', textDecoration: 'none' }}>Admin Governance OS</Link>
                <Link to="/login" style={{ color: '#6B6F76', textDecoration: 'none' }}>Audit Trail</Link>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', color: '#5B4FE9', textTransform: 'uppercase', marginBottom: '14px' }}>Institutional</div>
              <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
                <Link to="/transparency" style={{ color: '#5B4FE9', textDecoration: 'none', fontWeight: 700 }}>
                  View Departmental Dashboard →
                </Link>
                <span style={{ color: '#6B6F76' }}>SIH 2026 Submission</span>
                <span style={{ color: '#6B6F76' }}>FastAPI + PostgreSQL + pgvector</span>
                <span style={{ color: '#6B6F76' }}>Qwen-2.5-7B AI Pipeline</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E7E8EE', paddingTop: '28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6B6F76', gap: '16px' }}>
            <div>© 2026 Resolve Platform. All rights reserved.</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>UGC Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
