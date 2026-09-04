import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { getProblemIntelligence } from '../../api/problemIntelligence';

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed', 'escalated'];
const PRIORITY_ORDER = ['low', 'normal', 'high', 'urgent'];

function titleCase(value) {
  return String(value || '—').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shortDate(value) {
  const d = safeDate(value);
  return d ? d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) : '—';
}

function formatDuration(createdAt) {
  const d = safeDate(createdAt);
  if (!d) return '—';
  const hours = Math.max(0, Math.round((Date.now() - d.getTime()) / 36e5));
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function normaliseComplaints(problem) {
  return Array.isArray(problem?.complaints) ? problem.complaints : [];
}

function buildStatusData(complaints) {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  complaints.forEach((c) => {
    const status = String(c.status || 'open').toLowerCase();
    counts[status] = (counts[status] || 0) + 1;
  });
  return STATUS_ORDER.map((status) => ({ name: titleCase(status), value: counts[status] || 0, key: status }))
    .filter((item) => item.value > 0);
}

function buildPriorityData(complaints, problem) {
  const source = complaints.length ? complaints : [{ priority: problem?.priority || 'normal' }];
  const counts = Object.fromEntries(PRIORITY_ORDER.map((p) => [p, 0]));
  source.forEach((c) => {
    const priority = String(c.priority || problem?.priority || 'normal').toLowerCase();
    counts[priority] = (counts[priority] || 0) + 1;
  });
  return PRIORITY_ORDER.map((priority) => ({ name: titleCase(priority), value: counts[priority] || 0 }))
    .filter((item) => item.value > 0);
}

function buildTimelineData(complaints) {
  const grouped = new Map();
  complaints.forEach((c) => {
    const date = safeDate(c.created_at);
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    grouped.set(key, (grouped.get(key) || 0) + 1);
  });
  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: shortDate(date), complaints: count }));
}

function buildStudentData(problem, complaints) {
  const students = new Map();
  complaints.forEach((c) => {
    const id = c.student_id ?? c.student_name ?? `complaint-${c.id}`;
    const name = c.student_name || `Student ${c.student_id ?? ''}`.trim();
    students.set(id, { name, complaints: (students.get(id)?.complaints || 0) + 1 });
  });
  if (!students.size && Array.isArray(problem?.students)) {
    problem.students.forEach((s) => students.set(s.user_id, { name: s.name || `Student ${s.user_id}`, complaints: 1 }));
  }
  return [...students.values()].sort((a, b) => b.complaints - a.complaints).slice(0, 8);
}

