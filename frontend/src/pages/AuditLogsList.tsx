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
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div className="auth-container glass-panel" style={{ maxWidth: '1000px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: '0' }}>Audit Logs</h1>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search by User, Module, or Action..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ width: '100px' }}>Search</button>
          {searchQuery && (
            <button 
              type="button" 
              className="btn-primary" 
              style={{ width: '100px', background: 'transparent', border: '1px solid var(--glass-border)' }}
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
          <div style={{ color: 'var(--text-primary)' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Module</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {log.user ? (log.user.policeProfile?.fullName || log.user.email) : 'System'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="role-badge" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                          {log.entityType || 'General'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>
                        {log.action.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {log.description || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
