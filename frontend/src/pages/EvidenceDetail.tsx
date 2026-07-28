import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

export default function EvidenceDetail() {
  const { id } = useParams();
  const [evidence, setEvidence] = useState<any>(null);
  const [custodyEvents, setCustodyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [integrityStatus, setIntegrityStatus] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [overrideLock, setOverrideLock] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role?.name === 'ADMIN' || currentUser?.role?.name === 'SUPER_ADMIN') {
      api.get(`/evidences/${id}/approvals/pending`).then(res => setPendingApprovals(res.data)).catch(console.error);
    }
  }, [id, currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resEv, resCustody] = await Promise.all([
          api.get(`/evidences/${id}`),
          api.get(`/custody-events/evidence/${id}`)
        ]);
        setEvidence(resEv.data);
        setCustodyEvents(resCustody.data);
      } catch (err: any) {
        setError('Failed to fetch evidence details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const verifyHash = async () => {
      try {
        const res = await api.get(`/evidences/${id}/verify-hash`);
        setIntegrityStatus(res.data.status);
      } catch (err) {
        setIntegrityStatus('FAILED');
      }
    };
    verifyHash();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Loading details...</div>;
  if (error) return <div className="error-message" style={{ margin: '2rem' }}>{error}</div>;
  if (!evidence) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Evidence not found.</div>;

  const attachment = evidence.attachments && evidence.attachments.length > 0 ? evidence.attachments[0] : null;
  const hash = evidence.hashes && evidence.hashes.length > 0 ? evidence.hashes[0] : null;
  const qrCode = evidence.qrCode;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = attachment && attachment.mimeType.startsWith('image/');
  
  // Assuming the backend runs on localhost:3000 where our api is pointing
  const backendUrl = api.defaults.baseURL?.replace('/api/v1', '') || 'http://localhost:3000';
  const fileUrl = attachment ? `${backendUrl}${attachment.filePath}` : '';

  const lastEvent = custodyEvents[custodyEvents.length - 1];
  const isHandoverPending = lastEvent?.action === 'HANDOVER_DISPATCH';
  const isIntendedRecipient = isHandoverPending && lastEvent.recipientId === currentUser?.id;

  const handleApprove = async (approvalId: string) => {
    try {
      await api.post(`/evidences/${id}/approvals/${approvalId}/approve`);
      alert('Edit approved');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await api.post(`/evidences/${id}/approvals/${approvalId}/reject`);
      alert('Edit rejected');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleAcceptHandover = async () => {
    const location = window.prompt("Enter new location for the evidence:", lastEvent?.location || "");
    if (location === null) return;
    try {
      await api.post(`/custody-events/evidence/${id}/handover/accept${overrideLock ? '?override=true' : ''}`, { location });
      alert('Handover accepted');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleRejectHandover = async () => {
    try {
      await api.post(`/custody-events/evidence/${id}/handover/reject${overrideLock ? '?override=true' : ''}`);
      alert('Handover rejected');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this evidence?")) return;
    try {
      await api.delete(`/evidences/${id}${overrideLock ? '?override=true' : ''}`);
      alert("Evidence deleted");
      window.location.href = '/evidences';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const caseStatus = evidence?.case?.status;
  const isSuperAdmin = currentUser?.role?.name === 'SUPER_ADMIN';
  const isArchived = caseStatus === 'ARCHIVED';
  const isInCourt = caseStatus === 'IN_COURT';
  const isProsecution = caseStatus === 'SUBMITTED_TO_PROSECUTION';
  
  const isLocked = isArchived || isProsecution || (isInCourt && !overrideLock);
  const showOverride = isInCourt && isSuperAdmin;

  return (
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: '0' }}>Evidence Details</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {showOverride && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 'bold' }}>
                <input type="checkbox" checked={overrideLock} onChange={(e) => setOverrideLock(e.target.checked)} />
                Override Court Lock
              </label>
            )}
            {!isLocked && (
              <>
                <Link to={`/evidences/edit/${id}${overrideLock ? '?override=true' : ''}`} className="btn-primary" style={{ background: '#3b82f6', textDecoration: 'none', padding: '0.5rem 1rem' }}>
                  Edit
                </Link>
                {isSuperAdmin && (
                  <button onClick={handleDelete} className="btn-primary" style={{ background: '#ef4444', border: 'none', padding: '0.5rem 1rem' }}>
                    Delete
                  </button>
                )}
              </>
            )}
            <Link to="/evidences" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', textDecoration: 'none', padding: '0.5rem 1rem' }}>
              Back to List
            </Link>
          </div>
        </div>

        {isIntendedRecipient && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#eab308', margin: 0, fontSize: '1.1rem' }}>Handover Pending</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>You have been assigned as the new custodian.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleAcceptHandover} className="btn-primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '0.5rem 1rem', width: 'auto' }}>Accept</button>
              <button onClick={handleRejectHandover} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', padding: '0.5rem 1rem', width: 'auto' }}>Reject</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Evidence Number</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{evidence.evidenceNumber}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Associated Case</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{evidence.case?.caseNumber || 'Unknown'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Title</p>
            <p style={{ fontSize: '1.1rem' }}>{evidence.title}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Category</p>
            <p style={{ fontSize: '1.1rem' }}>{evidence.category}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Description</p>
            <p style={{ fontSize: '1rem', whiteSpace: 'pre-wrap' }}>{evidence.description || 'No description provided.'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Status</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="role-badge">{evidence.status.replace(/_/g, ' ')}</span>
              {isArchived && <span style={{ background: 'rgba(156,163,175,0.2)', color: '#9ca3af', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>ARCHIVED</span>}
              {isLocked && !isArchived && <span style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>READ ONLY</span>}
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Ready for Transfer</p>
            <p style={{ fontSize: '1rem' }}>{evidence.isReadyForTransfer ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Collection Location</p>
            <p style={{ fontSize: '1rem' }}>{evidence.collectionLocation}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Legacy Storage Location</p>
            <p style={{ fontSize: '1rem' }}>{evidence.storageLocation || 'N/A'}</p>
          </div>
        </div>

        {/* Legal Authority Section */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Legal Authority</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Warrant Number</p>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>{evidence.warrantNumber || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Consent Reference</p>
              <p style={{ fontSize: '1rem' }}>{evidence.consentReference || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Seizure Authorization</p>
              <p style={{ fontSize: '1rem' }}>{evidence.seizureAuth || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Legal Basis</p>
              <p style={{ fontSize: '1rem' }}>{evidence.legalBasis || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Physical Storage Tracking */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Physical Storage Tracking</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Building</p>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>{evidence.storageBuilding || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Room</p>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>{evidence.storageRoom || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cabinet</p>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>{evidence.storageCabinet || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Shelf</p>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>{evidence.storageShelf || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Locker</p>
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>{evidence.storageLocker || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Hierarchy Tree */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Hierarchy Tree</h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            {evidence.parent ? (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Parent Evidence</p>
                <Link to={`/evidences/${evidence.parent.id}/detail`} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
                  {evidence.parent.evidenceNumber} - {evidence.parent.title}
                </Link>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>No Parent (Top Level Evidence)</p>
            )}

            {evidence.children && evidence.children.length > 0 && (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Child Evidences</p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {evidence.children.map((child: any) => (
                    <li key={child.id} style={{ marginBottom: '0.25rem' }}>
                      <Link to={`/evidences/${child.id}/detail`} style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                        {child.evidenceNumber} - {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(!evidence.children || evidence.children.length === 0) && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No Child Evidences</p>
            )}
          </div>
        </div>

        {/* Attachment Section */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Attachment</h2>
          {attachment ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{attachment.fileName}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                  </p>
                </div>
                <a 
                  href={fileUrl} 
                  download={attachment.fileName}
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary" 
                  style={{ textDecoration: 'none' }}
                >
                  Download
                </a>
              </div>
              
              {isImage && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <img 
                    src={fileUrl} 
                    alt={attachment.fileName} 
                    style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', border: '1px solid var(--glass-border)' }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No file attached to this evidence.</p>
          )}
        </div>

        {/* Digital Integrity Section */}
        {hash && (
          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Digital Integrity (SHA-256)</h2>
              {integrityStatus && integrityStatus !== 'N/A' && (
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: integrityStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: integrityStatus === 'VERIFIED' ? '#10b981' : '#ef4444'
                }}>
                  {integrityStatus === 'VERIFIED' ? 'Integrity Verified' : 'Integrity Failed'}
                </span>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Generated At: {new Date(hash.generatedAt).toLocaleString()}
                </p>
                <code style={{ fontSize: '1rem', color: 'var(--accent-color)', wordBreak: 'break-all' }}>
                  {hash.hashValue}
                </code>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(hash.hashValue);
                  alert('Hash copied to clipboard!');
                }}
                className="btn-primary"
                style={{ marginLeft: '1rem', width: 'auto', background: 'transparent', border: '1px solid var(--glass-border)' }}
              >
                Copy Hash
              </button>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        {qrCode && qrCode.qrPayload && (
          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Internal Tracking (QR Code)</h2>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <img 
                  src={qrCode.qrPayload} 
                  alt="Evidence QR Code" 
                  style={{ width: '120px', height: '120px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'white', padding: '0.5rem' }}
                />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Evidence ID</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {evidence.id}
                  </p>
                </div>
              </div>
              <a 
                href={qrCode.qrPayload} 
                download={`qr-${evidence.evidenceNumber}.png`}
                className="btn-primary"
                style={{ width: 'auto', background: 'transparent', border: '1px solid var(--glass-border)', textDecoration: 'none' }}
              >
                Download QR
              </a>
            </div>
          </div>
        )}

        {/* Chain of Custody Section */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Chain of Custody History</h2>
            {!isLocked && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link to={`/evidences/${id}/custody/new${overrideLock ? '?override=true' : ''}`} className="btn-primary" style={{ textDecoration: 'none', width: 'auto', padding: '0.5rem 1rem' }}>
                  + Transfer Custody
                </Link>
                <Link to={`/evidences/${id}/custody/external${overrideLock ? '?override=true' : ''}`} className="btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6', textDecoration: 'none', width: 'auto', padding: '0.5rem 1rem' }}>
                  + External Transfer
                </Link>
                <Link to={`/evidences/${id}/court/new${overrideLock ? '?override=true' : ''}`} className="btn-primary" style={{ background: '#eab308', borderColor: '#eab308', textDecoration: 'none', width: 'auto', padding: '0.5rem 1rem', color: '#1a1a1a' }}>
                  + Court Presentation
                </Link>
              </div>
            )}
          </div>
          
          {custodyEvents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--glass-border)', marginLeft: '0.5rem', position: 'relative' }}>
              {custodyEvents.map((event) => (
                <div key={event.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', position: 'relative' }}>
                  {/* Timeline Dot */}
                  <div style={{
                    position: 'absolute',
                    left: '-2.15rem',
                    top: '1.5rem',
                    width: '1.1rem',
                    height: '1.1rem',
                    background: event.action === 'COURT_SUBMISSION' ? '#eab308' : event.action === 'EXTERNAL_TRANSFER' ? '#8b5cf6' : '#6366f1',
                    borderRadius: '50%',
                    border: '4px solid #1a1a1a'
                  }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ 
                        background: 'rgba(99, 102, 241, 0.2)', 
                        color: '#818cf8', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}>
                        {event.action.replace(/_/g, ' ')}
                      </span>
                      {(event as any).isOverdue && (
                        <span style={{ 
                          background: 'rgba(239, 68, 68, 0.2)', 
                          color: '#ef4444', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          animation: 'pulse 2s infinite'
                        }}>
                          ESCALATED (OVERDUE)
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(event.eventTime).toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>From Person</p>
                      <p style={{ fontSize: '0.95rem' }}>{event.actor?.policeProfile?.fullName || event.actor?.email || 'Unknown'}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>To Person</p>
                      {event.action === 'EXTERNAL_TRANSFER' ? (
                        <p style={{ fontSize: '0.95rem' }}>
                          {event.externalRecipientName} <br/>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({event.externalOrganization})</span>
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.95rem' }}>{event.recipient ? (event.recipient.policeProfile?.fullName || event.recipient.email) : 'N/A'}</p>
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Location</p>
                      <p style={{ fontSize: '0.95rem' }}>{event.location}</p>
                    </div>
                  </div>

                  {event.action === 'EXTERNAL_TRANSFER' && event.transferReason && (
                    <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Transfer Reason</p>
                      <p style={{ fontSize: '0.9rem' }}>{event.transferReason}</p>
                    </div>
                  )}

                  {event.notes && (
                    <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Notes</p>
                      <p style={{ fontSize: '0.9rem', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>"{event.notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No custody records found for this evidence.</p>
          )}
        </div>
        {/* Pending Edit Approvals Section */}
        {pendingApprovals.length > 0 && (
          <div style={{ marginTop: '3rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Pending Edit Requests</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingApprovals.map((appr) => (
                <div key={appr.id} style={{ background: 'rgba(234, 179, 8, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eab308' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ color: '#eab308', fontWeight: 600, marginBottom: '0.5rem' }}>Requested By: {appr.requestingUser?.email}</p>
                      <pre style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px' }}>
                        {JSON.stringify(appr.proposedData, null, 2)}
                      </pre>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
                      <button onClick={() => handleApprove(appr.id)} className="btn-primary" style={{ background: '#10b981', borderColor: '#10b981', padding: '0.5rem 1rem', width: 'auto' }}>Approve</button>
                      <button onClick={() => handleReject(appr.id)} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', padding: '0.5rem 1rem', width: 'auto' }}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