function Metric({ icon: Icon, label, value, hint }) {
  return (
    <article className="intel-metric">
      <div className="intel-metric-icon"><Icon size={17} /></div>
      <div className="intel-metric-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="intel-section-head">
      <div className="intel-section-icon"><Icon size={17} /></div>
      <div>
        <div className="panel-eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

export function StaffProblemIntelligence() {
  const { id } = useParams();
  const { api, setMessage } = useAuth();
  const [problem, setProblem] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      const data = await getProblemIntelligence(api, id);
      setProblem(data);
    } catch (error) {
      setMessage(error.message || 'Unable to load problem intelligence.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, id, setMessage]);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="admin-page"><div className="skeleton-panel">Building problem intelligence…</div></div>;
  }

  if (!problem) {
    return <div className="admin-page"><div className="empty-state">Problem not found.</div></div>;
  }

  const complaints = normaliseComplaints(problem);
  const statusData = buildStatusData(complaints);
  const priorityData = buildPriorityData(complaints, problem);
  const timelineData = buildTimelineData(complaints);
  const studentData = buildStudentData(problem, complaints);
  const affected = Number(problem.affected_users ?? 0);
  const complaintCount = Number(problem.complaint_count ?? complaints.length ?? 0);
  const ai = problem.ai_analysis || problem.intelligence || null;
  const evidence = problem.evidence || problem.evidence_analysis || null;
  const recommendations = Array.isArray(problem.recommendations) ? problem.recommendations : ai?.recommendations || [];

  return (
    <div className="admin-page problem-intelligence-page">
      <div className="intel-top-actions">
        <Link to="/staff/problems" className="back-link"><ArrowLeft size={15}/> Back to core problems</Link>
        <button className="admin-button secondary" onClick={() => load(true)} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'spin' : ''}/> Refresh intelligence
        </button>
      </div>

      <section className="intel-hero">
        <div className="intel-hero-glow" />
        <div className="intel-hero-content">
          <div className="intel-hero-kicker"><Sparkles size={13}/> PROBLEM INTELLIGENCE</div>
          <div className="intel-hero-code">{problem.problem_code || 'CORE PROBLEM'}</div>
          <h1>{problem.title || 'Institutional problem'}</h1>
          <p>{problem.description || 'Grouped student complaints requiring coordinated institutional action.'}</p>
          <div className="intel-hero-tags">
            <span>{problem.department || 'General'}</span>
            <span>{problem.category || 'Unclassified'}</span>
            <span className={`intel-status ${String(problem.status || 'open').toLowerCase()}`}>{titleCase(problem.status || 'open')}</span>
          </div>
        </div>
        <div className="intel-hero-badge">
          <div><Sparkles size={18}/></div>
          <span>Evidence-led<br/>decision support</span>
        </div>
      </section>

      <section className="intel-metrics">
        <Metric icon={FileText} label="Complaints" value={complaintCount} hint="Grouped reports" />
        <Metric icon={Users} label="Affected students" value={affected} hint="Authenticated users" />
        <Metric icon={AlertTriangle} label="Priority" value={titleCase(problem.priority || 'normal')} hint={problem.priority_reasons?.length ? 'Policy reasons available' : 'Backend priority'} />
        <Metric icon={Clock3} label="Active duration" value={formatDuration(problem.created_at)} hint={problem.sla_due_at ? `SLA ${shortDate(problem.sla_due_at)}` : 'No SLA date returned'} />
      </section>

      <section className="intel-summary-grid">
        <article className="admin-panel intel-panel intel-summary-panel">
          <SectionHeader icon={Sparkles} eyebrow="AI EXECUTIVE BRIEF" title="Understand the core problem" description="A concise operational interpretation for the department." />
          {ai ? (
            <div className="intel-brief">
              <p>{ai.executive_summary || ai.summary || ai.analysis || 'The intelligence service returned structured analysis, but no executive summary was supplied.'}</p>
              {(ai.confidence != null || ai.core_problem_confidence != null) && (
                <div className="confidence-row">
                  <span>Analysis confidence</span>
                  <strong>{Math.round(Number(ai.confidence ?? ai.core_problem_confidence) * (Number(ai.confidence ?? ai.core_problem_confidence) <= 1 ? 100 : 1))}%</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="intel-connect-state">
              <Sparkles size={18}/>
              <div>
                <strong>Operational intelligence is ready for AI enrichment.</strong>
                <p>This page is already using verified ProblemGroup data. When the backend exposes <code>/staff/problems/:id/intelligence</code>, the Hugging Face executive brief will appear here without changing the UI.</p>
              </div>
            </div>
          )}
        </article>

        <article className="admin-panel intel-panel">
          <SectionHeader icon={Target} eyebrow="DECISION SIGNAL" title="Why this problem matters" />
          <div className="signal-list">
            <div><span>Impact</span><strong>{affected > 0 ? `${affected} student${affected === 1 ? '' : 's'}` : 'Not available'}</strong></div>
            <div><span>Problem state</span><strong>{titleCase(problem.status || 'open')}</strong></div>
            <div><span>Department</span><strong>{problem.department || '—'}</strong></div>
            <div><span>Evidence records</span><strong>{evidence?.count ?? evidence?.total ?? 'Pending AI endpoint'}</strong></div>
          </div>
          {problem.priority_reasons?.length > 0 && (
            <div className="priority-reasons">
              <span>Priority rationale</span>
              {problem.priority_reasons.map((reason, index) => <div key={`${reason}-${index}`}><Zap size={13}/>{reason}</div>)}
            </div>
          )}
        </article>
      </section>

      <section className="admin-panel intel-panel">
        <SectionHeader icon={BarChart3} eyebrow="STUDENT IMPACT" title="What the complaint data says" description="Charts are generated from the ProblemGroup and its associated complaint records." />
        <div className="intel-chart-grid">
          <div className="intel-chart-card">
            <div className="intel-chart-title"><div><strong>Complaint trend</strong><span>Reports by submission date</span></div></div>
            {timelineData.length ? (
              <div className="intel-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={timelineData} margin={{ top: 12, right: 10, left: -20, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10}/><Tooltip/><Line type="monotone" dataKey="complaints" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }}/></LineChart></ResponsiveContainer></div>
            ) : <div className="chart-empty">No dated complaint records returned.</div>}
          </div>

          <div className="intel-chart-card">
            <div className="intel-chart-title"><div><strong>Complaint status</strong><span>Current lifecycle distribution</span></div></div>
            {statusData.length ? (
              <div className="intel-chart pie-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="78%" paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.key} fill={`hsl(${250 - index * 28} 70% ${58 + index * 4}%)`} />)}</Pie><Tooltip/><Legend iconType="circle" wrapperStyle={{ fontSize: 10 }}/></PieChart></ResponsiveContainer></div>
            ) : <div className="chart-empty">No status data available.</div>}
          </div>

          <div className="intel-chart-card">
            <div className="intel-chart-title"><div><strong>Priority profile</strong><span>Backend-assigned priority</span></div></div>
            {priorityData.length ? (
              <div className="intel-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={priorityData} margin={{ top: 12, right: 10, left: -20, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10}/><Tooltip/><Bar dataKey="value" name="Complaints" fill="var(--accent)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>
            ) : <div className="chart-empty">No priority data available.</div>}
          </div>

          <div className="intel-chart-card">
            <div className="intel-chart-title"><div><strong>Affected student profile</strong><span>Unique authenticated reporters</span></div></div>
            {studentData.length ? (
              <div className="intel-student-bars">{studentData.map((student, index) => <div className="student-bar-row" key={`${student.name}-${index}`}><span title={student.name}>{student.name}</span><div><i style={{ width: `${Math.max(8, (student.complaints / Math.max(...studentData.map((s) => s.complaints))) * 100)}%` }} /></div><strong>{student.complaints}</strong></div>)}</div>
            ) : <div className="chart-empty">Student-level records were not returned.</div>}
          </div>
        </div>
      </section>

      <section className="intel-bottom-grid">
        <article className="admin-panel intel-panel">
          <SectionHeader icon={FileText} eyebrow="EVIDENCE CENTER" title="Supporting material" description="Designed for student uploads, documents and AI evidence correlation." />
          {evidence?.items?.length ? (
            <div className="evidence-list">{evidence.items.map((item, index) => <div className="evidence-item" key={item.id || index}><div className="evidence-icon"><FileText size={16}/></div><div><strong>{item.name || item.title || `Evidence ${index + 1}`}</strong><span>{item.type || 'Document'}{item.relevance != null ? ` · ${item.relevance}% relevance` : ''}</span></div></div>)}</div>
          ) : (
            <div className="intel-empty-card"><FileText size={18}/><div><strong>Evidence layer ready</strong><span>When attachment analysis is exposed by the backend, documents and images will be surfaced here with AI relevance and source metadata.</span></div></div>
          )}
        </article>

        <article className="admin-panel intel-panel">
          <SectionHeader icon={CheckCircle2} eyebrow="RECOMMENDED ACTION" title="Turn intelligence into action" />
          {recommendations.length ? (
            <ol className="recommendation-list">{recommendations.slice(0, 6).map((item, index) => <li key={index}><span>{String(index + 1).padStart(2, '0')}</span><div>{typeof item === 'string' ? item : item.action || item.text || JSON.stringify(item)}</div></li>)}</ol>
          ) : (
            <ol className="recommendation-list">
              <li><span>01</span><div>Review the complaint cluster and supporting evidence.</div></li>
              <li><span>02</span><div>Investigate the underlying physical or service failure.</div></li>
              <li><span>03</span><div>Issue one coordinated resolution through the ProblemGroup.</div></li>
            </ol>
          )}
          <Link className="admin-button primary intel-resolve-link" to={`/staff/problems/${encodeURIComponent(id)}`}><CheckCircle2 size={15}/> Open resolution workspace</Link>
        </article>
      </section>

      <div className="intel-footnote"><Activity size={13}/> Operational metrics are sourced from the backend. AI output is presented as decision support and does not override authorization, routing or priority policy.</div>
    </div>
  );
}
