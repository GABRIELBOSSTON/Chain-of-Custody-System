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

  const getCategoryBadge = (category: string) => {
    const map: Record<string, string> = {
      PHYSICAL: 'badge-blue',
      DIGITAL: 'badge-purple',
      BIOLOGICAL: 'badge-green',
      DOCUMENT: 'badge-yellow',
      OTHER: 'badge-gray',
    };
    return map[category] || 'badge-blue';
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Evidence</h1>
        <Link to="/evidences/new" className="btn-primary">
          + Register Evidence
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading evidence...</span>
        </div>
      ) : evidences.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Evidence #</th>
                <th>Title</th>
                <th>Case #</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evidences.map((evidence) => (
                <tr key={evidence.id}>
                  <td><span className="font-semibold">{evidence.evidenceNumber}</span></td>
                  <td>{evidence.title}</td>
                  <td className="text-secondary">{evidence.case?.caseNumber || 'Unknown'}</td>
                  <td>
                    <span className={`badge ${getCategoryBadge(evidence.category)}`}>
                      {evidence.category}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-glass">
                      {evidence.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <Link to={`/evidences/${evidence.id}/detail`} className="table-action-link">View</Link>
                    <Link to={`/evidences/edit/${evidence.id}`} className="table-action-link">Edit</Link>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEvidenceToDelete(evidence.id);
                      }} 
                      className="table-action-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && <div className="table-empty glass-card-static">No evidence registered yet.</div>
      )}

      {/* Delete Modal */}
      {evidenceToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Deletion</h3>
            <p className="modal-text">
              Are you sure you want to delete this evidence? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="btn-danger">Yes, Delete</button>
              <button onClick={() => setEvidenceToDelete(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
