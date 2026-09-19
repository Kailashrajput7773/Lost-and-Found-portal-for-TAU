import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReportLost = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    roll: user?.roll || '',
    contact: user?.phone || user?.email || '',
    category: 'Electronics',
    desc: '',
    location: 'Library',
    date: '',
    type: 'lost'
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) data.append('image', image);

    try {
      const res = await axios.post('http://localhost:5000/api/items', data);
      if (res.data.ok) {
        alert("Lost item report published live! Your listing is now active on the campus catalog.");
        navigate('/listings');
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error reporting lost item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="form-wrapper">
          <div className="form-card">
            <div className="page-header">
              <span className="pill pill-lost" style={{ marginBottom: '12px' }}>Report Lost</span>
              <h1 className="page-title">Report a Lost Item</h1>
              <p className="section-desc">Fill in the details below so campus finders can identify your item.</p>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label>Item Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Wireless Earbuds, HP Laptop, Casio Watch"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field">
                  <label>Student Roll Number *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 122311520111"
                    required
                    value={formData.roll}
                    onChange={e => setFormData({...formData, roll: e.target.value})}
                  />
                </div>
                <div className="field">
                  <label>Contact (Phone / Email) *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 9999999999 or student@apollo.edu.in"
                    required
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field">
                  <label>Category *</label>
                  <select
                    className="select"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Electronics</option>
                    <option>ID/Wallet</option>
                    <option>Books/Stationery</option>
                    <option>Keys</option>
                    <option>Accessories</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="field">
                  <label>Date Lost *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="field">
                <label>Last Seen Location *</label>
                <select
                  className="select"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                >
                  <option>Library</option>
                  <option>Cafeteria</option>
                  <option>Hostel</option>
                  <option>Ground</option>
                  <option>Classroom Block A</option>
                  <option>Classroom Block B</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="field">
                <label>Description & Distinguishing Features *</label>
                <textarea
                  className="textarea"
                  placeholder="Describe color, brand, stickers, scratches, or any identifying marks..."
                  required
                  value={formData.desc}
                  onChange={e => setFormData({...formData, desc: e.target.value})}
                />
              </div>

              <div className="field">
                <label>Upload Photo (Optional)</label>
                <input
                  type="file"
                  className="input"
                  accept="image/*"
                  onChange={e => setImage(e.target.files[0])}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Submitting Report...' : 'Submit Lost Item Report'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReportLost;
