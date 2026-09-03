import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Listings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', location: '', date: '' });
  const [revealedContactId, setRevealedContactId] = useState(null);

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
        <div className="section-header">
          <h1 className="section-title">Campus Items Catalog</h1>
          <p className="section-desc">Browse reported lost and found belongings across Apollo University</p>
        </div>

        {/* Filter Pills Bar matching Shopcart filter buttons */}
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

        {/* Cards Grid matching Shopcart Product Cards */}
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

                  {/* Card Image Area with light grey background */}
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
                      <div className="contact-reveal-box">
                        <div>👤 Reporter: {item.name}</div>
                        <div>📞 Contact: {item.contact}</div>
                        {item.roll && <div>🎓 Roll: {item.roll}</div>}
                      </div>
                    )}

                    {/* Pill Action Button matching 'Add to Cart' */}
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
      </div>
    </section>
  );
};

export default Listings;
