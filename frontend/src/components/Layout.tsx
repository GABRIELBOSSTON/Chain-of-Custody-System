import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '◉' },
    ]
  },
  {
    section: 'Management',
    items: [
      { path: '/cases', label: 'Cases', icon: '◫' },
      { path: '/evidences', label: 'Evidence', icon: '◈' },
      { path: '/users', label: 'Users', icon: '◎' },
    ]
  },
  {
    section: 'Operations',
    items: [
      { path: '/audit-logs', label: 'Audit Logs', icon: '◬' },
      { path: '/reports', label: 'Reports', icon: '▤' },
      { path: '/scan', label: 'QR Scanner', icon: '⊞' },
    ]
  },
];

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname.startsWith('/cases/new')) return 'Create Case';
  if (pathname.startsWith('/cases/edit')) return 'Edit Case';
  if (pathname === '/cases') return 'Cases';
  if (pathname.startsWith('/evidences') && pathname.endsWith('/detail')) return 'Evidence Details';
  if (pathname.startsWith('/evidences') && pathname.includes('/custody/new')) return 'Add Custody Record';
  if (pathname.startsWith('/evidences') && pathname.includes('/custody/external')) return 'External Transfer';
  if (pathname.startsWith('/evidences') && pathname.includes('/court/new')) return 'Court Presentation';
  if (pathname.startsWith('/evidences/new')) return 'Register Evidence';
  if (pathname.startsWith('/evidences/edit')) return 'Edit Evidence';
  if (pathname === '/evidences') return 'Evidence';
  if (pathname.startsWith('/users/new')) return 'Create User';
  if (pathname.startsWith('/users/edit')) return 'Edit User';
  if (pathname === '/users') return 'Users';
  if (pathname === '/audit-logs') return 'Audit Logs';
  if (pathname === '/reports') return 'Reports';
  if (pathname === '/scan') return 'QR Scanner';
  if (pathname === '/qr-redirect') return 'QR Redirect';
  return 'FCCMS';
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.policeProfile?.fullName || user?.email || 'User';
  const userRole = user?.role?.name || 'Officer';
  const userInitial = userName.charAt(0).toUpperCase();

  const pageTitle = getPageTitle(location.pathname);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <NavLink to="/dashboard" className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <span className="sidebar-brand-text">FCCMS</span>
            <span className="sidebar-brand-sub">Chain of Custody</span>
          </div>
        </NavLink>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userName}</div>
              <div className="sidebar-user-role">{userRole.replace(/_/g, ' ')}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            <span>⏻</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <span className="topbar-title">{pageTitle}</span>
          </div>
          <div className="topbar-actions">
            <NavLink to="/scan" className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              ⊞ Scan QR
            </NavLink>
          </div>
        </header>

        {/* Content */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
