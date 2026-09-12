import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import PrintPosterModal from '../components/PrintPosterModal';
import AudioPlayer from '../components/AudioPlayer';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lost'); // 'lost' | 'found' | 'claims'
  const [myReports, setMyReports] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posterItem, setPosterItem] = useState(null);

  // OTP Verification Modal state
  const [otpModalItem, setOtpModalItem] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Expanded claims drawer per item
  const [expandedItemId, setExpandedItemId] = useState(null);

  const fetchActivity = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const roll = user.roll || '';
      const email = user.email || '';
      const contact = user.phone || user.email || '';
      const res = await axios.get(`http://localhost:5000/api/items/my-activity?roll=${encodeURIComponent(roll)}&email=${encodeURIComponent(email)}&contact=${encodeURIComponent(contact)}`);
      if (res.data.ok) {
        setMyReports(res.data.myReports || []);
        setMyClaims(res.data.myClaims || []);
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
      const res = await axios.patch(`http://localhost:5000/api/items/${itemId}/claim/${claimId}`, { action });
      if (res.data.ok) {
        alert(res.data.message || `Claim ${action}ed successfully!`);
        fetchActivity();
      }
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} claim`);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpModalItem || !otpInput.trim()) return;
    setOtpError('');
    setOtpSuccess('');

    try {
      const res = await axios.post(`http://localhost:5000/api/items/${otpModalItem._id || otpModalItem.id}/verify-handover`, {
        otp: otpInput.trim()
      });
      if (res.data.ok) {
        setOtpSuccess('🎉 Handover confirmed! Item marked as Reunited.');
        setTimeout(() => {
          setOtpModalItem(null);
          setOtpInput('');
          setOtpSuccess('');
          fetchActivity();
        }, 1500);
      }
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid OTP code. Please try again.');
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
                        <img src={`http://localhost:5000${item.img}`} alt={item.name} className="dash-item-thumb" />
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
                  const isExpanded = expandedItemId === (item._id || item.id);

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
                          <img src={`http://localhost:5000${item.img}`} alt={item.name} className="dash-item-thumb" />
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
                            <span className="dash-otp-pill">
                              🔑 Active Handover OTP: <strong>{item.handoverOtp}</strong>
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
                              onClick={() => setExpandedItemId(isExpanded ? null : (item._id || item.id))}
                            >
                              {isExpanded ? 'Hide Claims ▴' : `Review Claims (${claims.length}) ▾`}
                            </button>
                          )}

                          {item.status !== 'reunited' && (
                            <button
                              className="btn-primary-pill"
                              style={{ fontSize: '13px', padding: '6px 14px' }}
                              onClick={() => setOtpModalItem(item)}
                            >
                              Verify OTP / Reunited 🎉
                            </button>
                          )}
                        </div>
                      </div>

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
                                <div className="dash-claim-actions">
                                  <button
                                    className="btn-primary-pill"
                                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
                                    onClick={() => handleClaimAction(item._id || item.id, claim.id || claim._id, 'approve')}
                                  >
                                    ✓ Approve & Generate Handover OTP
                                  </button>
                                  <button
                                    className="btn-subtle-pill"
                                    style={{ fontSize: '12.5px', padding: '6px 14px' }}
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
                          <img src={`http://localhost:5000${item.img}`} alt={item.name} className="dash-item-thumb" />
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

                          {isApproved && (
                            <div className="dash-approved-otp-alert">
                              <div style={{ fontSize: '18px' }}>🔑</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#166534' }}>
                                  Claim Approved! Your Handover OTP:
                                </div>
                                <div className="dash-otp-big">
                                  {item.handoverOtp || 'Verified'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                                  Meet at <strong>{myClaim?.station || item.handoverStation}</strong> and provide this code to finalize return.
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

        {/* Handover OTP Verification Modal */}
        {otpModalItem && (
          <div className="modal-overlay" onClick={() => setOtpModalItem(null)}>
            <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setOtpModalItem(null)}>✕</button>
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <span style={{ fontSize: '40px' }}>🤝</span>
                <h3 style={{ margin: '8px 0 4px', fontSize: '20px', color: 'var(--text-heading)' }}>
                  Confirm Handover Completion
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Enter the 6-digit OTP provided by the claimant to verify the exchange.
                </p>
              </div>

              {otpError && (
                <div className="auth-alert-error" style={{ marginBottom: '14px' }}>
                  <span>⚠️</span>
                  <span>{otpError}</span>
                </div>
              )}

              {otpSuccess && (
                <div className="auth-alert-success" style={{ marginBottom: '14px' }}>
                  <span>✅</span>
                  <span>{otpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="form-grid">
                <div className="field">
                  <label>6-Digit Handover OTP *</label>
                  <input
                    type="text"
                    className="input"
                    maxLength="6"
                    placeholder="e.g. 748291"
                    style={{ fontSize: '22px', textAlign: 'center', letterSpacing: '4px', fontWeight: 700 }}
                    required
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary-pill"
                    onClick={() => setOtpModalItem(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-pill">
                    Verify & Mark Reunited 🎉
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notice Poster Modal */}
        {posterItem && (
          <PrintPosterModal item={posterItem} onClose={() => setPosterItem(null)} />
        )}
      </div>
    </section>
  );
};

export default Dashboard;
