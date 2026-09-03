import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReportFound = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contact: user?.phone || user?.email || '',
    category: 'Electronics',
    desc: '',
    location: 'Library',
    date: '',
    type: 'found'
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
        alert("Found item report submitted successfully! Thank you for helping the Apollo Community.");
        navigate('/listings');
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error reporting found item");
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
              <span className="pill pill-found" style={{ marginBottom: '12px' }}>Report Found</span>
              <h1 className="page-title">Report a Found Item</h1>
              <p className="section-desc">Thank you for helping reconnect a student with their lost belonging!</p>
            </div>

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label>Found Item Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Apple AirPods Case, Scientific Calculator, Blue Water Bottle"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="field">
                  <label>Your Contact (Phone / Email) *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., 9999999999"
                    required
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                  />
                </div>
                <div className="field">
                  <label>Date Found *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
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
                  <label>Location Found *</label>
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
              </div>

              <div className="field">
                <label>Description & Safe Deposit Note *</label>
                <textarea
                  className="textarea"
                  placeholder="Where was it picked up? Where can the owner claim it or how can they verify ownership?"
                  required
                  value={formData.desc}
                  onChange={e => setFormData({...formData, desc: e.target.value})}
                />
              </div>

              <div className="field">
                <label>Upload Item Photo (Optional)</label>
                <input
                  type="file"
                  className="input"
                  accept="image/*"
                  onChange={e => setImage(e.target.files[0])}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Submitting Report...' : 'Publish Found Item Report'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReportFound;
