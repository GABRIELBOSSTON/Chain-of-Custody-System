import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function CasesList() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      const response = await api.get('/cases');
      setCases(response.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Forbidden: You do not have permission to view cases.');
      } else {
        setError('Failed to fetch cases');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const confirmDelete = async () => {
    if (!caseToDelete) return;
    const id = caseToDelete;
    try {
      await api.delete(`/cases/${id}`);
      setCases(cases.filter((c) => c.id !== id));
    } catch (err: any) {
      alert('Failed to delete case: ' + (err.response?.data?.message || err.message));
    } finally {
      setCaseToDelete(null);
    }
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>
      <div className="glass-panel" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
           <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: '0' }}>Cases Management</h1>
          <Link to="/cases/new" className="btn-primary" style={{ textDecoration: 'none', width: 'auto', background: '#3b82f6' }}>
            + Create Case
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <p>Loading cases...</p>
        ) : cases.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem' }}>Case Number</th>
                  <th style={{ padding: '1rem' }}>Title</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Date Created</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.caseNumber}</td>
                    <td style={{ padding: '1rem' }}>{c.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        background: c.status === 'ARCHIVED' ? 'rgba(156, 163, 175, 0.5)' : (c.status === 'IN_COURT' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'),
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem' }}>
                      <Link to={`/cases/edit/${c.id}`} style={{ color: 'var(--accent-color)', marginRight: '1rem', textDecoration: 'none' }}>Edit</Link>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCaseToDelete(c.id);
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
          !error && <p style={{ padding: '1rem', textAlign: 'center' }}>No cases found.</p>
        )}
      </div>

      {caseToDelete && (
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
              Are you sure you want to delete this case? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button 
                onClick={confirmDelete}
                className="btn-primary" 
                style={{ background: 'var(--error-color)', width: 'auto', border: 'none' }}>
                Yes, Delete
              </button>
              <button 
                onClick={() => setCaseToDelete(null)}
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
