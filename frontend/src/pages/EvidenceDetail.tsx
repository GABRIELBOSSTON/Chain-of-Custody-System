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

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading details...</span>
      </div>
    );
  }
  if (error) return <div className="error-message">{error}</div>;
  if (!evidence) return <div className="loading-state"><span className="text-secondary">Evidence not found.</span></div>;

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

  const getTimelineDotColor = (action: string) => {
    if (action === 'COURT_SUBMISSION') return 'var(--color-warning)';
    if (action === 'EXTERNAL_TRANSFER') return 'var(--color-purple)';
    if (action === 'HANDOVER_DISPATCH') return 'var(--color-accent)';
    if (action === 'HANDOVER_ACK') return 'var(--color-success)';
    return 'var(--color-accent)';
  };

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Evidence Details</h1>
        <div className="btn-group">
          {showOverride && (
            <label className="checkbox-wrapper" style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              <input type="checkbox" checked={overrideLock} onChange={(e) => setOverrideLock(e.target.checked)} />
              Override Court Lock
            </label>
          )}
          {!isLocked && (
            <>
              <Link to={`/evidences/edit/${id}${overrideLock ? '?override=true' : ''}`} className="btn-primary btn-sm">
                Edit
              </Link>
              {isSuperAdmin && (
                <button onClick={handleDelete} className="btn-danger btn-sm">Delete</button>
              )}
            </>
          )}
          <Link to="/evidences" className="btn-secondary btn-sm">
            Back to List
          </Link>
        </div>
      </div>

      {/* Handover Pending Banner */}
      {isIntendedRecipient && (
        <div className="glass-inset animate-slide-up" style={{ marginBottom: 'var(--space-xl)', borderColor: 'rgba(234, 179, 8, 0.3)', background: 'var(--color-warning-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <h3 style={{ color: 'var(--color-warning)', margin: 0, fontSize: 'var(--font-size-lg)' }}>Handover Pending</h3>
              <p className="text-secondary text-sm" style={{ margin: '4px 0 0 0' }}>You have been assigned as the new custodian.</p>
            </div>
            <div className="btn-group">
              <button onClick={handleAcceptHandover} className="btn-success btn-sm">Accept</button>
              <button onClick={handleRejectHandover} className="btn-danger btn-sm">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Info */}
      <div className="glass-panel" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="detail-grid">
          <div>
            <p className="detail-field-label">Evidence Number</p>
            <p className="detail-field-value font-semibold">{evidence.evidenceNumber}</p>
          </div>
          <div>
            <p className="detail-field-label">Associated Case</p>
            <p className="detail-field-value font-semibold">{evidence.case?.caseNumber || 'Unknown'}</p>
          </div>
          <div>
            <p className="detail-field-label">Title</p>
            <p className="detail-field-value">{evidence.title}</p>
          </div>
          <div>
            <p className="detail-field-label">Category</p>
            <p className="detail-field-value">{evidence.category}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p className="detail-field-label">Description</p>
            <p className="detail-field-value pre-wrap">{evidence.description || 'No description provided.'}</p>
          </div>
          <div>
            <p className="detail-field-label">Status</p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', marginTop: '2px' }}>
              <span className="badge badge-blue">{evidence.status.replace(/_/g, ' ')}</span>
              {isArchived && <span className="badge badge-gray">ARCHIVED</span>}
              {isLocked && !isArchived && <span className="badge badge-red">READ ONLY</span>}
            </div>
          </div>
          <div>
            <p className="detail-field-label">Ready for Transfer</p>
            <p className="detail-field-value">{evidence.isReadyForTransfer ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="detail-field-label">Collection Location</p>
            <p className="detail-field-value">{evidence.collectionLocation}</p>
          </div>
          <div>
            <p className="detail-field-label">Legacy Storage Location</p>
            <p className="detail-field-value">{evidence.storageLocation || 'N/A'}</p>
          </div>
        </div>

        {/* Legal Authority */}
        <div className="detail-section">
          <h2 className="detail-section-title">Legal Authority</h2>
          <div className="glass-inset">
            <div className="detail-grid">
              <div>
                <p className="detail-field-label">Warrant Number</p>
                <p className="detail-field-value font-semibold">{evidence.warrantNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="detail-field-label">Consent Reference</p>
                <p className="detail-field-value">{evidence.consentReference || 'N/A'}</p>
              </div>
              <div>
                <p className="detail-field-label">Seizure Authorization</p>
                <p className="detail-field-value">{evidence.seizureAuth || 'N/A'}</p>
              </div>
              <div>
                <p className="detail-field-label">Legal Basis</p>
                <p className="detail-field-value">{evidence.legalBasis || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Storage */}
        <div className="detail-section">
          <h2 className="detail-section-title">Physical Storage Tracking</h2>
          <div className="glass-inset">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-lg)' }}>
              <div>
                <p className="detail-field-label">Building</p>
                <p className="detail-field-value font-semibold">{evidence.storageBuilding || 'N/A'}</p>
              </div>
              <div>
                <p className="detail-field-label">Room</p>
                <p className="detail-field-value font-semibold">{evidence.storageRoom || 'N/A'}</p>
              </div>
              <div>
                <p className="detail-field-label">Cabinet</p>
                <p className="detail-field-value font-semibold">{evidence.storageCabinet || 'N/A'}</p>
              </div>
              <div>
                <p className="detail-field-label">Shelf</p>
                <p className="detail-field-value font-semibold">{evidence.storageShelf || 'N/A'}</p>
              </div>
              <div>
                <p className="detail-field-label">Locker</p>
                <p className="detail-field-value font-semibold">{evidence.storageLocker || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy Tree */}
        <div className="detail-section">
          <h2 className="detail-section-title">Hierarchy Tree</h2>
          <div className="glass-inset">
            {evidence.parent ? (
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <p className="detail-field-label">Parent Evidence</p>
                <Link to={`/evidences/${evidence.parent.id}/detail`} className="auth-link font-semibold">
                  {evidence.parent.evidenceNumber} — {evidence.parent.title}
                </Link>
              </div>
            ) : (
              <p className="detail-field-label" style={{ marginBottom: 'var(--space-md)' }}>No Parent (Top Level Evidence)</p>
            )}

            {evidence.children && evidence.children.length > 0 && (
              <div>
                <p className="detail-field-label" style={{ marginBottom: 'var(--space-sm)' }}>Child Evidences</p>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)' }}>
                  {evidence.children.map((child: any) => (
                    <li key={child.id} style={{ marginBottom: '4px' }}>
                      <Link to={`/evidences/${child.id}/detail`} className="auth-link">
                        {child.evidenceNumber} — {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(!evidence.children || evidence.children.length === 0) && (
              <p className="detail-field-label">No Child Evidences</p>
            )}
          </div>
        </div>
      </div>

      {/* Attachment */}
      <div className="glass-panel" style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 className="detail-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Attachment</h2>
        {attachment ? (
          <div className="glass-inset">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <div>
                <p className="font-semibold text-md" style={{ marginBottom: '2px' }}>{attachment.fileName}</p>
                <p className="text-secondary text-sm">
                  {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                </p>
              </div>
              <a 
                href={fileUrl} 
                download={attachment.fileName}
                target="_blank" 
                rel="noreferrer"
                className="btn-primary btn-sm"
              >
                Download
              </a>
            </div>
            
            {isImage && (
              <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
                <img 
                  src={fileUrl} 
                  alt={attachment.fileName} 
                  style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-secondary">No file attached to this evidence.</p>
        )}
      </div>

      {/* Digital Integrity */}
      {hash && (
        <div className="glass-panel" style={{ marginBottom: 'var(--space-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <h2 className="detail-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', marginBottom: 0 }}>Digital Integrity (SHA-256)</h2>
            {integrityStatus && integrityStatus !== 'N/A' && (
              <span className={`badge ${integrityStatus === 'VERIFIED' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 'var(--font-size-sm)', padding: '0.3rem 0.75rem' }}>
                {integrityStatus === 'VERIFIED' ? '✓ Integrity Verified' : '✗ Integrity Failed'}
              </span>
            )}
          </div>
          <div className="glass-inset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <p className="detail-field-label">
                Generated At: {new Date(hash.generatedAt).toLocaleString()}
              </p>
              <code style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                {hash.hashValue}
              </code>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(hash.hashValue);
                alert('Hash copied to clipboard!');
              }}
              className="btn-secondary btn-sm"
            >
              Copy Hash
            </button>
          </div>
        </div>
      )}

      {/* QR Code */}
      {qrCode && qrCode.qrPayload && (
        <div className="glass-panel" style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 className="detail-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Internal Tracking (QR Code)</h2>
          <div className="glass-inset" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
              <img 
                src={qrCode.qrPayload} 
                alt="Evidence QR Code" 
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                  background: 'white',
                  padding: '6px'
                }}
              />
              <div>
                <p className="font-semibold text-md" style={{ marginBottom: '2px' }}>Evidence ID</p>
                <p className="text-secondary text-sm break-all">{evidence.id}</p>
              </div>
            </div>
            <a 
              href={qrCode.qrPayload} 
              download={`qr-${evidence.evidenceNumber}.png`}
              className="btn-secondary btn-sm"
            >
              Download QR
            </a>
          </div>
        </div>
      )}

      {/* Chain of Custody Timeline */}
      <div className="glass-panel" style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <h2 className="detail-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none', marginBottom: 0 }}>Chain of Custody History</h2>
          {!isLocked && (
            <div className="btn-group">
              <Link to={`/evidences/${id}/custody/new${overrideLock ? '?override=true' : ''}`} className="btn-primary btn-sm">
                + Transfer
              </Link>
              <Link to={`/evidences/${id}/custody/external${overrideLock ? '?override=true' : ''}`} className="btn-purple btn-sm">
                + External
              </Link>
              <Link to={`/evidences/${id}/court/new${overrideLock ? '?override=true' : ''}`} className="btn-warning btn-sm">
                + Court
              </Link>
            </div>
          )}
        </div>
        
        {custodyEvents.length > 0 ? (
          <div className="timeline">
            {custodyEvents.map((event) => (
              <div key={event.id} className="timeline-item">
                <div className="timeline-dot" style={{ background: getTimelineDotColor(event.action) }} />
                <div className="timeline-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-blue">
                        {event.action.replace(/_/g, ' ')}
                      </span>
                      {(event as any).isOverdue && (
                        <span className="badge badge-red" style={{ animation: 'pulse 2s infinite' }}>
                          ESCALATED (OVERDUE)
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-tertiary">
                      {new Date(event.eventTime).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="detail-grid" style={{ marginBottom: 'var(--space-md)' }}>
                    <div>
                      <p className="detail-field-label">From Person</p>
                      <p className="text-base">{event.actor?.policeProfile?.fullName || event.actor?.email || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="detail-field-label">To Person</p>
                      {event.action === 'EXTERNAL_TRANSFER' ? (
                        <p className="text-base">
                          {event.externalRecipientName}
                          <span className="text-sm text-secondary" style={{ display: 'block' }}>({event.externalOrganization})</span>
                        </p>
                      ) : (
                        <p className="text-base">{event.recipient ? (event.recipient.policeProfile?.fullName || event.recipient.email) : 'N/A'}</p>
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p className="detail-field-label">Location</p>
                      <p className="text-base">{event.location}</p>
                    </div>
                  </div>

                  {event.action === 'EXTERNAL_TRANSFER' && event.transferReason && (
                    <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                      <p className="detail-field-label">Transfer Reason</p>
                      <p className="text-sm">{event.transferReason}</p>
                    </div>
                  )}

                  {event.notes && (
                    <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: 'var(--space-md)' }}>
                      <p className="detail-field-label">Notes</p>
                      <p className="text-sm pre-wrap" style={{ fontStyle: 'italic' }}>"{event.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-empty">No custody records found for this evidence.</div>
        )}
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="glass-panel">
          <h2 className="detail-section-title" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>Pending Edit Requests</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {pendingApprovals.map((appr) => (
              <div key={appr.id} className="glass-inset" style={{ borderColor: 'rgba(234, 179, 8, 0.3)', background: 'var(--color-warning-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--color-warning)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
                      Requested By: {appr.requestingUser?.email}
                    </p>
                    <pre style={{
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0,0,0,0.2)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'auto'
                    }}>
                      {JSON.stringify(appr.proposedData, null, 2)}
                    </pre>
                  </div>
                  <div className="btn-group" style={{ flexShrink: 0 }}>
                    <button onClick={() => handleApprove(appr.id)} className="btn-success btn-sm">Approve</button>
                    <button onClick={() => handleReject(appr.id)} className="btn-danger btn-sm">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
