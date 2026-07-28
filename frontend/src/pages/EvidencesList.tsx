import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function EvidencesList() {
  const [evidences, setEvidences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evidenceToDelete, setEvidenceToDelete] = useState<string | null>(null);

  const fetchEvidences = async () => {
    try {
      const res = await api.get('/evidences');
      setEvidences(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Forbidden: You do not have permission to view evidence.');
      } else {
        setError('Failed to fetch evidence');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidences();
  }, []);

  const confirmDelete = async () => {
    if (!evidenceToDelete) return;
    const id = evidenceToDelete;
    try {
      await api.delete(`/evidences/${id}`);
      setEvidences(evidences.filter((e) => e.id !== id));
    } catch (err: any) {
      alert('Failed to delete evidence: ' + (err.response?.data?.message || err.message));
    } finally {
      setEvidenceToDelete(null);
    }
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)' }}>
      <div className="glass-panel" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
           <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: '0' }}>Evidence Management</h1>
          <Link to="/evidences/new" className="btn-primary" style={{ textDecoration: 'none', width: 'auto' }}>
            + Register Evidence
          </Link>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <p>Loading evidence...</p>
        ) : evidences.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem' }}>Evidence #</th>
                  <th style={{ padding: '1rem' }}>Title</th>
                  <th style={{ padding: '1rem' }}>Case #</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {evidences.map((evidence) => (
                  <tr key={evidence.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>{evidence.evidenceNumber}</td>
                    <td style={{ padding: '1rem' }}>{evidence.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {evidence.case?.caseNumber || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {evidence.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        color: 'var(--accent-color)',
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        {evidence.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link to={`/evidences/${evidence.id}/detail`} style={{ color: 'var(--accent-color)', marginRight: '1rem', textDecoration: 'none' }}>View</Link>
                      <Link to={`/evidences/edit/${evidence.id}`} style={{ color: 'var(--accent-color)', marginRight: '1rem', textDecoration: 'none' }}>Edit</Link>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEvidenceToDelete(evidence.id);
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
          !error && <p style={{ padding: '1rem', textAlign: 'center' }}>No evidence registered yet.</p>
        )}
      </div>

      {evidenceToDelete && (
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
              Are you sure you want to delete this evidence? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button 
                onClick={confirmDelete}
                className="btn-primary" 
                style={{ background: 'var(--error-color)', width: 'auto', border: 'none' }}>
                Yes, Delete
              </button>
              <button 
                onClick={() => setEvidenceToDelete(null)}
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
