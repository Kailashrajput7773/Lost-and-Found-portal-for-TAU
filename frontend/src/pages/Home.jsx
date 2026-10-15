import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const SLIDES = [
  {
    badge: '🌿 Campus Safe Return Network',
    hasPulse: true,
    title: 'Lost Something? Let Apollo Community Help You Find It',
    desc: 'Report lost belongings, browse found items, and safely reconnect with fellow students. Quick, verified, and campus-friendly.',
    actions: (
      <>
        <Link to="/report-lost" className="btn-primary-pill">
          Report Lost Item
        </Link>
        <Link to="/report-found" className="btn-secondary-pill">
          Found an Item?
        </Link>
        <Link to="/listings" className="btn-subtle-pill">
          Browse All Items 🔍
        </Link>
      </>
    ),
    cards: [
      { icon: '📱', title: 'Electronics', subtitle: 'Phones, Laptops, Earbuds' },
      { icon: '💳', title: 'IDs & Wallets', subtitle: 'Campus IDs, Cards, Cash' },
      { icon: '📚', title: 'Books & Notes', subtitle: 'Textbooks, Notebooks' },
      { icon: '🔑', title: 'Keys & Badges', subtitle: 'Hostel keys, Lockers' },
    ],
  },
  {
    badge: '🤝 Safe & Honest Handover',
    hasPulse: true,
    title: 'Found an Item on Campus? Help Reconnect It Safely',
    desc: 'Turn in found student IDs, keys, electronics, or notebooks. Safe, verified return coordinated at the TAU Library Desk.',
    actions: (
      <>
        <Link to="/report-found" className="btn-primary-pill">
          Found an Item?
        </Link>
        <Link to="/report-lost" className="btn-secondary-pill">
          Report Lost Item
        </Link>
        <Link to="/listings" className="btn-subtle-pill">
          Browse All Items 🔍
        </Link>
      </>
    ),
    cards: [
      { icon: '🪪', title: 'Student IDs', subtitle: 'TAU IDs, RFID, Badges' },
      { icon: '💻', title: 'Laptops & Tech', subtitle: 'MacBooks, Chargers, iPads' },
      { icon: '🎒', title: 'Bags & Folders', subtitle: 'Backpacks, Lab Coats, Files' },
      { icon: '🎧', title: 'Audio & Gadgets', subtitle: 'AirPods, Smartwatches, Tags' },
    ],
  },
  {
    badge: '🔴 Live Campus Recovery Feed',
    hasPulse: true,
    title: 'Real-Time Item Tracking Across All Apollo Zones',
    desc: 'Instant updates and campus moderation across Library, Cafeteria, Sports Complex, and Academic Blocks. Over 98% reunited!',
    actions: (
      <>
        <Link to="/listings" className="btn-primary-pill">
          Browse All Items 🔍
        </Link>
        <Link to="/report-lost" className="btn-secondary-pill">
          Report Lost Item
        </Link>
        <Link to="/report-found" className="btn-subtle-pill">
          Found an Item?
        </Link>
      </>
    ),
    cards: [
      { icon: '🏛️', title: 'Central Library', subtitle: 'Primary recovery desk' },
      { icon: '🏫', title: 'Academic Blocks', subtitle: 'Lecture halls & labs' },
      { icon: '☕', title: 'Campus Cafeteria', subtitle: 'Dining halls & food court' },
      { icon: '⚽', title: 'Sports Complex', subtitle: 'Ground & athletic arena' },
    ],
  },
  {
    badge: '🛡️ Verified TAU Student Moderation',
    hasPulse: true,
    title: 'Confidential Handover & Safe Campus Return',
    desc: 'Student contact information remains shielded until claims are verified by campus administrators. 100% spam-free and secure.',
    actions: (
      <>
        <Link to="/report-lost" className="btn-primary-pill">
          Report Lost Item
        </Link>
        <Link to="/report-found" className="btn-secondary-pill">
          Found an Item?
        </Link>
        <Link to="/listings" className="btn-subtle-pill">
          Browse All Items 🔍
        </Link>
      </>
    ),
    cards: [
      { icon: '🔒', title: 'Privacy Shield', subtitle: 'Contact masked safely' },
      { icon: '⏱️', title: '24h Recovery', subtitle: 'Fast student turnaround' },
      { icon: '📋', title: 'Verified Posts', subtitle: 'Admin vetted items only' },
      { icon: '🤝', title: 'Designated Spots', subtitle: 'Central desk handovers' },
    ],
  },
];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Live slide show automatically transitions every 3 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
  };

  return (
    <>
      {/* Hero Section with 3-second Auto-Sliding Live Show */}
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
                <Link to="/safetag" className="btn-secondary-pill" style={{ background: 'rgba(13, 148, 136, 0.15)', color: 'var(--primary)', border: '1px solid var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>🛡️</span> SafeTag™ QR Sticker
                </Link>
                <Link to="/listings" className="btn-subtle-pill">
                  Browse All Items 🔍
                </Link>
              </div>
            </div>

            {/* Slider Navigation Arrows */}
            <button
              className="hero-slider-arrow hero-slider-prev"
              onClick={prevSlide}
              aria-label="Previous Slide"
            >
              ‹
            </button>
            <button
              className="hero-slider-arrow hero-slider-next"
              onClick={nextSlide}
              aria-label="Next Slide"
            >
              ›
            </button>

            {/* Slider Dots */}
            <div className="hero-slider-dots">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero-slider-dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
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

      {/* SafeTag Feature Showcase Section */}
      <section className="section" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '16px', background: 'rgba(13, 148, 136, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
                🛡️ Preventative Campus Safety
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-main)' }}>
                Protect Your Belongings Before They Get Lost
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 20px' }}>
                Don't wait for your laptop, wallet, or earbuds case to disappear. Generate an official <strong>The Apollo University SafeTag™ QR Sticker</strong> in 30 seconds. Anyone who scans it can return it directly to you or the campus desk!
              </p>
              <Link to="/safetag" className="btn-primary-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>🏷️</span> Generate My Free SafeTag™
              </Link>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(16, 185, 129, 0.05))', borderRadius: '16px', padding: '28px', border: '1px solid rgba(13, 148, 136, 0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>📲</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-main)' }}>
                Instant Smart Matching & Verification
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Our intelligent algorithm scans descriptions and campus locations in real time to match lost items with found belongings.
              </p>
              <Link to="/listings" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>
                Explore Active Listings & Matches →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
