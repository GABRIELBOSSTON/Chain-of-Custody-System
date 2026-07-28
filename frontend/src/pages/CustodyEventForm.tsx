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
  // Actor defaults to empty (will be selected by user, though could auto-default to current user)
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
    
    // Set default datetime to now
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm
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

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Loading form...</div>;

  return (
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <h1 className="auth-title" style={{ textAlign: 'left' }}>Add Custody Record</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Action</label>
              <select 
                className="input-field" 
                value={action} 
                onChange={(e) => setAction(e.target.value)}
                required
              >
                {CUSTODY_ACTIONS.map((a) => (
                  <option key={a} value={a} style={{ color: 'black' }}>
                    {a.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
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
              <option value="" disabled style={{ color: 'black' }}>Select Person</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} style={{ color: 'black' }}>
                  {u.policeProfile?.fullName || u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">To Person (Recipient) - Optional</label>
            <select 
              className="input-field" 
              value={recipientId} 
              onChange={(e) => setRecipientId(e.target.value)}
            >
              <option value="" style={{ color: 'black' }}>None</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} style={{ color: 'black' }}>
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
              style={{ resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" disabled={saving || !!error}>
              {saving ? 'Saving...' : 'Save Record'}
            </button>
            <Link to={`/evidences/${evidenceId}/detail`} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', textAlign: 'center', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
