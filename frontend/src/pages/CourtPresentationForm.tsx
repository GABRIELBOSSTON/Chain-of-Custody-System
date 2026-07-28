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
          <h1 className="page-title">Court Presentation</h1>
          <p className="page-subtitle">
            Recording evidence {evidence?.evidenceNumber} presentation in court.
          </p>
        </div>
      </div>

      <div className="glass-panel">
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

          <div className="form-actions">
            <button type="submit" className="btn-warning btn-full" disabled={saving}>
              {saving ? 'Processing...' : 'Record Presentation'}
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
