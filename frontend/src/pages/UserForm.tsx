import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api';

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [email, setEmail] = useState('');
  const [policeId, setPoliceId] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRolesAndUser = async () => {
      try {
        const rolesRes = await api.get('/users/roles');
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0 && !isEditing) {
          setRoleId(rolesRes.data[0].id);
        }

        if (isEditing) {
          const userRes = await api.get(`/users/${id}`);
          const user = userRes.data;
          setEmail(user.email);
          setRoleId(user.roleId);
          setIsActive(user.isActive);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('Forbidden: You do not have permission.');
        } else {
          setError('Failed to fetch data. Ensure you are an Admin.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRolesAndUser();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload: any = { email, roleId, isActive };
    if (!isEditing) {
      payload.policeId = policeId;
      payload.fullName = fullName;
    }

    try {
      if (isEditing) {
        await api.patch(`/users/${id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      navigate('/users');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>Loading...</div>;

  return (
    <div className="centered-page">
      <div className="auth-container glass-panel" style={{ maxWidth: '500px' }}>
        <h1 className="auth-title" style={{ textAlign: 'left' }}>{isEditing ? 'Edit User' : 'Create User'}</h1>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          {!isEditing && (
            <>
              <div className="form-group">
                <label className="input-label">Police Badge Number</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={policeId}
                  onChange={(e) => setPoliceId(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="input-label">Full Name</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="input-label">Role</label>
            <select 
              className="input-field" 
              value={roleId} 
              onChange={(e) => setRoleId(e.target.value)}
              required
            >
              <option value="" disabled style={{ color: 'black' }}>Select a role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id} style={{ color: 'black' }}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive" className="input-label" style={{ marginBottom: 0 }}>Active Account</label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" disabled={saving || !!error}>
              {saving ? 'Saving...' : 'Save User'}
            </button>
            <Link to="/users" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', textAlign: 'center', textDecoration: 'none' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
