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

  const getRoleBadge = (roleName: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'badge-red',
      ADMIN: 'badge-purple',
      DETECTIVE: 'badge-blue',
      OFFICER: 'badge-green',
      FORENSIC_ANALYST: 'badge-yellow',
    };
    return map[roleName] || 'badge-gray';
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <Link to="/users/new" className="btn-primary">
          + Create User
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading users...</span>
        </div>
      ) : users.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleName = roles[user.roleId] || 'UNKNOWN';
                return (
                  <tr key={user.id}>
                    <td><span className="font-medium">{user.email}</span></td>
                    <td>
                      <span className={`badge ${getRoleBadge(roleName)}`}>
                        {roleName.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                        {user.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/users/edit/${user.id}`} className="table-action-link">Edit</Link>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setUserToDelete(user.id);
                        }} 
                        className="table-action-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <div className="table-empty glass-card-static">No users found.</div>
      )}

      {/* Delete Modal */}
      {userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Deletion</h3>
            <p className="modal-text">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="btn-danger">Yes, Delete</button>
              <button onClick={() => setUserToDelete(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
