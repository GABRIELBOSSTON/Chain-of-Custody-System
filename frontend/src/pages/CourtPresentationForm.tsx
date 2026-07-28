import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import api from '../api';

export default function CourtPresentationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationState = useLocation();
  const queryParams = new URLSearchParams(locationState.search);
  const overrideParam = queryParams.get('override') === 'true';

  const [evidence, setEvidence] = useState<any>(null);
  const [courtName, setCourtName] = useState('');
  const [exhibitNumber, setExhibitNumber] = useState('');
  const [presentedDate, setPresentedDate] = useState('');

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
      await api.post(`/court-presentations${overrideParam ? '?override=true' : ''}`, {
        evidenceId: id,
        courtName,
        exhibitNumber,
        presentedDate: new Date(presentedDate).toISOString()
      });
      navigate(`/evidences/${id}/detail`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record court presentation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Loading...</div>;

  return (
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 className="auth-title" style={{ textAlign: 'left', color: '#eab308' }}>Court Presentation</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Recording evidence {evidence?.evidenceNumber} presentation in court.
        </p>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Court Name</label>
            <input 
              type="text" 
              className="input-field"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              placeholder="e.g. 1st District Court"
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Exhibit Number</label>
            <input 
              type="text" 
              className="input-field"
              value={exhibitNumber}
              onChange={(e) => setExhibitNumber(e.target.value)}
              placeholder="e.g. State's Exhibit A"
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Presented Date</label>
            <input 
              type="datetime-local" 
              className="input-field"
              value={presentedDate}
              onChange={(e) => setPresentedDate(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" style={{ background: '#eab308', borderColor: '#eab308', color: '#1a1a1a' }} disabled={saving}>
              {saving ? 'Processing...' : 'Record Presentation'}
            </button>
            <Link to={`/evidences/${id}/detail`} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', textAlign: 'center', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
