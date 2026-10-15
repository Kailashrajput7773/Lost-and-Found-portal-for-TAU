import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import api, { getMediaUrl } from '../services/api';
import {
  Search,
  Filter,
  Heart,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  ExternalLink,
  MessageCircle,
  Flag,
  UserCheck,
  Trash2
} from 'lucide-react';

const CAMPUS_LOCATIONS = [
  "All Locations",
  "Central Library (Floors 1-2)",
  "Main Academic Block A",
  "Main Academic Block B",
  "Main Academic Block C",
  "Cafeteria & Student Food Court",
  "Apollo Auditorium & Open Air Theatre",
  "Sports Arena & Cricket Ground",
  "Boys Hostel (Blocks 1-3)",
  "Girls Hostel (Blocks 1-2)",
  "Medical & Allied Health Science Block",
  "Examination Cell & Administrative Office",
  "Campus Bus Bay & Parking",
  "Other Campus Location"
];

const Listings = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'lost' | 'found' | 'saved' | 'my' | 'reunited'
  const [stats, setStats] = useState({ total: 0, active: 0, reunited: 0, lost: 0, found: 0 });

  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tau_saved_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [filters, setFilters] = useState({ q: '', category: '', location: '', date: '' });
  const [revealedContactId, setRevealedContactId] = useState(null);

  // Smart Matching Modal State
  const [matchingItem, setMatchingItem] = useState(null);
  const [smartMatches, setSmartMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Claim Verification Modal State
  const [claimingItem, setClaimingItem] = useState(null);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimantContact, setClaimantContact] = useState(user?.phone || user?.email || '');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');

  // Allegation Reporting Modal State
  const [reportingItem, setReportingItem] = useState(null);
  const [reportReason, setReportReason] = useState('Fake or Fraudulent Listing');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    localStorage.setItem('tau_saved_items', JSON.stringify(savedIds));
  }, [savedIds]);

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/api/items/stats');
      if (res.data.ok) {
        setStats(res.data.stats);
      }
    } catch (err) {
      // fallback silent
    }
  };

  // Fetch Items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (params.location === 'All Locations') delete params.location;

      if (activeTab === 'lost' || activeTab === 'found') {
        params.type = activeTab;
        params.status = 'active';
      } else if (activeTab === 'reunited') {
        params.status = 'resolved';
      } else if (activeTab === 'all') {
        // default show active
        params.status = 'active';
      }

      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/api/items?${query}`);
      if (res.data.ok) {
        setItems(res.data.items);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [filters, activeTab]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleSave = (id) => {
    setSavedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // WhatsApp 1-Click Share
  const handleShareWhatsApp = (item) => {
    const text = `🚨 *The Apollo University Lost & Found Alert* 🚨\n\n📌 *Item:* ${item.name}\n🏷️ *Type:* ${item.type.toUpperCase()}\n📍 *Location:* ${item.location}\n📅 *Date:* ${item.date}\n📝 *Details:* ${item.desc}\n\n🔗 View & connect on campus portal:\n${window.location.origin}/listings`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Check Smart Matches
  const handleCheckMatches = async (item) => {
    setMatchingItem(item);
    setLoadingMatches(true);
    setSmartMatches([]);
    try {
      const res = await api.get(`/api/items/${item._id || item.id}/matches`);
      if (res.data.ok) {
        setSmartMatches(res.data.matches);
      }
    } catch (err) {
      console.error("Match error:", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Reunited / Resolve
  const handleMarkReunited = async (item) => {
    if (!window.confirm(`Celebrate recovery of "${item.name}"? This will mark it as successfully reunited with its owner!`)) {
      return;
    }

    try {
      const res = await api.patch(`/api/items/${item._id || item.id}/resolve`, {
        claimedBy: user?.name || user?.email || 'Apollo Student'
      });
      if (res.data.ok) {
        // Fire celebration confetti!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        fetchItems();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update item");
    }
  };

  // Delete own item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      const res = await api.delete(`/api/items/${item._id || item.id}`);
      if (res.data.ok) {
        fetchItems();
        fetchStats();
      }
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  // Claim Item Initiation
  const handleOpenClaim = (item) => {
    if (item.question) {
      setClaimingItem(item);
      setClaimAnswer('');
      setClaimSuccess('');
    } else {
      setRevealedContactId(revealedContactId === (item._id || item.id) ? null : (item._id || item.id));
    }
  };

  // Submit Claim Verification Answer
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimingItem) return;
    setSubmittingClaim(true);
    try {
      const res = await api.post(`/api/items/${claimingItem._id || claimingItem.id}/claim`, {
        answer: claimAnswer,
        claimantName: user?.name || user?.fullName || 'Campus Student',
        claimantContact
      });
      if (res.data.ok) {
        setClaimSuccess(res.data.message);
        setRevealedContactId(claimingItem._id || claimingItem.id);
        setTimeout(() => {
          setClaimingItem(null);
          setClaimSuccess('');
        }, 2200);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Error submitting claim");
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Allegation Modal
  const handleOpenReport = (item) => {
    setReportingItem(item);
    setReportReason('Fake or Fraudulent Listing');
    setReportDetails('');
    setReportSuccess('');
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportingItem) return;
    setSubmittingReport(true);
    try {
      const res = await api.post('/api/auth/report-user', {
        reportedUserEmail: reportingItem.contact,
        reportedUserName: reportingItem.name,
        reportedByEmail: user?.email || 'student.reporter@apollo.edu.in',
        reportedByName: user?.name || user?.fullName || 'Campus Member',
        reason: reportReason,
        details: reportDetails,
        itemId: reportingItem._id || reportingItem.id,
        itemName: reportingItem.name
      });
      if (res.data.ok) {
        setReportSuccess('Your allegation has been filed and dispatched to campus administration.');
        setTimeout(() => {
          setReportingItem(null);
          setReportSuccess('');
        }, 1800);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to file report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filtered displayed items based on tabs
  const displayedItems = items.filter(item => {
    const itemId = item._id || item.id;
    if (activeTab === 'saved') {
      return savedIds.includes(itemId);
    }
    if (activeTab === 'my') {
      if (!user) return false;
      const userMail = (user.email || "").toLowerCase();
      const userPhone = user.phone || "";
      const userRoll = (user.roll || "").toLowerCase();
      const itemContact = (item.contact || "").toLowerCase();
      const itemRoll = (item.roll || "").toLowerCase();
      return (
        (userMail && itemContact.includes(userMail)) ||
        (userPhone && itemContact.includes(userPhone)) ||
        (userRoll && itemRoll.includes(userRoll))
      );
    }
    return true;
  });

  return (
    <section className="section">
      <div className="container">
        {/* Header with Title and Live Stats Banner */}
        <div className="section-header" style={{ marginBottom: '24px' }}>
          <h1 className="section-title">Campus Items Catalog</h1>
          <p className="section-desc">Browse, match, and recover reported belongings across The Apollo University</p>

          {/* Quick Stats Pill Row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: 600 }}>
              🟢 Active: <strong style={{ color: 'var(--primary)' }}>{stats.active}</strong>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '13px', fontWeight: 700 }}>
              🎉 Reunited: <strong>{stats.reunited}</strong>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              🔴 Lost: <strong>{stats.lost}</strong>
            </div>
            <div style={{ background: 'var(--bg-card)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              🟢 Found: <strong>{stats.found}</strong>
            </div>
          </div>
        </div>

        {/* Dynamic Category Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '16px' }}>
          {[
            { id: 'all', label: 'All Active Items' },
            { id: 'lost', label: 'Lost 🔴' },
            { id: 'found', label: 'Found 🟢' },
            { id: 'saved', label: `Saved ❤️ (${savedIds.length})` },
            { id: 'my', label: 'My Reports 📋' },
            { id: 'reunited', label: '🎉 Reunited Hall' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`filter-chip ${activeTab === tab.id ? 'active' : ''}`}
              style={{ whiteSpace: 'nowrap', fontWeight: activeTab === tab.id ? 700 : 500 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Location Filters Bar */}
        <div className="filters-bar" style={{ marginBottom: '28px' }}>
          <div className="filter-search-wrap">
            <span className="filter-search-icon">🔍</span>
            <input
              type="text"
              name="q"
              placeholder="Search keyword, brand, color, or description..."
              className="filter-search-input"
              value={filters.q}
              onChange={handleFilterChange}
            />
          </div>

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
            {CAMPUS_LOCATIONS.map(loc => (
              <option key={loc} value={loc === "All Locations" ? "" : loc}>{loc}</option>
            ))}
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
        ) : displayedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-main)', marginBottom: '6px' }}>
              {activeTab === 'saved' ? 'No saved items yet' : activeTab === 'my' ? 'No reports from your account' : 'No items match your filters'}
            </div>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {activeTab === 'saved' ? 'Click the heart icon on any item card to bookmark it.' : 'Try adjusting your search filters or check another category.'}
            </p>
          </div>
        ) : (
          <div className="cards">
            {displayedItems.map(item => {
              const itemId = item._id || item.id;
              const isSaved = savedIds.includes(itemId);
              const isContactRevealed = revealedContactId === itemId;
              const isResolved = item.status === 'resolved';

              return (
                <div className="card" key={itemId} style={{ position: 'relative', opacity: isResolved ? 0.9 : 1 }}>
                  {/* Floating Action Bar on Card Header */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
                    <button
                      className="card-fav-btn"
                      onClick={() => handleShareWhatsApp(item)}
                      title="Share to WhatsApp"
                      style={{ background: 'rgba(255,255,255,0.9)', color: '#25D366', borderRadius: '50%', width: '34px', height: '34px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      className="card-fav-btn"
                      onClick={() => toggleSave(itemId)}
                      title={isSaved ? "Saved" : "Save item"}
                      style={{ background: 'rgba(255,255,255,0.9)', color: isSaved ? '#ef4444' : '#64748b', borderRadius: '50%', width: '34px', height: '34px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Heart size={16} fill={isSaved ? '#ef4444' : 'none'} />
                    </button>
                  </div>

                  {/* Resolved Reunited Badge Overlay */}
                  {isResolved && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      <CheckCircle2 size={14} /> REUNITED 🎉
                    </div>
                  )}

                  {/* Card Image */}
                  <div
                    className="card-img"
                    style={{
                      backgroundImage: item.img ? `url(${getMediaUrl(item.img)})` : 'none',
                    }}
                  >
                    {!item.img && (
                      <span style={{ fontSize: '3.5rem', opacity: 0.85 }}>
                        {item.category === 'Electronics' ? '💻' :
                         item.category === 'ID/Wallet' ? '🪪' :
                         item.category === 'Books/Stationery' ? '📚' :
                         item.category === 'Keys' ? '🔑' :
                         item.type === 'lost' ? '🔴' : '🟢'}
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
                    <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div className="card-title">{item.name}</div>
                    </div>

                    <p className="card-desc">{item.desc}</p>

                    <div className="card-meta-row">
                      <span className="card-meta-item">
                        📁 {item.category}
                      </span>
                      <span className="card-meta-item" title={item.location}>
                        📍 {item.location}
                      </span>
                      <span className="card-meta-item">
                        📅 {item.date}
                      </span>
                    </div>

                    {/* Anti-Fraud / Verification prompt indicator */}
                    {item.question && (
                      <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <ShieldCheck size={14} /> Verification Check Protected
                      </div>
                    )}

                    {/* Contact Reveal Box */}
                    {isContactRevealed && (
                      <div className="contact-reveal-box" style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 600 }}>👤 Contact: {item.name}</div>
                        <div>📞 Reach: <strong>{item.contact}</strong></div>
                        {item.roll && <div>🎓 Roll: {item.roll}</div>}

                        <button
                          type="button"
                          onClick={() => handleOpenReport(item)}
                          style={{
                            marginTop: '8px',
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          🚩 Report False Listing
                        </button>
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                      {!isResolved ? (
                        <>
                          <button
                            className={`card-action-btn ${isContactRevealed ? 'filled' : ''}`}
                            onClick={() => handleOpenClaim(item)}
                            style={{ flex: 1 }}
                          >
                            {isContactRevealed ? 'Hide Details' : item.type === 'lost' ? 'I Found This' : 'Claim Item'}
                          </button>

                          {/* Smart Match Button */}
                          <button
                            onClick={() => handleCheckMatches(item)}
                            title="Check automated matches for this item"
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--primary)',
                              background: 'rgba(13, 148, 136, 0.08)',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: 700,
                              fontSize: '12.5px'
                            }}
                          >
                            <Sparkles size={16} /> Matches
                          </button>

                          {/* Mark Reunited Action */}
                          <button
                            onClick={() => handleMarkReunited(item)}
                            title="Mark as successfully returned to owner"
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #10b981',
                              background: 'rgba(16, 185, 129, 0.08)',
                              color: '#059669',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        </>
                      ) : (
                        <div style={{ width: '100%', textAlign: 'center', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderRadius: '8px', fontWeight: 700, fontSize: '13px' }}>
                          ✅ Recovered & Returned
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SMART MATCHES MODAL */}
        {matchingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '560px',
                width: '100%',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--primary)" /> Smart Matches for: {matchingItem.name}
                </h3>
                <button
                  onClick={() => setMatchingItem(null)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              {loadingMatches ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
                  Scanning catalog for matching category, location, and keywords...
                </div>
              ) : smartMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                    No direct matches found right now
                  </p>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    We automatically notify you when a matching {matchingItem.type === 'lost' ? 'Found' : 'Lost'} report is filed.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Found <strong>{smartMatches.length} potential matches</strong> in the opposite catalog:
                  </div>

                  {smartMatches.map(({ item, score, reasons }) => (
                    <div
                      key={item._id || item.id}
                      style={{
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(13, 148, 136, 0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{item.name}</strong>
                        <span style={{ background: '#0d9488', color: '#fff', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                          {score}% Match
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        📍 {item.location} • 📅 {item.date} • Category: {item.category}
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--text-main)' }}>
                        {item.desc}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {reasons.map((r, i) => (
                          <span key={i} style={{ fontSize: '11px', background: 'var(--bg-tag)', padding: '2px 6px', borderRadius: '4px' }}>
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                      <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Contact: <strong>{item.contact}</strong>
                        </span>
                        <button
                          onClick={() => {
                            setMatchingItem(null);
                            handleShareWhatsApp(item);
                          }}
                          style={{
                            background: '#25D366',
                            color: '#fff',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Share2 size={12} /> WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLAIM VERIFICATION CHALLENGE MODAL */}
        {claimingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '460px',
                width: '100%',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} /> Ownership Verification Challenge
                </h3>
                <button
                  onClick={() => setClaimingItem(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              {claimSuccess ? (
                <div style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
                  ✅ {claimSuccess}
                </div>
              ) : (
                <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: 'rgba(13, 148, 136, 0.08)', padding: '12px', borderRadius: '8px', fontSize: '13.5px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>
                      Finder's Challenge Question:
                    </div>
                    <div style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>
                      "{claimingItem.question}"
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                      Your Answer (Prove Ownership) *
                    </label>
                    <textarea
                      required
                      placeholder="Describe the answer accurately..."
                      value={claimAnswer}
                      onChange={e => setClaimAnswer(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                      Your Contact (Phone / Apollo Email) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210 or student@apollo.edu.in"
                      value={claimantContact}
                      onChange={e => setClaimantContact(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setClaimingItem(null)}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingClaim}
                      style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {submittingClaim ? 'Submitting...' : 'Submit Answer to Finder'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ALLEGATION REPORT MODAL */}
        {reportingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '460px',
                width: '100%',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🚩</span> Report User / Allegation
                </h3>
                <button
                  onClick={() => setReportingItem(null)}
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>

              {reportSuccess ? (
                <div style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
                  ✅ {reportSuccess}
                </div>
              ) : (
                <form onSubmit={handleSendReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Filing report against: <strong>{reportingItem.name}</strong> ({reportingItem.contact})
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                      Reason for Report *
                    </label>
                    <select
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                    >
                      <option>Fake or Fraudulent Listing</option>
                      <option>False Ownership Claim</option>
                      <option>Refusal to Return Verified Belonging</option>
                      <option>Abuse or Harassment</option>
                      <option>Commercial / Spam Advertisement</option>
                      <option>Other Policy Violation</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
                      Details / Evidence Description
                    </label>
                    <textarea
                      placeholder="Explain the incident for campus administrators to investigate..."
                      value={reportDetails}
                      onChange={e => setReportDetails(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setReportingItem(null)}
                      style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {submittingReport ? 'Filing Report...' : 'Submit Report to Admin'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default Listings;
