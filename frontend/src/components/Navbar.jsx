import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ theme, toggleTheme, user, setUser }) => {
  return (
    <header className="header">
      <div className="container nav">
        <div className="brand">
          <img className="logo-img" src="/apollo-logo.svg" alt="The Apollo University logo" />
          <div className="brand-title">The Apollo University – Lost & Found Portal</div>
        </div>
        <div className="nav-links">
          <Link className="nav-link" to="/">Home</Link>
          <Link className="nav-link" to="/report-lost">Report Lost</Link>
          <Link className="nav-link" to="/report-found">Report Found</Link>
          <Link className="nav-link" to="/listings">Lost Items</Link>
          <Link className="nav-link" to="/admin">Admin</Link>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Mode">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="pill">{user ? user.username : 'Guest'}</span>
          {user ? (
            <button className="login-btn" onClick={() => setUser(null)}>Logout</button>
          ) : (
            <Link to="/login"><button className="login-btn">Login</button></Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
