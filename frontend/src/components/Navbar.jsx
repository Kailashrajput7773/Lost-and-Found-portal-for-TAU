import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ theme, toggleTheme, user, setUser }) => {
  const location = useLocation();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  return (
    <>
      {/* Top Green Announcement Bar */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span className="topbar-phone">
              📞 +91 877 228 8888
            </span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>Helpline: support@apollo.edu.in</span>
          </div>
          <div className="topbar-center">
            <span className="topbar-badge">Official</span>
            <span>The Apollo University • Campus Lost &amp; Found Portal</span>
          </div>
          <div className="topbar-right">
            <span>📍 Chittoor Main Campus</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="header">
        <div className="container nav">
          <Link to="/" className="brand" title="The Apollo University Lost & Found Portal">
            <img
              src="/apollo-university-transparent.png"
              alt="The Apollo University"
              className="apollo-main-logo"
            />
            <div className="brand-divider"></div>
            <div className="brand-portal-block">
              <div className="brand-portal-title">Lost &amp; Found</div>
              <div className="brand-portal-sub">Portal Hub</div>
            </div>
          </Link>

          <nav className="nav-links">
            <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
              Home
            </Link>
            <Link className={`nav-link ${location.pathname === '/listings' ? 'active' : ''}`} to="/listings">
              Browse Items
            </Link>
            <Link className={`nav-link ${location.pathname === '/report-lost' ? 'active' : ''}`} to="/report-lost">
              Report Lost
            </Link>
            <Link className={`nav-link ${location.pathname === '/report-found' ? 'active' : ''}`} to="/report-found">
              Report Found
            </Link>
          </nav>

          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className={`btn-action-sm ${location.pathname === '/admin' ? 'active' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                  color: '#ffffff',
                  fontWeight: '700',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)'
                }}
              >
                <span>🛡️</span> Admin Console
              </Link>
            )}

            <span className="account-pill">
              {user ? (
                <>
                  {isAdmin ? '🛡️ Admin: ' : user.role === 'staff' ? '👨‍🏫 Staff: ' : '🎓 Student: '}
                  <strong>{user.name || user.fullName || user.username || user.email}</strong>
                </>
              ) : (
                '👤 Guest'
              )}
            </span>

            {user ? (
              <button
                className="btn-login"
                onClick={() => setUser(null)}
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn-login">
                Login / Admin
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
