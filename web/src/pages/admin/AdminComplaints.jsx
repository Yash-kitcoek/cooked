import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight, RefreshCw, Filter, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { asArray, firstSuccessful } from './adminApi';

const DEPARTMENTS = [
  'All',
  'Hostel',
  'CSE',
  'AIML',
  'CSBS',
  'Mechanical',
  'Electrical',
  'ENTC',
  'Biotech',
  'Exam Cell',
  'Canteen',
  'General Review',
];

const STATUSES = [
  { key: 'all', label: 'All Status' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

export function AdminComplaints() {
  const { api, setMessage } = useAuth();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await firstSuccessful(api, ['/admin/complaints', '/complaints'], []);
      setItems(asArray(data));
    } catch (e) {
      setMessage(e.message || 'Unable to load complaints');
    } finally {
      setLoading(false);
    }
  }, [api, setMessage]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchQuery = `${c.title || ''} ${c.description || ''} ${c.department || ''} ${c.student?.username || ''} ${c.student?.email || ''} ${c.id || ''}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const normStatus = String(c.status || '').toLowerCase().replace(' ', '_');
      const matchStatus = statusFilter === 'all' || normStatus === statusFilter;
      const matchDept = deptFilter === 'All' || c.department === deptFilter;

      return matchQuery && matchStatus && matchDept;
    });
  }, [items, query, statusFilter, deptFilter]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      open: items.filter((c) => String(c.status).toLowerCase() === 'open').length,
      in_progress: items.filter((c) => ['in_progress', 'escalated'].includes(String(c.status).toLowerCase())).length,
      resolved: items.filter((c) => ['resolved', 'closed'].includes(String(c.status).toLowerCase())).length,
    };
  }, [items]);

  return (
    <div className="admin-page">
      <section className="admin-hero page-hero">
        <div>
          <div className="eyebrow-neon">CASE REVIEW QUEUE</div>
          <h1>Grievance Review & Resolution</h1>
          <p>Inspect, triage, assign, and resolve individual student complaints across all institutional departments.</p>
        </div>
        <div className="hero-actions">
          <button className="admin-button secondary" onClick={load}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </section>

      {/* Quick stats row */}
      <section className="admin-stat-grid" style={{ marginBottom: 4 }}>
        <div className="admin-stat-card" style={{ minHeight: 110, padding: 16 }}>
          <div className="stat-label">Total Cases</div>
          <div className="stat-value" style={{ fontSize: 28 }}>{counts.all}</div>
        </div>
        <div className="admin-stat-card" style={{ minHeight: 110, padding: 16 }}>
          <div className="stat-label">Needs Review (Open)</div>
          <div className="stat-value" style={{ fontSize: 28, color: 'var(--status-info, #E0A93B)' }}>{counts.open}</div>
        </div>
        <div className="admin-stat-card" style={{ minHeight: 110, padding: 16 }}>
          <div className="stat-label">In Progress / Escalated</div>
          <div className="stat-value" style={{ fontSize: 28, color: 'var(--status-warning, #D98A1F)' }}>{counts.in_progress}</div>
        </div>
        <div className="admin-stat-card" style={{ minHeight: 110, padding: 16 }}>
          <div className="stat-label">Resolved / Closed</div>
          <div className="stat-value" style={{ fontSize: 28, color: 'var(--status-success, #1E9E5A)' }}>{counts.resolved}</div>
        </div>
      </section>

      {/* Filter toolbar */}
      <section className="admin-toolbar">
        <div className="search-wrap wide">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by complaint title, student, department, or case ID…"
          />
        </div>
        <div className="filter-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Complaints Table */}
      <section className="admin-table-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Complaint & Details</th>
              <th>Department</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Student</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td className="mono" style={{ fontWeight: 700 }}>
                  #{String(c.id).slice(0, 8).toUpperCase()}
                </td>
                <td>
                  <Link
                    to={`/admin/complaints/${encodeURIComponent(c.id)}`}
                    style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'block' }}
                  >
                    <strong>{c.title || 'Untitled complaint'}</strong>
                  </Link>
                  <span className="table-sub">
                    {c.description ? String(c.description).slice(0, 90) + (c.description.length > 90 ? '…' : '') : 'No description'}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{c.department || '—'}</span>
                </td>
                <td>
                  <PriorityBadge value={c.priority} />
                </td>
                <td>
                  <span className={`status-chip ${String(c.status || '').toLowerCase()}`}>
                    {String(c.status || '—').replaceAll('_', ' ')}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {c.student?.username || c.student?.email || 'Student'}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: 11 }}>
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Link
                    className="admin-button primary"
                    style={{ minHeight: 32, padding: '0 12px', fontSize: 12, textDecoration: 'none' }}
                    to={`/admin/complaints/${encodeURIComponent(c.id)}`}
                  >
                    Review <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty-state">
            {loading ? 'Loading complaints…' : 'No complaints match your search or filter.'}
          </div>
        )}
      </section>
    </div>
  );
}

function PriorityBadge({ value }) {
  const v = String(value || 'LOW').toUpperCase();
  return <span className={`priority-badge ${v.toLowerCase()}`}>{v}</span>;
}
