import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Listings = ({ user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', location: '', date: '' });
  const [revealedContactId, setRevealedContactId] = useState(null);

  // Reporting Modal state
  const [reportingItem, setReportingItem] = useState(null);
  const [reportReason, setReportReason] = useState('Fake or Fraudulent Listing');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (activeType) params.type = activeType;
      const query = new URLSearchParams(params).toString();
      const res = await axios.get(`http://localhost:5000/api/items?${query}`);
      if (res.data.ok) setItems(res.data.items);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters, activeType]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleSave = (id) => {
    setSavedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

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
      const res = await axios.post('http://localhost:5000/api/auth/report-user', {
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

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Campus Items Catalog</h1>
          <p className="section-desc">Browse reported lost and found belongings across Apollo University</p>
        </div>

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
            Lost 🔴
          </button>
          <button
            className={`filter-chip ${activeType === 'found' ? 'active' : ''}`}
            onClick={() => setActiveType('found')}
          >
            Found 🟢
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
            <option value="Library">Library</option>
            <option value="Cafeteria">Cafeteria</option>
            <option value="Hostel">Hostel</option>
            <option value="Ground">Sports Ground</option>
            <option value="Classroom Block A">Classroom Block A</option>
            <option value="Classroom Block B">Classroom Block B</option>
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

              return (
                <div className="card" key={itemId}>
                  {/* Floating Bookmark/Heart Button */}
                  <button
                    className="card-fav-btn"
                    onClick={() => toggleSave(itemId)}
                    title={isSaved ? "Saved" : "Save item"}
                    style={{ color: isSaved ? '#ef4444' : 'var(--text-muted)' }}
                  >
                    {isSaved ? '❤️' : '🤍'}
                  </button>

                  {/* Card Image */}
                  <div
                    className="card-img"
                    style={{
                      backgroundImage: item.img ? `url(http://localhost:5000${item.img})` : 'none',
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
                  </div>

                  {/* Card Content Body */}
                  <div className="card-body">
                    <div className="card-header-row">
                      <div className="card-title">{item.name}</div>
                    </div>

                    <p className="card-desc-snippet">{item.desc}</p>

                    <div className="card-meta-row">
                      <span className={`pill ${item.type === 'found' ? 'pill-found' : 'pill-lost'}`}>
                        {item.type === 'found' ? 'Found' : 'Lost'}
                      </span>
                      <span className="card-meta-item">
                        📍 {item.location}
                      </span>
                      <span className="card-meta-item">
                        📅 {item.date}
                      </span>
                    </div>

                    {isContactRevealed && (
                      <div className="contact-reveal-box" style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 600 }}>👤 Contact Name: {item.name}</div>
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
                          🚩 Report User / False Claim
                        </button>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      className={`card-action-btn ${isContactRevealed ? 'filled' : ''}`}
                      onClick={() => setRevealedContactId(isContactRevealed ? null : itemId)}
                    >
                      {isContactRevealed ? 'Hide Details' : item.type === 'lost' ? 'I Found This' : 'Claim Item'}
                    </button>
                  </div>
                </div>
              );
            })}
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
