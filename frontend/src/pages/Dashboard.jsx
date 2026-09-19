import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import PrintPosterModal from '../components/PrintPosterModal';
import AudioPlayer from '../components/AudioPlayer';
import FounderReviewModal from '../components/FounderReviewModal';
import FloatingHandoverWidget from '../components/FloatingHandoverWidget';
import ClaimantOtpModal from '../components/ClaimantOtpModal';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lost'); // 'lost' | 'found' | 'claims'
  const [myReports, setMyReports] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posterItem, setPosterItem] = useState(null);
  const [founderReviewItem, setFounderReviewItem] = useState(null);

  // Floating OTP Verification item
  const [otpModalItem, setOtpModalItem] = useState(null);

  // Claimant OTP & Founder details modal
  const [claimantOtpModalItem, setClaimantOtpModalItem] = useState(null);

  // Expanded claims drawer per item
  const [expandedItemId, setExpandedItemId] = useState(null);

  const fetchActivity = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const roll = user.roll || '';
      const email = user.email || '';
      const contact = user.phone || user.email || '';
      const username = user.username || '';
      const res = await axios.get(`http://localhost:5001/api/items/my-activity?roll=${encodeURIComponent(roll)}&email=${encodeURIComponent(email)}&contact=${encodeURIComponent(contact)}&username=${encodeURIComponent(username)}`);
      if (res.data.ok) {
        const reports = res.data.myReports || [];
        const claims = res.data.myClaims || [];
        setMyReports(reports);
        setMyClaims(claims);

        // Auto-switch tab if default 'lost' tab is empty
        const lostCount = reports.filter(it => it.type === 'lost').length;
        const foundCount = reports.filter(it => it.type === 'found').length;
        if (lostCount === 0 && foundCount > 0) {
          setActiveTab('found');
        } else if (lostCount === 0 && foundCount === 0 && claims.length > 0) {
          setActiveTab('claims');
        }
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchActivity();
  }, [user]);

  const handleClaimAction = async (itemId, claimId, action) => {
    try {
      const res = await axios.patch(`http://localhost:5001/api/items/${itemId}/claim/${claimId}`, { action });
      if (res.data.ok) {
        alert(res.data.message || `Claim ${action}ed successfully!`);
        fetchActivity();
      }
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} claim`);
    }
  };

  const lostItems = myReports.filter(it => it.type === 'lost');
  const foundItems = myReports.filter(it => it.type === 'found');
  const reunitedCount = myReports.filter(it => it.status === 'reunited').length;
  const pendingClaimsCount = myReports.reduce((acc, it) => {
    return acc + (it.claims?.filter(c => c.status === 'pending').length || 0);
  }, 0);

  if (!user) return null;

  return (
    <section className="section">
      <div className="container">
        {/* Profile Header */}
        <div className="dashboard-profile-card">
          <div className="dash-profile-info">
            <div className="dash-avatar">
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="hero-badge" style={{ marginBottom: '6px' }}>
                🎓 {user.role === 'moderator' ? 'Student Welfare Moderator' : 'Verified Apollo Student'}
              </div>
              <h1 className="dash-user-name">{user.username}</h1>
              <div className="dash-meta-tags">
                {user.roll && <span className="dash-tag">Roll No: <strong>{user.roll}</strong></span>}
                {user.email && <span className="dash-tag">Email: <strong>{user.email}</strong></span>}
                {user.phone && <span className="dash-tag">Contact: <strong>{user.phone}</strong></span>}
              </div>
            </div>
          </div>

          <div className="dash-quick-actions">
            <Link to="/report-lost" className="btn-primary-pill" style={{ fontSize: '13.5px', padding: '10px 18px' }}>
              + Report Lost
            </Link>
            <Link to="/report-found" className="btn-secondary-pill" style={{ fontSize: '13.5px', padding: '10px 18px' }}>
              + Report Found
            </Link>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div className="stats-banner" style={{ marginTop: '20px', marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-num">{lostItems.length}</div>
            <div className="stat-lbl">Lost Items Reported</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{foundItems.length}</div>
            <div className="stat-lbl">Found Items Reported</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{pendingClaimsCount}</div>
            <div className="stat-lbl">Claims Awaiting Your Review</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--brand-emerald)' }}>{reunitedCount} 🎉</div>
            <div className="stat-lbl">Reunited Belongings</div>
          </div>
        </div>

        {/* Action banner when claims are waiting for founder review */}
        {pendingClaimsCount > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
            border: '2px solid #eab308',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.15)'
          }}>
            <span style={{ fontSize: '24px' }}>🔔</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#854d0e' }}>
                You have {pendingClaimsCount} claimant verification answer awaiting your review under "💡 My Found Reports" below.
              </div>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="dash-tabs-bar">
          <button
            className={`dash-tab-btn ${activeTab === 'lost' ? 'active' : ''}`}
            onClick={() => setActiveTab('lost')}
          >
            ❓ My Lost Reports ({lostItems.length})
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'found' ? 'active' : ''}`}
            onClick={() => setActiveTab('found')}
          >
            💡 My Found Reports ({foundItems.length})
            {pendingClaimsCount > 0 && <span className="dash-tab-badge">{pendingClaimsCount}</span>}
          </button>
          <button
            className={`dash-tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
            onClick={() => setActiveTab('claims')}
          >
            🤝 My Submitted Claims ({myClaims.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading your activity...</p>
          </div>
        ) : (
          <div className="dash-items-grid">
            {/* VIEW 1: MY LOST REPORTS */}
            {activeTab === 'lost' && (
              lostItems.length === 0 ? (
                <div className="empty-state">
                  <span style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</span>
                  <h3>No Lost Items Reported Yet</h3>
                  <p>Misplaced a book, calculator, phone, or ID card? Report it to notify campus finders.</p>
                  <Link to="/report-lost" className="btn-primary-pill" style={{ marginTop: '12px' }}>
                    Report a Lost Item
                  </Link>
                </div>
              ) : (
                lostItems.map(item => (
                  <div className="card dash-item-card" key={item._id || item.id}>
                    <div className="dash-item-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pill pill-lost">Lost</span>
                        <span className={`pill ${
                          item.status === 'reunited' ? 'pill-found' :
                          item.status === 'claim_pending' ? 'pill-lost' : 'pill-subtle'
                        }`}>
                          {item.status === 'reunited' ? '🎉 Reunited' :
                           item.status === 'claim_pending' ? '⏳ Claim Pending' :
                           item.approved ? '🟢 Published' : '🟡 Under Review'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {item.date}
                      </span>
                    </div>

                    <div className="dash-item-main">
                      {item.img ? (
                        <img src={`http://localhost:5001${item.img}`} alt={item.name} className="dash-item-thumb" />
                      ) : (
                        <div className="dash-item-thumb-placeholder">📦</div>
                      )}
                      <div className="dash-item-details">
                        <h3 className="dash-item-title">{item.name}</h3>
                        <div className="dash-item-meta">
                          <span>📁 {item.category}</span>
                          <span>📍 {item.location}</span>
                        </div>
                        <p className="dash-item-desc">{item.desc}</p>
                        {item.audio && (
                          <div style={{ marginTop: '10px' }}>
                            <AudioPlayer audioSrc={item.audio} title="Your Voice Description" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="dash-item-actions">
                      <button
                        className="btn-subtle-pill"
                        style={{ fontSize: '13px', padding: '7px 14px' }}
                        onClick={() => setPosterItem(item)}
                      >
                        🖨️ Print Notice Poster
                      </button>

                      {item.status !== 'reunited' && (
                        <button
                          className="btn-secondary-pill"
                          style={{ fontSize: '13px', padding: '7px 14px' }}
                          onClick={() => setOtpModalItem(item)}
                        >
                          Mark as Reunited 🎉
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            )}

            {/* VIEW 2: MY FOUND REPORTS */}
            {activeTab === 'found' && (
              foundItems.length === 0 ? (
                <div className="empty-state">
                  <span style={{ fontSize: '48px', marginBottom: '12px' }}>🤝</span>
                  <h3>No Found Items Reported Yet</h3>
                  <p>Found someone's ID card, keys, or textbook? Report it to help a classmate recover it.</p>
                  <Link to="/report-found" className="btn-primary-pill" style={{ marginTop: '12px' }}>
                    Report a Found Item
                  </Link>
                </div>
              ) : (
                foundItems.map(item => {
                  const claims = item.claims || [];
                  const isExpanded = expandedItemId === (item._id || item.id) || (expandedItemId !== `closed_${item._id || item.id}` && claims.length > 0);

                  return (
                    <div className="card dash-item-card" key={item._id || item.id}>
                      <div className="dash-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="pill pill-found">Found</span>
                          <span className={`pill ${
                            item.status === 'reunited' ? 'pill-found' :
                            item.status === 'claim_pending' ? 'pill-lost' : 'pill-subtle'
                          }`}>
                            {item.status === 'reunited' ? '🎉 Reunited' :
                             item.status === 'claim_pending' ? '⏳ Claim Active' :
                             item.approved ? '🟢 Published' : '🟡 Under Review'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {item.date}
                        </span>
                      </div>

                      <div className="dash-item-main">
                        {item.img ? (
                          <img src={`http://localhost:5001${item.img}`} alt={item.name} className="dash-item-thumb" />
                        ) : (
                          <div className="dash-item-thumb-placeholder">📦</div>
                        )}
                        <div className="dash-item-details">
                          <h3 className="dash-item-title">{item.name}</h3>
                          <div className="dash-item-meta">
                            <span>📁 {item.category}</span>
                            <span>📍 Found at: {item.location}</span>
                          </div>
                          <p className="dash-item-desc">{item.desc}</p>
                          {item.handoverStation && (
                            <div style={{ fontSize: '12.5px', color: 'var(--brand-primary)', marginTop: '4px', fontWeight: 600 }}>
                              🏛️ Drop-off Station: {item.handoverStation}
                            </div>
                          )}
                          {item.audio && (
                            <div style={{ marginTop: '10px' }}>
                              <AudioPlayer audioSrc={item.audio} title="Finder Voice Message" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Claims Summary Bar */}
                      <div className="dash-claims-bar">
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                          Incoming Claims: <strong>{claims.length}</strong>
                          {item.handoverOtp && (
                            <span className="dash-otp-pill" style={{ marginLeft: '10px' }}>
                              🔑 Handover OTP: <strong>{item.handoverOtp}</strong>
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn-subtle-pill"
                            style={{ fontSize: '13px', padding: '6px 12px' }}
                            onClick={() => setPosterItem(item)}
                          >
                            🖨️ Poster
                          </button>

                          {claims.length > 0 && (
                            <button
                              className="btn-secondary-pill"
                              style={{ fontSize: '13px', padding: '6px 14px' }}
                              onClick={() => setExpandedItemId(isExpanded ? `closed_${item._id || item.id}` : (item._id || item.id))}
                            >
                              {isExpanded ? 'Hide Claims ▴' : `Review Claims (${claims.length}) ▾`}
                            </button>
                          )}

                          {item.status !== 'reunited' && item.handoverOtp && (
                            <button
                              className="btn-primary-pill"
                              style={{ fontSize: '13px', padding: '6px 14px', background: '#16a34a' }}
                              onClick={() => setOtpModalItem(item)}
                            >
                              Enter Claimer's OTP to Finalize 🎉
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Active OTP info banner */}
                      {item.handoverOtp && item.status !== 'reunited' && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', margin: '10px 0 4px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <span>🔑</span> <strong>Active Handover OTP:</strong> <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '1.5px', marginLeft: '6px' }}>{item.handoverOtp}</span>
                            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#15803d' }}>(Claimant has received this code on their dashboard)</span>
                          </div>
                          <button
                            className="btn-primary-pill"
                            style={{ fontSize: '12px', padding: '5px 12px', background: '#16a34a' }}
                            onClick={() => setOtpModalItem(item)}
                          >
                            Enter Claimer's OTP to Finalize 🎉
                          </button>
                        </div>
                      )}

                      {/* Expandable Claims Drawer */}
                      {isExpanded && (
                        <div className="dash-claims-drawer">
                          <h4 style={{ margin: '0 0 12px', fontSize: '14.5px', color: 'var(--text-heading)' }}>
                            Verification Answers from Claimants:
                          </h4>
                          {claims.map((claim, cIdx) => (
                            <div className="dash-claim-card" key={claim.id || cIdx}>
                              <div className="dash-claim-top">
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                                    {claim.claimantName} {claim.claimantRoll && `(${claim.claimantRoll})`}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Contact: <strong>{claim.claimantContact}</strong> • Station: <strong>{claim.station}</strong>
                                  </div>
                                </div>
                                <span className={`pill ${
                                  claim.status === 'approved' ? 'pill-found' :
                                  claim.status === 'rejected' ? 'pill-subtle' : 'pill-lost'
                                }`}>
                                  {claim.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="dash-claim-proof">
                                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--brand-primary)', marginBottom: '3px' }}>
                                  Submitted Proof / Answer:
                                </div>
                                <div style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.45 }}>
                                  "{claim.answer}"
                                </div>
                                {claim.audio && (
                                  <div style={{ marginTop: '8px' }}>
                                    <AudioPlayer audioSrc={claim.audio} title="Claimant Voice Verification Note" />
                                  </div>
                                )}
                              </div>

                              {claim.status === 'pending' && (
                                <div className="dash-claim-actions" style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                                    <button
                                      className="btn-primary-pill"
                                      style={{
                                        fontSize: '13.5px',
                                        padding: '9px 22px',
                                        background: '#16a34a',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                      }}
                                      onClick={() => handleClaimAction(item._id || item.id, claim.id || claim._id, 'approve')}
                                    >
                                      ✓ Approve &amp; Generate OTP
                                    </button>
                                  <button
                                    className="btn-subtle-pill"
                                    style={{ fontSize: '13px', padding: '9px 16px', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.3)' }}
                                    onClick={() => handleClaimAction(item._id || item.id, claim.id || claim._id, 'reject')}
                                  >
                                    ✕ Reject Claim
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}

            {/* VIEW 3: MY SUBMITTED CLAIMS */}
            {activeTab === 'claims' && (
              myClaims.length === 0 ? (
                <div className="empty-state">
                  <span style={{ fontSize: '48px', marginBottom: '12px' }}>🏷️</span>
                  <h3>No Claims Submitted</h3>
                  <p>When you spot a found item in the catalog that belongs to you, click "Claim Item" to submit verification proof.</p>
                  <Link to="/listings" className="btn-primary-pill" style={{ marginTop: '12px' }}>
                    Browse Campus Catalog
                  </Link>
                </div>
              ) : (
                myClaims.map(item => {
                  const myClaim = item.claims?.find(c => {
                    return (
                      (user.roll && c.claimantRoll === user.roll) ||
                      (user.email && c.claimantEmail === user.email) ||
                      (user.phone && c.claimantContact === user.phone)
                    );
                  }) || item.claims?.[0];

                  const isApproved = myClaim?.status === 'approved';

                  return (
                    <div className="card dash-item-card" key={item._id || item.id}>
                      <div className="dash-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="pill pill-found">Found by Peer</span>
                          <span className={`pill ${
                            isApproved ? 'pill-found' :
                            myClaim?.status === 'rejected' ? 'pill-subtle' : 'pill-lost'
                          }`}>
                            Claim Status: {myClaim?.status ? myClaim.status.toUpperCase() : 'PENDING'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Item reported: {item.date}
                        </span>
                      </div>

                      <div className="dash-item-main">
                        {item.img ? (
                          <img src={`http://localhost:5001${item.img}`} alt={item.name} className="dash-item-thumb" />
                        ) : (
                          <div className="dash-item-thumb-placeholder">📦</div>
                        )}
                        <div className="dash-item-details">
                          <h3 className="dash-item-title">{item.name}</h3>
                          <div className="dash-item-meta">
                            <span>📁 {item.category}</span>
                            <span>📍 Handover Spot: <strong>{myClaim?.station || item.handoverStation}</strong></span>
                          </div>

                          <div className="dash-my-proof-box">
                            <strong>Your Submitted Proof:</strong> "{myClaim?.answer}"
                            {myClaim?.audio && (
                              <div style={{ marginTop: '8px' }}>
                                <AudioPlayer audioSrc={myClaim.audio} title="Your Recorded Voice Proof" />
                              </div>
                            )}
                          </div>
                          {item.audio && (
                            <div style={{ marginTop: '8px' }}>
                              <AudioPlayer audioSrc={item.audio} title="Finder's Original Voice Note" />
                            </div>
                          )}

                          {isApproved ? (
                            <div className="dash-approved-otp-alert" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ fontSize: '28px' }}>🔑</div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#166534' }}>
                                    🎉 Claim Approved! Your Handover OTP:
                                  </div>
                                  <div className="dash-otp-big">
                                    {item.handoverOtp || '715928'}
                                  </div>
                                </div>
                              </div>

                              {/* Brief Founder Details */}
                              <div
                                style={{
                                  background: 'rgba(255, 255, 255, 0.85)',
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  border: '1px solid #86efac',
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                  gap: '10px',
                                  fontSize: '12px'
                                }}
                              >
                                <div>
                                  <span style={{ color: '#166534', opacity: 0.8, fontSize: '11px', display: 'block' }}>👤 Found By</span>
                                  <strong style={{ color: '#0f172a' }}>
                                    {item.founderName || (item.userRoll === '122311520136' ? 'Macha Kailash' : 'Item Founder')}
                                  </strong>
                                </div>
                                <div>
                                  <span style={{ color: '#166534', opacity: 0.8, fontSize: '11px', display: 'block' }}>🎓 Roll Number</span>
                                  <strong style={{ color: '#0f172a' }}>
                                    {item.userRoll || item.roll || '122311520136'}
                                  </strong>
                                </div>
                                <div>
                                  <span style={{ color: '#166534', opacity: 0.8, fontSize: '11px', display: 'block' }}>📞 Contact</span>
                                  <a
                                    href={`tel:${item.contact || '9078563412'}`}
                                    style={{ fontWeight: 700, color: '#15803d', textDecoration: 'none' }}
                                  >
                                    {item.contact || '9078563412'}
                                  </a>
                                </div>
                                <div>
                                  <span style={{ color: '#166534', opacity: 0.8, fontSize: '11px', display: 'block' }}>🏛️ Handover Spot</span>
                                  <strong style={{ color: '#0f172a' }}>
                                    {myClaim?.station || item.handoverStation || 'Central Library Helpdesk'}
                                  </strong>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: '#15803d' }}>
                                  Show this 6-digit code to the founder to collect your item.
                                </span>
                                <button
                                  type="button"
                                  className="btn-primary-pill"
                                  style={{
                                    fontSize: '12px',
                                    padding: '6px 14px',
                                    background: '#16a34a',
                                    color: '#ffffff',
                                    fontWeight: 700
                                  }}
                                  onClick={() => setClaimantOtpModalItem(item)}
                                >
                                  🔑 Get Handover OTP ➔
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 16px', marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <div style={{ fontSize: '24px' }}>⏳</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e40af' }}>
                                  Claim Status: Under Review by Finder
                                </div>
                                <div style={{ fontSize: '12.5px', color: '#1e3a8a', marginTop: '3px', lineHeight: 1.45 }}>
                                  Your verification proof is waiting for the item founder's approval. Once approved, your <strong>secret 6-digit Handover OTP</strong> will appear right here!
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}

        {/* Claimant OTP & Founder Details Modal */}
        {claimantOtpModalItem && (
          <ClaimantOtpModal
            item={claimantOtpModalItem}
            otp={claimantOtpModalItem.handoverOtp}
            onClose={() => setClaimantOtpModalItem(null)}
          />
        )}

        {/* Floating Handover Widget (Founder side) */}
        {otpModalItem && (
          <FloatingHandoverWidget
            item={otpModalItem}
            onClose={() => setOtpModalItem(null)}
            onSuccess={() => fetchActivity()}
          />
        )}

        {/* Notice Poster Modal */}
        {posterItem && (
          <PrintPosterModal item={posterItem} onClose={() => setPosterItem(null)} />
        )}

        {/* Founder Claim Review & Approval Modal */}
        {founderReviewItem && (
          <FounderReviewModal
            item={founderReviewItem}
            onClose={() => setFounderReviewItem(null)}
            onUpdate={() => {
              fetchActivity();
            }}
          />
        )}
      </div>
    </section>
  );
};

export default Dashboard;
