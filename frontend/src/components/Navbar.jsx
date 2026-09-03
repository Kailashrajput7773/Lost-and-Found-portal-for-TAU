import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApolloFlameIcon } from './ApolloLogo';

const Navbar = ({ theme, toggleTheme, user, setUser }) => {
  const location = useLocation();

  return (
    <>
      {/* Top Green Announcement Bar matching the screenshot */}
      <div className="topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span className="topbar-phone">
              📞 +91 877 228 8888
            </span>
            <span style={{opacity: 0.5}}>|</span>
            <span>Helpline: support@apollo.edu.in</span>
          </div>
          <div className="topbar-center">
            <span className="topbar-badge">Official</span>
            <span>Campus Lost & Found Portal • Reconnecting Students Daily</span>
          </div>
          <div className="topbar-right">
            <span>📍 Chittoor Main Campus</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="header">
        <div className="container nav">
          <Link to="/" className="brand" title="The Apollo University – Lost & Found Portal">
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
            <Link className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} to="/admin">
              Admin
            </Link>
          </nav>

          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className="account-pill">
              {user ? (user.role === 'staff' ? '👔 ' : user.role === 'moderator' ? '🛡️ ' : '🎓 ') + (user.fullName || user.username) : '👤 Guest'}
            </span>
            {user ? (
              <button className="btn-login" onClick={() => setUser(null)}>
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn-login">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
