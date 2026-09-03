import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, RefreshCw, MessageSquare, Send, Mail, Inbox as InboxIcon, User, Archive, Bell } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Math.round((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ComposeModal({ onClose, onSent, api, isAdmin }) {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const endpoint = isAdmin ? '/admin/messages' : '/messages';
      await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: recipient ? parseInt(recipient) : null,
          subject,
          body,
          complaint_id: null
        })
      });
      onSent();
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to send message');
      setSending(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: 'min(520px, 95vw)', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>{isAdmin ? 'Broadcast / Send Message' : 'New Message'}</h2>
        
        {error && <div style={{ padding: '10px', backgroundColor: '#FEF2F2', color: '#DC2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>To (User ID)</label>
            <input 
              value={recipient} onChange={e => setRecipient(e.target.value)} 
              placeholder={isAdmin ? "User ID (leave blank to broadcast)" : "User ID (required)"}
              style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Subject</label>
            <input 
              value={subject} onChange={e => setSubject(e.target.value)} 
              placeholder="Message subject"
              style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Message</label>
            <textarea 
              value={body} onChange={e => setBody(e.target.value)} 
              placeholder="Type your message..." rows={6}
              style={{ width: '100%', padding: '10px', border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none', resize: 'vertical' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', border: '1px solid #e7e8ef', borderRadius: '8px', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>Cancel</button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{ padding: '9px 18px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            {sending ? <RefreshCw size={13} className="spin" /> : <Send size={13} />}
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Inbox() {
  const { api, session } = useAuth();
  
  const [tab, setTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const isAdmin = session?.role === 'admin';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const endpoint = tab === 'inbox' ? '/messages/inbox' : '/messages/sent';
      const data = await api(endpoint);
      setMessages(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [api, tab]);

  useEffect(() => { load(); }, [load]);

  async function markRead(msg) {
    if (msg.read_at || tab === 'sent') return;
    try {
      await api(`/messages/${msg.id}/read`, { method: 'PATCH' });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m));
    } catch (e) { console.error(e); }
  }

  return (
    <div className="admin-page">
      <div className="admin-toolbar" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { key: 'inbox', label: 'Inbox', icon: InboxIcon },
            { key: 'sent', label: 'Sent', icon: Send },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700,
                backgroundColor: tab === t.key ? '#000' : 'transparent',
                color:           tab === t.key ? '#fff' : '#777a86',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="admin-button secondary" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
          <button className="admin-button" onClick={() => setComposeOpen(true)} style={{ backgroundColor: '#000', color: '#fff', border: 'none' }}>
            <Mail size={14} /> New Message
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-panel" style={{ height: '400px' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <div className="empty-state" style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '48px' }}>
              <Archive size={32} color="#D1D5DB" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#4B5563' }}>No messages found</div>
              <div style={{ fontSize: '13px', color: '#6B7280' }}>Your {tab} is empty.</div>
            </div>
          ) : messages.map(m => (
            <div 
              key={m.id} 
              onClick={() => markRead(m)}
              style={{ 
                backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 20px',
                borderLeft: (!m.read_at && tab === 'inbox') ? '4px solid #3B82F6' : '1px solid #E5E7EB',
                cursor: (!m.read_at && tab === 'inbox') ? 'pointer' : 'default',
                opacity: (m.read_at || tab === 'sent') ? 0.75 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: (!m.read_at && tab === 'inbox') ? 800 : 600 }}>{m.subject}</h3>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>{timeAgo(m.created_at)}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '8px' }}>
                {tab === 'inbox' ? `From: ${m.sender_name || 'System'}` : `To: User ID ${m.recipient_id || 'All (Broadcast)'}`}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {m.body}
              </p>
              {m.complaint_id && (
                <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 600 }}>
                  <a href={`/user/complaints/${m.complaint_id}`} style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={12} /> View related complaint
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {composeOpen && (
        <ComposeModal 
          api={api} 
          isAdmin={isAdmin}
          onClose={() => setComposeOpen(false)} 
          onSent={() => { if(tab === 'sent') load(); }} 
        />
      )}
    </div>
  );
}
