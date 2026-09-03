import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      {/* Hero Section matching the Shopcart apricot & forest green aesthetic */}
      <section className="hero">
        <div className="container">
          <div className="hero-banner">
            <div>
              <div className="hero-badge">
                🌿 Campus Safe Return Network
              </div>
              <h1 className="hero-title">
                Lost Something? Let Apollo Community Help You Find It
              </h1>
              <p className="hero-desc">
                Report lost belongings, browse found items, and safely reconnect with fellow students. Quick, verified, and campus-friendly.
              </p>
              <div className="hero-actions">
                <Link to="/report-lost" className="btn-primary-pill">
                  Report Lost Item
                </Link>
                <Link to="/report-found" className="btn-secondary-pill">
                  Found an Item?
                </Link>
                <Link to="/listings" className="btn-subtle-pill">
                  Browse All Items 🔍
                </Link>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-mini-cards">
                <div className="hero-mini-card">
                  <div className="hero-mini-icon">📱</div>
                  <div>
                    <div className="hero-mini-title">Electronics</div>
                    <div className="hero-mini-subtitle">Phones, Laptops, Earbuds</div>
                  </div>
                </div>
                <div className="hero-mini-card">
                  <div className="hero-mini-icon">💳</div>
                  <div>
                    <div className="hero-mini-title">IDs & Wallets</div>
                    <div className="hero-mini-subtitle">Campus IDs, Cards, Cash</div>
                  </div>
                </div>
                <div className="hero-mini-card">
                  <div className="hero-mini-icon">📚</div>
                  <div>
                    <div className="hero-mini-title">Books & Notes</div>
                    <div className="hero-mini-subtitle">Textbooks, Notebooks</div>
                  </div>
                </div>
                <div className="hero-mini-card">
                  <div className="hero-mini-icon">🔑</div>
                  <div>
                    <div className="hero-mini-title">Keys & Badges</div>
                    <div className="hero-mini-subtitle">Hostel keys, Lockers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Banner */}
          <div className="stats-banner">
            <div className="stat-card">
              <div className="stat-num">98%</div>
              <div className="stat-lbl">Return Success Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">24h</div>
              <div className="stat-lbl">Average Recovery Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">6+</div>
              <div className="stat-lbl">Item Categories</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">7</div>
              <div className="stat-lbl">Campus Zones Monitored</div>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines & Workflow Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-desc">Follow 3 simple steps to recover or return campus belongings</p>
          </div>

          <div className="cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--text-main)' }}>1. Submit a Report</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Provide accurate details, location, date, and optional photos of the item lost or found.
              </p>
            </div>
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🛡️</div>
              <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--text-main)' }}>2. Admin Moderation</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Our student welfare moderators review reports to maintain safety and privacy before publishing.
              </p>
            </div>
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🤝</div>
              <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: 'var(--text-main)' }}>3. Safe Campus Return</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Coordinate a handover at safe designated spots like the University Library or Student Desk.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
