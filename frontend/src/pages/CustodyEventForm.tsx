import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';

const CUSTODY_ACTIONS = [
  'COLLECTED',
  'TRANSFERRED',
  'RECEIVED',
  'LAB_ANALYSIS',
  'COURT_SUBMISSION',
  'RETURNED',
  'OTHER',
  'CREATE',
  'VIEW',
  'HANDOVER_DISPATCH',
  'HANDOVER_ACK',
  'VERIFY'
];

export default function CustodyEventForm() {
  const { id: evidenceId } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState<any[]>([]);
  const [action, setAction] = useState('COLLECTED');
  const [actorId, setActorId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [location, setLocation] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users');
        setUsers(res.data);
        if (res.data.length > 0) {
          setActorId(res.data[0].id);
        }
      } catch (err: any) {
        setError('Failed to fetch users for dropdown.');
      } finally {
        setLoading(false);
      }
    };
    
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
    setEventTime(localISOTime);

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      evidenceId,
      action,
      actorId,
      recipientId: recipientId || undefined,
      location,
      eventTime: new Date(eventTime).toISOString(),
      notes: notes || undefined
    };

    try {
      if (action === 'HANDOVER_DISPATCH') {
        if (!recipientId) {
          setError('Recipient is required for Handover Dispatch');
          setSaving(false);
          return;
        }
        await api.post(`/custody-events/evidence/${evidenceId}/handover/dispatch`, {
          recipientId,
          location
        });
      } else {
        await api.post('/custody-events', payload);
      }
      navigate(`/evidences/${evidenceId}/detail`);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save custody record');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading form...</span>
      </div>
    );
  }

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '640px' }}>
      <div className="page-header">
        <h1 className="page-title">Add Custody Record</h1>
      </div>

      <div className="glass-panel">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row form-row-2" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Action</label>
              <select 
                className="input-field" 
                value={action} 
                onChange={(e) => setAction(e.target.value)}
                required
              >
                {CUSTODY_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Date & Time</label>
              <input 
                type="datetime-local" 
                className="input-field"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">From Person (Actor)</label>
            <select 
              className="input-field" 
              value={actorId} 
              onChange={(e) => setActorId(e.target.value)}
              required
            >
              <option value="" disabled>Select Person</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.policeProfile?.fullName || u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">To Person (Recipient) — Optional</label>
            <select 
              className="input-field" 
              value={recipientId} 
              onChange={(e) => setRecipientId(e.target.value)}
            >
              <option value="">None</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.policeProfile?.fullName || u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Location</label>
            <input 
              type="text" 
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Crime Scene, Evidence Locker 4A"
              required 
            />
          </div>

          <div className="form-group">
            <label className="input-label">Notes (Optional)</label>
            <textarea 
              className="input-field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any relevant transfer notes here..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary btn-full" disabled={saving || !!error}>
              {saving ? 'Saving...' : 'Save Record'}
            </button>
            <Link to={`/evidences/${evidenceId}/detail`} className="btn-secondary btn-full" style={{ textAlign: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
