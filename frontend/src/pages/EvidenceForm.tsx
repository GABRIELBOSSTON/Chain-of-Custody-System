import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';

const EVIDENCE_CATEGORIES = [
  'PHYSICAL',
  'DIGITAL',
  'BIOLOGICAL',
  'DOCUMENT',
  'OTHER'
];

const EVIDENCE_STATUSES = [
  'SEIZED',
  'IN_TRANSIT',
  'IN_STORAGE',
  'AT_LAB',
  'IN_COURT',
  'RETURNED',
  'DESTROYED'
];

export default function EvidenceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [cases, setCases] = useState<any[]>([]);
  const [caseId, setCaseId] = useState('');
  const [evidenceNumber, setEvidenceNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PHYSICAL');
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionLocation, setCollectionLocation] = useState('');
  const [status, setStatus] = useState('SEIZED');
  const [storageLocation, setStorageLocation] = useState('');
  const [isReadyForTransfer, setIsReadyForTransfer] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const casesRes = await api.get('/cases');
        setCases(casesRes.data);
        if (casesRes.data.length > 0 && !isEditing) {
          setCaseId(casesRes.data[0].id);
        }

        if (isEditing) {
          const evRes = await api.get(`/evidences/${id}`);
          const ev = evRes.data;
          setCaseId(ev.caseId);
          setEvidenceNumber(ev.evidenceNumber);
          setTitle(ev.title);
          setDescription(ev.description || '');
          setCategory(ev.category);
          setCollectionDate(ev.collectionDate ? new Date(ev.collectionDate).toISOString().split('T')[0] : '');
          setCollectionLocation(ev.collectionLocation);
          setStatus(ev.status);
          setStorageLocation(ev.storageLocation || '');
          setIsReadyForTransfer(ev.isReadyForTransfer);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('Forbidden: You do not have permission.');
        } else {
          setError('Failed to fetch data.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEditing) {
        // Edit mode can still use JSON if not editing file (or FormData if needed)
        // For simplicity, we just send JSON for editing in this MVP
        const payload = {
          caseId,
          evidenceNumber,
          title,
          description,
          category,
          collectionDate: new Date(collectionDate).toISOString(),
          collectionLocation,
          status,
          storageLocation,
          isReadyForTransfer
        };
        const res = await api.patch(`/evidences/${id}`, payload);
        if (res.data?.status === 'PENDING_APPROVAL') {
          alert('Edit request submitted for approval by a Detective.');
        }
      } else {
        const formData = new FormData();
        formData.append('caseId', caseId);
        formData.append('evidenceNumber', evidenceNumber);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('collectionDate', new Date(collectionDate).toISOString());
        formData.append('collectionLocation', collectionLocation);
        formData.append('status', status);
        formData.append('storageLocation', storageLocation);
        formData.append('isReadyForTransfer', isReadyForTransfer.toString());
        if (file) {
          formData.append('file', file);
        }
        await api.post('/evidences', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      navigate('/evidences');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save evidence');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Loading...</div>;

  return (
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 className="auth-title" style={{ textAlign: 'left' }}>{isEditing ? 'Edit Evidence' : 'Register Evidence'}</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="input-label">Associated Case</label>
            <select 
              className="input-field" 
              value={caseId} 
              onChange={(e) => setCaseId(e.target.value)}
              required
            >
              <option value="" disabled style={{ color: 'black' }}>Select a Case</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id} style={{ color: 'black' }}>
                  {c.caseNumber} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Evidence Number</label>
              <input 
                type="text" 
                className="input-field"
                value={evidenceNumber}
                onChange={(e) => setEvidenceNumber(e.target.value)}
                placeholder="e.g. EV-2026-001"
                required 
              />
            </div>
            <div>
              <label className="input-label">Category</label>
              <select 
                className="input-field" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {EVIDENCE_CATEGORIES.map((c) => (
                  <option key={c} value={c} style={{ color: 'black' }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Title</label>
            <input 
              type="text" 
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the item"
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Detailed Description</label>
            <textarea 
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Collection Date</label>
              <input 
                type="date" 
                className="input-field"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required 
              />
            </div>
            <div>
              <label className="input-label">Status</label>
              <select 
                className="input-field" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                {EVIDENCE_STATUSES.map((s) => (
                  <option key={s} value={s} style={{ color: 'black' }}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Collection Location</label>
            <input 
              type="text" 
              className="input-field"
              value={collectionLocation}
              onChange={(e) => setCollectionLocation(e.target.value)}
              placeholder="e.g. Crime Scene A"
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Current Storage Location</label>
            <input 
              type="text" 
              className="input-field"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g. Evidence Locker 4B"
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <input 
              type="checkbox" 
              id="isReadyForTransfer"
              checked={isReadyForTransfer}
              onChange={(e) => setIsReadyForTransfer(e.target.checked)}
            />
            <label htmlFor="isReadyForTransfer" className="input-label" style={{ marginBottom: 0 }}>
              Ready for Chain-of-Custody Transfer
            </label>
          </div>

          {!isEditing && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="input-label">Attachment (Optional)</label>
              <input 
                type="file" 
                className="input-field"
                accept=".jpg,.jpeg,.png,.pdf,.mp4"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                style={{ padding: '0.5rem' }}
              />
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                Allowed formats: JPG, PNG, PDF, MP4. Max size: 50MB.
              </small>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" disabled={saving || !!error}>
              {saving ? 'Saving...' : 'Save Evidence'}
            </button>
            <Link to="/evidences" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', textAlign: 'center', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
