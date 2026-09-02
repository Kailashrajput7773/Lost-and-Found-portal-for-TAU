import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [stats, setStats] = useState({ total: '--', reunited: '98%' });

  useEffect(() => {
    // Fetch stats logic could go here
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-card">
            <div>
              <div className="hero-title">Lost Something? Let <span className="hero-title-highlight">The Apollo Community</span> Help You Find It</div>
              <p className="hero-desc">Report lost or found items and connect with students to return belongings safely. Simple, fast, and campus-friendly.</p>
              <div className="hero-actions">
                <Link className="btn" to="/report-lost">Report Lost Item</Link>
                <Link className="btn secondary" to="/report-found">Found an Item? Report Here</Link>
                <Link className="btn light" to="/listings">Browse Lost Items</Link>
              </div>
            </div>
            <div>
              <div className="cards">
                <div className="card">
                  <div className="card-img">📚</div>
                  <div className="card-body">
                    <div className="card-title">Books</div>
                    <div className="card-meta"><div>Library</div><div>Academics</div></div>
                    <div className="pill">Textbooks, notes, journals</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-img">💳</div>
                  <div className="card-body">
                    <div className="card-title">Wallet</div>
                    <div className="card-meta"><div>Cafeteria</div><div>Hostel</div></div>
                    <div className="pill">Cards, cash, IDs</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-img">📱</div>
                  <div className="card-body">
                    <div className="card-title">Phone</div>
                    <div className="card-meta"><div>Classroom</div><div>Ground</div></div>
                    <div className="pill">Mobile devices</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="stats-banner">
            <div className="stat-card">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-lbl">Items Reported</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{stats.reunited}</div>
              <div className="stat-lbl">Return Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">6</div>
              <div className="stat-lbl">Categories</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">7</div>
              <div className="stat-lbl">Campus Zones</div>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container grid-2">
          <div className="form">
            <div className="form-title">How it works</div>
            <div className="field">
              <div className="pill">Submit a lost or found item</div>
            </div>
            <div className="field">
              <div className="pill">Items appear after admin moderation</div>
            </div>
            <div className="field">
              <div className="pill">Use contact to arrange a safe return</div>
            </div>
          </div>
          <div className="guidelines">
            <div>Do not share sensitive details publicly</div>
            <div>Meet in safe campus locations</div>
            <div>Verify item ownership before returning</div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
