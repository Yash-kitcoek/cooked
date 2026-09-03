import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, FileText, Send, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminSuggestions() {
  const { api, setMessage } = useAuth();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    fetchClusters();
  }, []);

  async function fetchClusters() {
    setLoading(true);
    try {
      const data = await api('/admin/suggestions');
      setClusters(data);
    } catch (err) {
      setMessage('Failed to fetch AI suggestions: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading suggestions...</div>;
  }

  if (selectedCluster) {
    return (
      <SuggestionDetail 
        cluster={selectedCluster} 
        onClose={() => setSelectedCluster(null)} 
        onResolved={() => {
          setSelectedCluster(null);
          fetchClusters();
        }} 
      />
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Sparkles size={24} color="#0D9488" />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#000000', margin: 0 }}>Systemic Issue Suggestions</h2>
      </div>
      <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px 0' }}>
        AI-detected patterns across departmental queues that may require systemic intervention.
      </p>

      {clusters.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
          <p style={{ color: '#6B7280', margin: 0 }}>No recurring complaint clusters detected at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {clusters.map((cluster) => (
            <div key={cluster.cluster_key} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#000000', margin: 0 }}>
                    Central Thought: {cluster.category} {cluster.subcategory ? `(${cluster.subcategory})` : ''}
                  </h3>
                  <span style={{ padding: '4px 10px', backgroundColor: '#F9FAFB', color: '#2563EB', borderRadius: '16px', fontSize: '12px', fontWeight: 600 }}>
                    No of application: {cluster.no_of_applications}
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>
                  <strong>The problem:</strong> {cluster.problem}
                </p>
              </div>
              <button
                onClick={() => setSelectedCluster(cluster)}
                style={{ backgroundColor: '#0D9488', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                Resolve <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionDetail({ cluster, onClose, onResolved }) {
  const { api, setMessage } = useAuth();
  const [improvement, setImprovement] = useState('');
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function fetchImprovement() {
      try {
        const data = await api(`/admin/suggestions/${encodeURIComponent(cluster.cluster_key)}/improvement`);
        setImprovement(data.improved_solution);
      } catch (err) {
        setMessage('Failed to load improvement suggestion: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchImprovement();
  }, [cluster, api, setMessage]);

  async function handleResolve(e) {
    e.preventDefault();
    setResolving(true);
    try {
      await api(`/admin/suggestions/${encodeURIComponent(cluster.cluster_key)}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ note })
      });
      setMessage('Suggestion cluster resolved');
      onResolved();
    } catch (err) {
      setMessage('Failed to resolve suggestion: ' + err.message);
      setResolving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '24px' }}>Analyzing cluster...</div>;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
      <button className="ghost" onClick={onClose} style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
        <ChevronLeft size={16} /> Back to clusters
      </button>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#000000', margin: 0 }}>
            Central Thought: {cluster.category}
          </h2>
          <span style={{ padding: '4px 10px', backgroundColor: '#F9FAFB', color: '#2563EB', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
            No of application: {cluster.no_of_applications}
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>
          <strong>The problem:</strong> {cluster.problem}
        </p>
      </div>

      <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '24px', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#000000' }}>
          <Sparkles size={18} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Improved Solution</h3>
        </div>
        <p style={{ fontSize: '15px', color: '#14532D', margin: '0 0 16px 0', lineHeight: 1.6 }}>
          {improvement}
        </p>
        <button 
          type="button" 
          onClick={() => setNote(improvement)} 
          style={{ backgroundColor: '#fff', color: '#000000', border: '1px solid #E5E7EB', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <FileText size={14} /> Copy to resolution note
        </button>
      </div>

      <form onSubmit={handleResolve}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#000000', marginBottom: '12px' }}>Action Taken / Resolution Note</h3>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe how this systemic issue was handled (e.g., SOP created, meeting scheduled)..."
          required
          rows={4}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '16px', fontFamily: 'inherit', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={resolving || !note.trim()} 
            style={{ backgroundColor: '#0D9488', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: resolving || !note.trim() ? 'not-allowed' : 'pointer' }}
          >
            {resolving ? 'Resolving...' : <><Send size={16} /> Resolve Issue</>}
          </button>
        </div>
      </form>
    </div>
  );
}
