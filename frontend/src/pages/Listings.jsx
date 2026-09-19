import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CampusMap from '../components/CampusMap';
import ClaimModal from '../components/ClaimModal';
import PrintPosterModal from '../components/PrintPosterModal';
import AudioPlayer from '../components/AudioPlayer';
import FounderReviewModal from '../components/FounderReviewModal';
import FloatingHandoverWidget from '../components/FloatingHandoverWidget';
import ClaimantOtpModal from '../components/ClaimantOtpModal';

const Listings = ({ user }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', location: '', date: '' });
  const [revealedContactId, setRevealedContactId] = useState(null);

  // New features state
  const [showMap, setShowMap] = useState(false);
  const [claimModalItem, setClaimModalItem] = useState(null);
  const [posterModalItem, setPosterModalItem] = useState(null);
  const [founderReviewItem, setFounderReviewItem] = useState(null);

  // Floating OTP widget item for approved claims (founder side)
  const [otpModalItem, setOtpModalItem] = useState(null);

  // Claimant OTP & Founder details popup (claimant side)
  const [claimantOtpModalItem, setClaimantOtpModalItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (activeType) params.type = activeType;
      if (user?.roll) params.userRoll = user.roll;
      if (user?.email) params.userEmail = user.email;
      if (user?.username) params.username = user.username;
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`http://localhost:5001/api/items?${query}`);
      if (res.data.ok) setItems(res.data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters, activeType, user]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleSave = (id) => {
    setSavedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="section-title">Campus Items Catalog</h1>
            <p className="section-desc">Browse reported lost and found belongings across Apollo University</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/report-found"
              className="btn-primary-pill"
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                padding: '9px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              ➕ Report Found Item
            </Link>

            <Link
              to="/report-lost"
              className="btn-secondary-pill"
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                padding: '9px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              ❓ Report Lost Item
            </Link>

            <button
              className={`btn-subtle-pill ${showMap ? 'active-map-toggle' : ''}`}
              onClick={() => setShowMap(!showMap)}
              style={{ fontWeight: 700 }}
            >
              {showMap ? '✕ Hide Map' : '🗺️ Interactive Map'}
            </button>
          </div>
        </div>

        {/* Interactive Campus Zone Heatmap */}
        {showMap && (
          <div style={{ marginBottom: '24px' }}>
            <CampusMap
              items={items}
              selectedLocation={filters.location}
              onSelectLocation={(loc) => setFilters(prev => ({ ...prev, location: loc }))}
            />
          </div>
        )}

        {/* Filter Pills Bar */}
        <div className="filters-bar">
          <div className="filter-search-wrap">
            <span className="filter-search-icon">🔍</span>
            <input
              type="text"
              name="q"
              placeholder="Search items, keywords, descriptions..."
              className="filter-search-input"
              value={filters.q}
              onChange={handleFilterChange}
            />
          </div>

          <button
            className={`filter-chip ${activeType === '' ? 'active' : ''}`}
            onClick={() => setActiveType('')}
          >
            All Items
          </button>
          <button
            className={`filter-chip ${activeType === 'lost' ? 'active' : ''}`}
            onClick={() => setActiveType('lost')}
          >
            Lost ❓
          </button>
          <button
            className={`filter-chip ${activeType === 'found' ? 'active' : ''}`}
            onClick={() => setActiveType('found')}
          >
            Found 💡
          </button>

          <select
            name="category"
            className="filter-chip filter-select"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">Category: All</option>
            <option value="Electronics">Electronics</option>
            <option value="ID/Wallet">ID / Wallet</option>
            <option value="Books/Stationery">Books & Stationery</option>
            <option value="Keys">Keys</option>
            <option value="Accessories">Accessories</option>
            <option value="Other">Other</option>
          </select>

          <select
            name="location"
            className="filter-chip filter-select"
            value={filters.location}
            onChange={handleFilterChange}
          >
            <option value="">Zone: All Locations</option>
            <option value="Library">Central Library</option>
            <option value="Academic Block">Academic Block</option>
            <option value="Cafeteria">Cafeteria</option>
            <option value="Hostel">Hostel</option>
            <option value="Ground">Sports Ground</option>
            <option value="Main Gate">Security Gate 1</option>
            <option value="Other">Other Zone</option>
          </select>

          <input
            type="date"
            name="date"
            className="filter-chip"
            style={{ minWidth: '140px' }}
            value={filters.date}
            onChange={handleFilterChange}
            title="Filter by date"
          />
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
            <div style={{ fontWeight: 600 }}>Loading campus items...</div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-main)', marginBottom: '6px' }}>No items match your filters</div>
            <p style={{ margin: 0, fontSize: '14px' }}>Try clearing filters or search with a different keyword.</p>
          </div>
        ) : (
          <div className="cards">
            {items.map(item => {
              const itemId = item._id || item.id;
              const isSaved = savedIds.includes(itemId);
              const isContactRevealed = revealedContactId === itemId;
              const isReunited = item.status === 'reunited';
              const isClaimPending = item.status === 'claim_pending';
              const isOwner = Boolean(
                user && (
                  (user.roll && (item.userRoll === user.roll || item.roll === user.roll)) ||
                  (user.email && item.userEmail === user.email) ||
                  (user.phone && item.contact === user.phone) ||
                  (user.username && (item.userRoll === user.username || item.name === user.username)) ||
                  (user.username && (user.username.toLowerCase() === 'founder' || user.username.toLowerCase() === 'item founder') && (item.userRoll === '122311520136' || item.userEmail === 'founder@apollo.edu.in'))
                )
              );
              const myClaim = item.claimants?.find(c => {
                if (!user) return false;
                const uRoll = (user.roll || '').toLowerCase();
                const uEmail = (user.email || '').toLowerCase();
                const uContact = (user.phone || '').replace(/\D/g, '');
                const uName = (user.username || '').toLowerCase();
                const isClaimerDemo = uName === 'claimer' || uName === 'item claimer';

                return (
                  (uRoll && c.roll === uRoll) ||
                  (uEmail && c.email === uEmail) ||
                  (uContact && c.contact === uContact) ||
                  (uName && c.name === uName) ||
                  (isClaimerDemo && (c.roll === '12223222123' || c.email === 'claimer@apollo.edu.in'))
                );
              });

              return (
                <div className="card" key={itemId}>
                  {/* Floating Bookmark Button */}
                  <button
                    className="card-fav-btn"
                    onClick={() => toggleSave(itemId)}
                    title={isSaved ? "Saved" : "Save item"}
                    style={{ color: isSaved ? '#ef4444' : 'var(--text-muted)' }}
                  >
                    {isSaved ? '❤️' : '🤍'}
                  </button>

                  {/* Card Image Area */}
                  <div
                    className="card-img"
                    style={{
                      backgroundImage: item.img ? `url(http://localhost:5001${item.img})` : 'none',
                    }}
                  >
                    {!item.img && (
                      <span style={{ fontSize: '3.5rem', opacity: 0.85 }}>
                        {item.category === 'Electronics' ? '📱' :
                         item.category === 'ID/Wallet' ? '💳' :
                         item.category === 'Books/Stationery' ? '📚' :
                         item.category === 'Keys' ? '🔑' :
                         item.type === 'lost' ? '❓' : '💡'}
                      </span>
                    )}

                    {/* Status Badge overlay */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                      <span className={`pill ${item.type === 'found' ? 'pill-found' : 'pill-lost'}`}>
                        {item.type === 'found' ? 'Found' : 'Lost'}
                      </span>
                      {isReunited && (
                        <span className="pill pill-found" style={{ background: '#dcfce7', color: '#15803d' }}>
                          🎉 Reunited
                        </span>
                      )}
                      {myClaim && (
                        <span
                          className="pill"
                          style={{
                            background: myClaim.status === 'approved' ? '#dcfce7' : '#fef3c7',
                            color: myClaim.status === 'approved' ? '#15803d' : '#b45309',
                            fontWeight: 700
                          }}
                        >
                          {myClaim.status === 'approved' ? '✓ Claim Approved' : '⏳ Claim Pending'}
                        </span>
                      )}
                      {!myClaim && !isReunited && item.hasApprovedClaim && (
                        <span className="pill pill-subtle" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                          Handover In Progress
                        </span>
                      )}
                      {!myClaim && !isReunited && !item.hasApprovedClaim && isClaimPending && (
                        <span className="pill pill-lost" style={{ background: '#fef3c7', color: '#b45309' }}>
                          ⏳ Claim Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="card-body">
                    <div className="card-header-row">
                      <h3 className="card-title">{item.name}</h3>
                      <span className="pill pill-subtle" style={{ fontSize: '11px' }}>
                        {item.type === 'lost' ? 'Missing' : 'Reported'}
                      </span>
                    </div>

                    <p className="card-desc">{item.desc}</p>

                    <div className="card-meta-row">
                      <span className="card-meta-item">
                        📁 {item.category}
                      </span>
                      <span className="card-meta-item">
                        📍 {item.location}
                      </span>
                      <span className="card-meta-item">
                        📅 {item.date}
                      </span>
                    </div>

                    {item.audio && (
                      <div style={{ marginTop: '10px' }}>
                        <AudioPlayer audioSrc={item.audio} title="Reporter Voice Note" />
                      </div>
                    )}

                    {isContactRevealed && (
                      <div className="contact-reveal-box">
                        <div>👤 Reporter: {item.name}</div>
                        <div>📞 Contact: {item.contact}</div>
                        {item.roll && <div>🎓 Roll: {item.roll}</div>}
                        {item.handoverStation && <div>🏛️ Drop Station: {item.handoverStation}</div>}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="card-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginTop: '12px' }}>
                      {isOwner ? (
                        isReunited ? (
                          <button
                            className="btn-subtle-pill"
                            style={{ fontSize: '13px', padding: '8px 14px', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}
                            disabled
                          >
                            🎉 Reunited
                          </button>
                        ) : (item.hasActiveOtp || item.hasApprovedClaim || item.handoverOtp) ? (
                          <button
                            className="btn-primary-pill"
                            style={{
                              fontSize: '13px',
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: '#ffffff',
                              fontWeight: 800,
                              boxShadow: '0 2px 10px rgba(22, 163, 74, 0.4)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onClick={() => setOtpModalItem(item)}
                            title="Claim approved! Click to enter the claimant's OTP and finalize handover."
                          >
                            🔑 Enter Handover OTP 🎉
                          </button>
                        ) : (
                          <button
                            className="btn-primary-pill"
                            style={{
                              fontSize: '13px',
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              color: '#ffffff',
                              fontWeight: 800,
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setFounderReviewItem(item)}
                            title="Review claimant answer to approve or reject."
                          >
                            📋 Review Claim ({item.pendingClaimsCount || 1}) ➔
                          </button>
                        )
                      ) : isReunited ? (
                        <button
                          className="btn-subtle-pill"
                          style={{ fontSize: '13px', padding: '8px 14px', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}
                          disabled
                        >
                          🎉 Reunited
                        </button>
                      ) : myClaim ? (
                        myClaim.status === 'approved' ? (
                          <button
                            className="btn-primary-pill"
                            style={{
                              fontSize: '13px',
                              padding: '8px 16px',
                              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                              color: '#ffffff',
                              fontWeight: 800,
                              boxShadow: '0 2px 10px rgba(22, 163, 74, 0.4)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setClaimantOtpModalItem(item)}
                            title="Your claim was approved! Click to view your Handover OTP and founder details."
                          >
                            🔑 Get Handover OTP ➔
                          </button>
                        ) : myClaim.status === 'rejected' ? (
                          <button
                            className="btn-subtle-pill"
                            style={{ fontSize: '13px', padding: '8px 14px', background: '#fee2e2', color: '#991b1b', fontWeight: 700 }}
                            disabled
                          >
                            ✕ Claim Rejected
                          </button>
                        ) : (
                          <button
                            className="btn-subtle-pill"
                            style={{
                              fontSize: '13px',
                              padding: '8px 16px',
                              background: '#fef3c7',
                              color: '#b45309',
                              fontWeight: 700,
                              border: '1px solid #fde68a',
                              cursor: 'pointer'
                            }}
                            onClick={() => navigate('/dashboard')}
                            title="You already claimed this item! Click to view status on your dashboard."
                          >
                            ⏳ Claim Submitted (Under Review)
                          </button>
                        )
                      ) : item.hasApprovedClaim ? (
                        <button
                          className="btn-subtle-pill"
                          style={{ fontSize: '13px', padding: '8px 14px', background: '#f1f5f9', color: '#64748b', fontWeight: 700 }}
                          disabled
                          title="An approved claimant is currently completing the handover."
                        >
                          🔒 Handover In Progress
                        </button>
                      ) : (
                        <button
                          className="btn-primary-pill"
                          style={{ fontSize: '13px', padding: '8px 14px' }}
                          onClick={() => setClaimModalItem(item)}
                        >
                          Claim Item 🤝
                        </button>
                      )}

                      <button
                        className="btn-subtle-pill"
                        style={{ fontSize: '13px', padding: '8px 10px' }}
                        title="Print A4 Notice Poster with QR Code"
                        onClick={() => setPosterModalItem(item)}
                      >
                        🖨️
                      </button>

                      <button
                        className={`btn-secondary-pill ${isContactRevealed ? 'active' : ''}`}
                        style={{ fontSize: '13px', padding: '8px 12px' }}
                        title="Reveal contact details"
                        onClick={() => setRevealedContactId(isContactRevealed ? null : itemId)}
                      >
                        📞
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Claim Verification Modal */}
        {claimModalItem && (
          <ClaimModal
            item={claimModalItem}
            user={user}
            onClose={() => setClaimModalItem(null)}
            onSuccess={() => {
              fetchItems();
            }}
          />
        )}

        {/* Printable Notice Poster Modal */}
        {posterModalItem && (
          <PrintPosterModal
            item={posterModalItem}
            onClose={() => setPosterModalItem(null)}
          />
        )}

        {/* Founder Claim Review & Approval Modal */}
        {founderReviewItem && (
          <FounderReviewModal
            item={founderReviewItem}
            onClose={() => setFounderReviewItem(null)}
            onUpdate={(updated) => {
              setFounderReviewItem(updated);
              fetchItems();
            }}
          />
        )}

        {/* Claimant OTP & Founder Details Popup Modal */}
        {claimantOtpModalItem && (
          <ClaimantOtpModal
            item={claimantOtpModalItem}
            otp={claimantOtpModalItem.myHandoverOtp}
            onClose={() => setClaimantOtpModalItem(null)}
          />
        )}

        {/* Floating Handover Widget (Founder side anchored at bottom right) */}
        {otpModalItem && (
          <FloatingHandoverWidget
            item={otpModalItem}
            onClose={() => setOtpModalItem(null)}
            onSuccess={() => {
              fetchItems();
            }}
          />
        )}
      </div>
    </section>
  );
};

export default Listings;
