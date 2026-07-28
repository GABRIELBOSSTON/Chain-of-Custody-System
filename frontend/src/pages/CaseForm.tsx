import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';

const CASE_STATUSES = [
  'OPEN',
  'UNDER_INVESTIGATION',
  'PENDING_REVIEW',
  'REFERRED',
  'SUSPENDED',
  'COLD',
  'ON_HOLD',
  'SUBMITTED_TO_PROSECUTION',
  'IN_COURT',
  'ARCHIVED'
];

export default function CaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [caseNumber, setCaseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('OPEN');
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchCase = async () => {
        try {
          const res = await api.get(`/cases/${id}`);
          const c = res.data;
          setCaseNumber(c.caseNumber);
          setTitle(c.title);
          setDescription(c.description || '');
          setStatus(c.status);
        } catch (err: any) {
          if (err.response?.status === 403) {
            setError('Forbidden: You do not have permission.');
          } else {
            setError('Failed to fetch case data.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchCase();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = { caseNumber, title, description, status };

    try {
      if (isEditing) {
        await api.patch(`/cases/${id}`, payload);
      } else {
        await api.post('/cases', payload);
      }
      navigate('/cases');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Loading...</div>;

  return (
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 className="auth-title" style={{ textAlign: 'left' }}>{isEditing ? 'Edit Case' : 'Create Case'}</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Case Number</label>
            <input 
              type="text" 
              className="input-field"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. CAS-2026-001"
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Title</label>
            <input 
              type="text" 
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea 
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="form-group">
            <label className="input-label">Status</label>
            <select 
              className="input-field" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              {CASE_STATUSES.map((s) => (
                <option key={s} value={s} style={{ color: 'black' }}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" disabled={saving || !!error}>
              {saving ? 'Saving...' : 'Save Case'}
            </button>
            <Link to="/cases" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', textAlign: 'center', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
