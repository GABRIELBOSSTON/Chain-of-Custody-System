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
  
  // New Domain Fields
  const [parentId, setParentId] = useState('');
  const [warrantNumber, setWarrantNumber] = useState('');
  const [consentReference, setConsentReference] = useState('');
  const [seizureAuth, setSeizureAuth] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [storageBuilding, setStorageBuilding] = useState('');
  const [storageRoom, setStorageRoom] = useState('');
  const [storageCabinet, setStorageCabinet] = useState('');
  const [storageShelf, setStorageShelf] = useState('');
  const [storageLocker, setStorageLocker] = useState('');

  const [isReadyForTransfer, setIsReadyForTransfer] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [evidences, setEvidences] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const casesRes = await api.get('/cases');
        setCases(casesRes.data);
        if (casesRes.data.length > 0 && !isEditing) {
          setCaseId(casesRes.data[0].id);
        }
        const evListRes = await api.get('/evidences');
        setEvidences(evListRes.data);

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
          
          setParentId(ev.parentId || '');
          setWarrantNumber(ev.warrantNumber || '');
          setConsentReference(ev.consentReference || '');
          setSeizureAuth(ev.seizureAuth || '');
          setLegalBasis(ev.legalBasis || '');
          setStorageBuilding(ev.storageBuilding || '');
          setStorageRoom(ev.storageRoom || '');
          setStorageCabinet(ev.storageCabinet || '');
          setStorageShelf(ev.storageShelf || '');
          setStorageLocker(ev.storageLocker || '');
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
          isReadyForTransfer,
          parentId: parentId || undefined,
          warrantNumber,
          consentReference,
          seizureAuth,
          legalBasis,
          storageBuilding,
          storageRoom,
          storageCabinet,
          storageShelf,
          storageLocker
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
        if (parentId) formData.append('parentId', parentId);
        if (warrantNumber) formData.append('warrantNumber', warrantNumber);
        if (consentReference) formData.append('consentReference', consentReference);
        if (seizureAuth) formData.append('seizureAuth', seizureAuth);
        if (legalBasis) formData.append('legalBasis', legalBasis);
        if (storageBuilding) formData.append('storageBuilding', storageBuilding);
        if (storageRoom) formData.append('storageRoom', storageRoom);
        if (storageCabinet) formData.append('storageCabinet', storageCabinet);
        if (storageShelf) formData.append('storageShelf', storageShelf);
        if (storageLocker) formData.append('storageLocker', storageLocker);
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

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Evidence' : 'Register Evidence'}</h1>
      </div>

      <div className="glass-panel">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="form-group">
            <label className="input-label">Associated Case</label>
            <select 
              className="input-field" 
              value={caseId} 
              onChange={(e) => setCaseId(e.target.value)}
              required
            >
              <option value="" disabled>Select a Case</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Parent Evidence (Optional Hierarchy)</label>
            <select 
              className="input-field" 
              value={parentId} 
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">None (Top Level)</option>
              {evidences.filter(e => e.id !== id).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.evidenceNumber} - {e.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
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
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Category</label>
              <select 
                className="input-field" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {EVIDENCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
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
              placeholder="Provide detailed description of the evidence..."
            />
          </div>

          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Collection Date</label>
              <input 
                type="date" 
                className="input-field"
                value={collectionDate}
                onChange={(e) => setCollectionDate(e.target.value)}
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Status</label>
              <select 
                className="input-field" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                {EVIDENCE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
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

          {/* Legal Authority Section */}
          <h3 className="form-section-title">Legal Authority</h3>
          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Warrant Number</label>
              <input type="text" className="input-field" value={warrantNumber} onChange={(e) => setWarrantNumber(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Consent Reference</label>
              <input type="text" className="input-field" value={consentReference} onChange={(e) => setConsentReference(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Seizure Authorization</label>
              <input type="text" className="input-field" value={seizureAuth} onChange={(e) => setSeizureAuth(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Legal Basis</label>
              <input type="text" className="input-field" value={legalBasis} onChange={(e) => setLegalBasis(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {/* Physical Storage Section */}
          <h3 className="form-section-title">Physical Storage Tracking</h3>
          <div className="form-group">
            <label className="input-label">Legacy Storage Location (General)</label>
            <input 
              type="text" 
              className="input-field"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g. Evidence Locker 4B"
            />
          </div>
          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Building</label>
              <input type="text" className="input-field" value={storageBuilding} onChange={(e) => setStorageBuilding(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Room</label>
              <input type="text" className="input-field" value={storageRoom} onChange={(e) => setStorageRoom(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="form-row form-row-3" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Cabinet</label>
              <input type="text" className="input-field" value={storageCabinet} onChange={(e) => setStorageCabinet(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Shelf</label>
              <input type="text" className="input-field" value={storageShelf} onChange={(e) => setStorageShelf(e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Locker</label>
              <input type="text" className="input-field" value={storageLocker} onChange={(e) => setStorageLocker(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="form-group">
            <div className="checkbox-wrapper">
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
          </div>

          {!isEditing && (
            <div className="form-group">
              <label className="input-label">Attachment (Optional)</label>
              <input 
                type="file" 
                className="input-field"
                accept=".jpg,.jpeg,.png,.pdf,.mp4"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              />
              <span className="form-hint">
                Allowed formats: JPG, PNG, PDF, MP4. Max size: 50MB.
              </span>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary btn-full" disabled={saving || !!error}>
              {saving ? 'Saving...' : 'Save Evidence'}
            </button>
            <Link to="/evidences" className="btn-secondary btn-full" style={{ textAlign: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
