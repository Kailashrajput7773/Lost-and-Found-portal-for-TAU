import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CampusMap from '../components/CampusMap';
import ClaimModal from '../components/ClaimModal';
import PrintPosterModal from '../components/PrintPosterModal';
import AudioPlayer from '../components/AudioPlayer';

const Listings = ({ user }) => {
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

  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="section-title">Campus Items Catalog</h1>
            <p className="section-desc">Browse reported lost and found belongings across Apollo University</p>
          </div>

          <button
            className={`btn-subtle-pill ${showMap ? 'active-map-toggle' : ''}`}
            onClick={() => setShowMap(!showMap)}
            style={{ fontWeight: 700 }}
          >
            {showMap ? '✕ Hide Campus Map' : '🗺️ Interactive Campus Map & Heatmap'}
          </button>
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
                      backgroundImage: item.img ? `url(http://localhost:5000${item.img})` : 'none',
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
                      {isClaimPending && !isReunited && (
                        <span className="pill pill-lost" style={{ background: '#fef3c7', color: '#b45309' }}>
                          ⏳ Claim Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="card-body">
                    <div className="card-header-row">
                      <div className="card-title">{item.name}</div>
                    </div>

                    <p className="card-desc-snippet">{item.desc}</p>

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
                      <button
                        className="btn-primary-pill"
                        style={{ fontSize: '13px', padding: '8px 14px' }}
                        onClick={() => setClaimModalItem(item)}
                        disabled={isReunited}
                      >
                        {isReunited ? 'Reunited 🎉' : 'Claim Item 🤝'}
                      </button>

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
      </div>
    </section>
  );
};

export default Listings;
