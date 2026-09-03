import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Upload, FileText, Image as ImageIcon, X, Paperclip, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function StudentNewComplaint() {
  const { api, setMessage } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [busy, setBusy] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File size exceeds the 5MB limit. Please choose a smaller file.');
      return;
    }

    // Check allowed types: PDF, PNG, JPEG, JPG, WEBP
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('Only PDF documents and image files (PNG, JPG, JPEG, WEBP) are supported.');
      return;
    }

    setSelectedFile(file);
  }

  function removeFile() {
    setSelectedFile(null);
  }

  async function submit(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle || !cleanDescription) return setMessage('Title and description are required.');

    setBusy(true);
    try {
      // 1. Create complaint
      const result = await api('/complaints', {
        method: 'POST',
        body: JSON.stringify({ title: cleanTitle, description: cleanDescription }),
      });
      const id = result?.id || result?.complaint_id;

      // 2. Upload attachment if attached
      if (selectedFile && id) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          await api(`/complaints/${encodeURIComponent(id)}/attachments`, {
            method: 'POST',
            body: formData,
          });
        } catch (uploadErr) {
          console.error('Attachment upload failed:', uploadErr);
          setMessage('Complaint created, but attachment upload failed. You can re-upload inside case details.');
        }
      }

      setMessage('Complaint submitted successfully.');
      navigate(id ? `/student/complaints/${encodeURIComponent(id)}` : '/student/complaints');
    } catch (error) {
      setMessage(error.message || 'Could not submit complaint.');
    } finally {
      setBusy(false);
    }
  }

  const isPdf = selectedFile?.type === 'application/pdf';

  return (
    <div className="admin-page">
      <section className="student-hero">
        <div>
          <Link className="student-link" to="/student"><ArrowLeft size={12} /> Back</Link>
          <div className="admin-kicker" style={{ marginTop: 14 }}>NEW GRIEVANCE</div>
          <h1>Tell us what happened.</h1>
          <p>Do not select a department or priority. The backend handles classification, grouping and routing.</p>
        </div>
      </section>

      <form className="student-panel" onSubmit={submit} style={{ maxWidth: 900 }}>
        <div className="student-form-grid">
          <div className="student-field full">
            <label htmlFor="complaint-title">Problem title</label>
            <input
              id="complaint-title"
              required
              minLength={3}
              maxLength={240}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Water supply unavailable in Hostel B"
            />
          </div>

          <div className="student-field full">
            <label htmlFor="complaint-description">Description</label>
            <textarea
              id="complaint-description"
              required
              minLength={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is happening, where it occurs and useful context."
              rows={4}
            />
          </div>

          {/* Unified PDF / Image Upload Section */}
          <div className="student-field full">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Paperclip size={14} /> Attach Supporting Document or Photo (Optional)
            </label>
            
            {!selectedFile ? (
              <label
                htmlFor="file-upload-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '24px 20px',
                  borderRadius: 'var(--radius-btn, 12px)',
                  border: '1.5px dashed var(--border, #E7E8EE)',
                  backgroundColor: 'var(--bg-page, #F4F5FA)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-tint, #EDEBFC)',
                  color: 'var(--accent, #5B4FE9)',
                  display: 'grid',
                  placeItems: 'center'
                }}>
                  <Upload size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary, #0F0F14)', display: 'block' }}>
                    Click to upload PDF or Image
                  </strong>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #6B6F76)' }}>
                    Supports PDF, PNG, JPG, JPEG, WEBP (Max 5MB)
                  </span>
                </div>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--radius-btn, 12px)',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid var(--accent, #5B4FE9)',
                boxShadow: '0 2px 8px rgba(91, 79, 233, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: isPdf ? '#FEF2F2' : '#EDEBFC',
                    color: isPdf ? '#DC2626' : '#5B4FE9',
                    display: 'grid',
                    placeItems: 'center'
                  }}>
                    {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: 13, color: '#0F0F14', display: 'block', wordBreak: 'break-all' }}>
                      {selectedFile.name}
                    </strong>
                    <span style={{ fontSize: 11, color: '#6B6F76' }}>
                      {isPdf ? 'PDF Document' : 'Image File'} · {formatBytes(selectedFile.size)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: '#6B6F76',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center'
                  }}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="student-note">
          <Sparkles size={16} />
          <div>
            <strong>Automatic analysis.</strong> Resolve determines category, department, priority and problem grouping after submission.
          </div>
        </div>

        <div className="student-actions">
          <button type="button" className="admin-button secondary" onClick={() => navigate('/student')}>
            Cancel
          </button>
          <button className="admin-button primary" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit complaint'}
          </button>
        </div>
      </form>
    </div>
  );
}

