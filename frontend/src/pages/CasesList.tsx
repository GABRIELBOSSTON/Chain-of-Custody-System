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

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ARCHIVED: 'badge-gray',
      IN_COURT: 'badge-red',
      OPEN: 'badge-green',
      UNDER_INVESTIGATION: 'badge-blue',
      PENDING_REVIEW: 'badge-yellow',
      SUBMITTED_TO_PROSECUTION: 'badge-purple',
    };
    return map[status] || 'badge-blue';
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Cases</h1>
        <Link to="/cases/new" className="btn-primary">
          + Create Case
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading cases...</span>
        </div>
      ) : cases.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Title</th>
                <th>Status</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td><span className="font-semibold">{c.caseNumber}</span></td>
                  <td>{c.title}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-secondary">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/cases/edit/${c.id}`} className="table-action-link">Edit</Link>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCaseToDelete(c.id);
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
        !error && <div className="table-empty glass-card-static">No cases found.</div>
      )}

      {/* Delete Modal */}
      {caseToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirm Deletion</h3>
            <p className="modal-text">
              Are you sure you want to delete this case? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button onClick={confirmDelete} className="btn-danger">Yes, Delete</button>
              <button onClick={() => setCaseToDelete(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
