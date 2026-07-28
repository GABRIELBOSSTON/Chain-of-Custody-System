import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/reports/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load dashboard summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="centered-page" style={{ color: 'var(--text-primary)' }}>
        Loading Dashboard...
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="centered-page" style={{ color: 'var(--text-primary)' }}>
        Failed to load dashboard. <button onClick={handleLogout} className="btn-primary" style={{marginTop: '1rem'}}>Logout</button>
      </div>
    );
  }

  const casesData = summary.charts?.casesByStatus?.map((item: any) => ({
    name: item.status.replace(/_/g, ' '),
    value: item._count.id
  })) || [];

  const evidenceData = summary.charts?.evidenceByCategory?.map((item: any) => ({
    name: item.category.replace(/_/g, ' '),
    value: item._count.id
  })) || [];

  return (
    <div className="centered-page" style={{ alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '1200px', width: '100%', padding: '0 2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.policeProfile?.fullName || user?.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/scan" className="btn-primary" style={{ textDecoration: 'none', background: '#3b82f6', border: 'none' }}>
              Scan QR
            </Link>
            <button onClick={handleLogout} className="btn-primary" style={{ width: 'auto', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              Logout
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          <Link to="/users" className="glass-panel" style={{ textDecoration: 'none', color: 'inherit', padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s', display: 'block' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#818cf8' }}>{summary.totals?.users || 0}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Total Users</p>
          </Link>
          <Link to="/cases" className="glass-panel" style={{ textDecoration: 'none', color: 'inherit', padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s', display: 'block' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#34d399' }}>{summary.totals?.cases || 0}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Total Cases</p>
          </Link>
          <Link to="/evidences" className="glass-panel" style={{ textDecoration: 'none', color: 'inherit', padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s', display: 'block' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#fbbf24' }}>{summary.totals?.evidence || 0}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Total Evidence</p>
          </Link>
          <Link to="/reports" className="glass-panel" style={{ textDecoration: 'none', color: 'inherit', padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s', display: 'block' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#f87171' }}>{summary.totals?.custodyEvents || 0}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Custody Events</p>
          </Link>
          <Link to="/audit-logs" className="glass-panel" style={{ textDecoration: 'none', color: 'inherit', padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s', display: 'block' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#a78bfa' }}>{summary.totals?.auditLogs || 0}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Audit Logs</p>
          </Link>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#f59e0b' }}>{summary.totals?.pendingHandovers || 0}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Pending Handovers</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s', border: summary.totals?.overdueHandovers ? '1px solid #ef4444' : undefined }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#ef4444' }}>{summary.totals?.overdueHandovers || 0}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Overdue Handovers</p>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {casesData.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Cases by Status</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={casesData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name, percent}: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                      {casesData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {evidenceData.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Evidence by Type</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={evidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', color: '#fff' }} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Latest Evidence</h3>
            {summary.recent?.evidence?.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {summary.recent.evidence.map((ev: any) => (
                  <li key={ev.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{ev.evidenceNumber}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(ev.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{ev.title}</div>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: 'var(--text-secondary)' }}>No recent evidence.</p>}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Latest Custody Events</h3>
            {summary.recent?.custodyEvents?.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {summary.recent.custodyEvents.map((ce: any) => (
                  <li key={ce.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#fbbf24' }}>{ce.action.replace(/_/g, ' ')}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(ce.eventTime).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      From: {ce.fromPerson} &rarr; To: {ce.toPerson}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: 'var(--text-secondary)' }}>No recent custody events.</p>}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Latest Audit Logs</h3>
            {summary.recent?.auditLogs?.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {summary.recent.auditLogs.map((log: any) => (
                  <li key={log.id} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#a78bfa' }}>{log.action.replace(/_/g, ' ')}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {log.entityType || 'System'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: 'var(--text-secondary)' }}>No recent audit logs.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
