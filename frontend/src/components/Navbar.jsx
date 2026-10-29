import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PlusCircle, User, Shield } from 'lucide-react';

const Navbar = ({ theme, toggleTheme, user, setUser }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  const closeMobile = () => setMobileMenuOpen(false);

  // Keyboard accessibility: Close mobile drawer with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Accessibility: Skip Navigation Link for Screen Readers and Keyboard Navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Announcement Bar */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span className="topbar-phone">📞 +91 877 228 8888</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span>Helpline: support@apollo.edu.in</span>
          </div>
          <div className="topbar-center">
            <span className="topbar-badge">Official Campus Network</span>
            <span>The Apollo University • Student Welfare Desk</span>
          </div>
          <div className="topbar-right">
            <span>📍 Chittoor Main Campus</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="header" role="banner">
        <div className="container nav">
          <Link
            to="/"
            className="brand"
            title="Lost & Found Hub – The Apollo University"
            aria-label="Lost & Found Hub, The Apollo University Home"
            onClick={closeMobile}
          >
            <img
              src="/apollo-university-transparent.png"
              alt="The Apollo University Logo"
              className="apollo-main-logo"
            />
            <div className="brand-divider"></div>
            <div className="brand-portal-block">
              <div className="brand-portal-title">Lost &amp; Found Hub</div>
              <div className="brand-portal-sub">The Apollo University</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links" aria-label="Main Navigation">
            <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
              Home
            </Link>
            <Link className={`nav-link ${location.pathname === '/listings' && !location.search.includes('tab=my') ? 'active' : ''}`} to="/listings">
              Browse Items
            </Link>
            <Link className={`nav-link ${location.pathname === '/report-lost' ? 'active' : ''}`} to="/report-lost">
              Report Lost
            </Link>
            <Link className={`nav-link ${location.pathname === '/report-found' ? 'active' : ''}`} to="/report-found">
              Report Found
            </Link>
            {user && (
              <>
                <Link
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  to="/dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  className={`nav-link ${location.pathname === '/my-reports' ? 'active' : ''}`}
                  to="/my-reports"
                >
                  My Reports
                </Link>
              </>
            )}
            <Link className={`nav-link ${location.pathname === '/safetag' ? 'active' : ''}`} to="/safetag" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span>🏷️</span> SafeTag™
            </Link>
            <Link className={`nav-link ${location.pathname === '/reunited' ? 'active' : ''}`} to="/reunited" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span>🎉</span> Reunited &amp; Reviews
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className={`btn-action-sm ${location.pathname === '/admin' ? 'active' : ''}`}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: '600',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-btn)',
                  fontSize: '13px',
                  minHeight: '44px'
                }}
              >
                <Shield size={14} /> Admin Console
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
                className="btn-secondary-pill"
                onClick={() => setUser(null)}
                style={{ padding: '8px 14px', fontSize: '13px', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
              >
                Sign Out
              </button>
            ) : (
              <Link to="/login" className="btn-login" style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
                <User size={14} /> Sign In
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              style={{
                display: 'none',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--text-main)',
                minWidth: '44px',
                minHeight: '44px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            id="mobile-nav-menu"
            className="mobile-nav-drawer"
            aria-label="Mobile Navigation"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card-hover)'
            }}
          >
            <Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/" onClick={closeMobile}>
              Home
            </Link>
            <Link className={`nav-link ${location.pathname === '/listings' && !location.search.includes('tab=my') ? 'active' : ''}`} to="/listings" onClick={closeMobile}>
              Browse Items
            </Link>
            <Link className={`nav-link ${location.pathname === '/report-lost' ? 'active' : ''}`} to="/report-lost" onClick={closeMobile}>
              Report Lost Item
            </Link>
            <Link className={`nav-link ${location.pathname === '/report-found' ? 'active' : ''}`} to="/report-found" onClick={closeMobile}>
              Report Found Item
            </Link>
            {user && (
              <>
                <Link
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  to="/dashboard"
                  onClick={closeMobile}
                >
                  Dashboard
                </Link>
                <Link
                  className={`nav-link ${location.pathname === '/my-reports' ? 'active' : ''}`}
                  to="/my-reports"
                  onClick={closeMobile}
                >
                  My Reports
                </Link>
              </>
            )}
            <Link className={`nav-link ${location.pathname === '/safetag' ? 'active' : ''}`} to="/safetag" onClick={closeMobile}>
              <span>🏷️</span> SafeTag™ QR Sticker
            </Link>
            <Link className={`nav-link ${location.pathname === '/reunited' ? 'active' : ''}`} to="/reunited" onClick={closeMobile}>
              <span>🎉</span> Reunited Belongings &amp; Reviews
            </Link>

            <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {user ? (user.name || user.fullName || user.email) : 'Browsing as Guest'}
              </div>
              {user ? (
                <button
                  className="btn-secondary-pill"
                  onClick={() => { setUser(null); closeMobile(); }}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Sign Out
                </button>
              ) : (
                <Link to="/login" className="btn-primary" onClick={closeMobile} style={{ padding: '6px 14px', fontSize: '13px' }}>
                  Sign In
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
};

export default Navbar;
