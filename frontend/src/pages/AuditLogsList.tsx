import { useState, useEffect } from 'react';
import api from '../api';

export default function AuditLogsList() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query ? `/audit-logs?q=${encodeURIComponent(query)}` : '/audit-logs';
      const res = await api.get(endpoint);
      setLogs(res.data);
    } catch (err: any) {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(searchQuery);
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Search by User, Module, or Action..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary">Search</button>
        {searchQuery && (
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => {
              setSearchQuery('');
              fetchLogs('');
            }}
          >
            Clear
          </button>
        )}
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Module</th>
                <th>Action</th>
                <th>Hashes (Prev / New)</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }} className="text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="text-sm">
                      {log.user ? (log.user.policeProfile?.fullName || log.user.email) : 'System'}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {log.entityType || 'General'}
                      </span>
                    </td>
                    <td className="font-semibold text-sm">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="text-sm text-secondary">
                      {log.previousHash ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div title={log.previousHash} className="truncate" style={{ maxWidth: '140px' }}>Prev: {log.previousHash}</div>
                          <div title={log.newHash} className="truncate" style={{ maxWidth: '140px' }}>New: {log.newHash}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="text-sm text-secondary">
                      {log.description || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
