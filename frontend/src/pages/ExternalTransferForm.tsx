import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import api from '../api';

export default function ExternalTransferForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationState = useLocation();
  const queryParams = new URLSearchParams(locationState.search);
  const overrideParam = queryParams.get('override') === 'true';

  const [evidence, setEvidence] = useState<any>(null);
  const [location, setLocation] = useState('');
  const [externalOrganization, setExternalOrganization] = useState('');
  const [externalRecipientName, setExternalRecipientName] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const res = await api.get(`/evidences/${id}`);
        setEvidence(res.data);
      } catch (err: any) {
        setError('Failed to fetch evidence details.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post(`/custody-events/evidence/${id}/handover/external${overrideParam ? '?override=true' : ''}`, {
        location,
        externalOrganization,
        externalRecipientName,
        signatureName,
        transferReason
      });
      navigate(`/evidences/${id}/detail`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit external transfer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '640px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">External Transfer</h1>
          <p className="page-subtitle">
            Transferring evidence {evidence?.evidenceNumber} outside of the internal system.
          </p>
        </div>
      </div>

      <div className="glass-panel">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">External Organization</label>
            <input 
              type="text" 
              className="input-field"
              value={externalOrganization}
              onChange={(e) => setExternalOrganization(e.target.value)}
              placeholder="e.g. State Forensics Lab"
              required 
            />
          </div>

          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Recipient Name</label>
              <input 
                type="text" 
                className="input-field"
                value={externalRecipientName}
                onChange={(e) => setExternalRecipientName(e.target.value)}
                placeholder="e.g. John Doe"
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Signature / ID</label>
              <input 
                type="text" 
                className="input-field"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g. Badge 12345"
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Transfer Location</label>
            <input 
              type="text" 
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Precinct 4 Lobby"
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Reason for Transfer</label>
            <textarea 
              className="input-field"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              rows={3}
              placeholder="e.g. For advanced ballistics analysis"
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-purple btn-full" disabled={saving}>
              {saving ? 'Processing...' : 'Confirm External Transfer'}
            </button>
            <Link to={`/evidences/${id}/detail`} className="btn-secondary btn-full" style={{ textAlign: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
