import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/roles')
      ]);
      setUsers(usersRes.data);
      
      const roleMap: Record<string, string> = {};
      rolesRes.data.forEach((r: any) => { roleMap[r.id] = r.name; });
      setRoles(roleMap);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Forbidden: You do not have permission to view users.');
      } else {
        setError('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const id = userToDelete;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>
      <div className="glass-panel" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
           <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: '0' }}>Users Management</h1>
          <Link to="/users/new" className="btn-primary" style={{ textDecoration: 'none', width: 'auto' }}>
            + Create User
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <p>Loading users...</p>
        ) : users.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>{user.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {roles[user.roleId] || 'UNKNOWN'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        color: user.isActive ? 'var(--success-color)' : 'var(--error-color)',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link to={`/users/edit/${user.id}`} style={{ color: 'var(--accent-color)', marginRight: '1rem', textDecoration: 'none' }}>Edit</Link>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUserToDelete(user.id);
                        }} 
                        style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer', fontSize: '1rem' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !error && <p style={{ padding: '1rem', textAlign: 'center' }}>No users found.</p>
        )}
      </div>

      {userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
            <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button 
                onClick={confirmDelete}
                className="btn-primary" 
                style={{ background: 'var(--error-color)', width: 'auto', border: 'none' }}>
                Yes, Delete
              </button>
              <button 
                onClick={() => setUserToDelete(null)}
                className="btn-primary" 
                style={{ background: 'transparent', border: '1px solid var(--glass-border)', width: 'auto' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
