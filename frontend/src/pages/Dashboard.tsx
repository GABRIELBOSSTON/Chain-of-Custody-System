import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import api from '../api';

export default function Dashboard() {
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading Dashboard...</span>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="loading-state">
        <p className="text-secondary">Failed to load dashboard data.</p>
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

  const statCards = [
    { label: 'Total Users', value: summary.totals?.users || 0, color: '#3B82F6', link: '/users' },
    { label: 'Total Cases', value: summary.totals?.cases || 0, color: '#10B981', link: '/cases' },
    { label: 'Total Evidence', value: summary.totals?.evidence || 0, color: '#F59E0B', link: '/evidences' },
    { label: 'Custody Events', value: summary.totals?.custodyEvents || 0, color: '#EF4444', link: '/reports' },
    { label: 'Audit Logs', value: summary.totals?.auditLogs || 0, color: '#8B5CF6', link: '/audit-logs' },
    { label: 'Pending Handovers', value: summary.totals?.pendingHandovers || 0, color: '#F59E0B', link: null },
    { label: 'Overdue Handovers', value: summary.totals?.overdueHandovers || 0, color: '#EF4444', link: null, alert: (summary.totals?.overdueHandovers || 0) > 0 },
  ];

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Welcome Header */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 className="page-title" style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-xs)' }}>
          Welcome back
        </h1>
        <p className="text-secondary text-md">
          {user?.policeProfile?.fullName || user?.email}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
        {statCards.map((card) => {
          const content = (
            <>
              <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </>
          );

          if (card.link) {
            return (
              <Link
                key={card.label}
                to={card.link}
                className="stat-card"
                style={{ '--stat-accent': card.color } as React.CSSProperties}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={card.label}
              className="stat-card"
              style={{
                '--stat-accent': card.color,
                borderColor: card.alert ? 'rgba(239, 68, 68, 0.3)' : undefined,
              } as React.CSSProperties}
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        {casesData.length > 0 && (
          <div className="glass-card-static">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Cases by Status</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={casesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={0}
                    label={({name, percent}: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {casesData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {evidenceData.length > 0 && (
          <div className="glass-card-static">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>Evidence by Category</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={evidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
        {/* Latest Evidence */}
        <div className="glass-card-static">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--glass-border)' }}>
            Latest Evidence
          </h3>
          {summary.recent?.evidence?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {summary.recent.evidence.map((ev: any) => (
                <div key={ev.id} style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-semibold text-base">{ev.evidenceNumber}</span>
                    <span className="text-sm text-tertiary">{new Date(ev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-secondary" style={{ marginTop: '2px' }}>{ev.title}</div>
                </div>
              ))}
            </div>
          ) : <p className="text-secondary text-sm">No recent evidence.</p>}
        </div>

        {/* Latest Custody Events */}
        <div className="glass-card-static">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--glass-border)' }}>
            Latest Custody Events
          </h3>
          {summary.recent?.custodyEvents?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {summary.recent.custodyEvents.map((ce: any) => (
                <div key={ce.id} style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-yellow">{ce.action.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-tertiary">{new Date(ce.eventTime).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-secondary" style={{ marginTop: '4px' }}>
                    From: {ce.fromPerson} → To: {ce.toPerson}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-secondary text-sm">No recent custody events.</p>}
        </div>

        {/* Latest Audit Logs */}
        <div className="glass-card-static">
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-lg)', paddingBottom: 'var(--space-sm)', borderBottom: '1px solid var(--glass-border)' }}>
            Latest Audit Logs
          </h3>
          {summary.recent?.auditLogs?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {summary.recent.auditLogs.map((log: any) => (
                <div key={log.id} style={{ padding: 'var(--space-sm) 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-purple">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-tertiary">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-secondary" style={{ marginTop: '4px' }}>
                    {log.entityType || 'System'}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-secondary text-sm">No recent audit logs.</p>}
        </div>
      </div>
    </div>
  );
}
