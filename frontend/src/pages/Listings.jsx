import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Listings = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', category: '', location: '', date: '' });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axios.get(`http://localhost:5000/api/items?${query}`);
      if (res.data.ok) setItems(res.data.items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <section className="section">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Lost & Found Items</h1>
          <p className="hero-desc">Browse reported items</p>
        </div>
        
        <div className="filters">
          <input type="text" name="q" placeholder="Search..." className="input" onChange={handleFilterChange} />
          <select name="category" className="input" onChange={handleFilterChange}>
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="ID/Wallet">ID/Wallet</option>
            <option value="Books/Stationery">Books/Stationery</option>
            <option value="Keys">Keys</option>
            <option value="Accessories">Accessories</option>
            <option value="Other">Other</option>
          </select>
          <select name="location" className="input" onChange={handleFilterChange}>
            <option value="">All Locations</option>
            <option value="Library">Library</option>
            <option value="Cafeteria">Cafeteria</option>
            <option value="Hostel">Hostel</option>
            <option value="Ground">Ground</option>
            <option value="Classroom Block A">Classroom Block A</option>
            <option value="Classroom Block B">Classroom Block B</option>
            <option value="Other">Other</option>
          </select>
          <input type="date" name="date" className="input" onChange={handleFilterChange} />
        </div>

        <div className="cards" style={{ marginTop: '2rem' }}>
          {loading ? (
            <div className="placeholder">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="placeholder">No items found.</div>
          ) : (
            items.map(item => (
              <div className="card" key={item._id}>
                <div className="card-img" style={{
                  backgroundImage: item.img ? `url(http://localhost:5000${item.img})` : 'none',
                  backgroundColor: 'var(--card-bg)'
                }}>
                  {!item.img && <span style={{fontSize: '3rem'}}>{item.type === 'lost' ? '❓' : '💡'}</span>}
                </div>
                <div className="card-body">
                  <div className="card-title">{item.name}</div>
                  <div className="card-meta">
                    <div>{item.category}</div>
                    <div>{item.location}</div>
                  </div>
                  <div className="pill" style={{marginTop: '0.5rem', display: 'inline-block'}}>{item.type.toUpperCase()}</div>
                  <div style={{marginTop: '1rem', fontSize: '0.875rem', color: 'var(--fg-muted)'}}>
                    <strong>Date:</strong> {item.date} <br/>
                    <strong>Contact:</strong> {item.contact}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Listings;
