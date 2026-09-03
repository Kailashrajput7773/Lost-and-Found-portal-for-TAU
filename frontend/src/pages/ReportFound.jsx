import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ReportFound = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', contact: '', category: 'Electronics',
    desc: '', location: 'Library', date: '', type: 'found'
  });
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) data.append('image', image);

    try {
      const res = await axios.post('http://localhost:5000/api/items', data);
      if (res.data.ok) {
        alert("Reported successfully! Awaiting admin approval.");
        navigate('/listings');
      }
    } catch (error) {
      alert(error.response?.data?.error || "Error reporting item");
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Report a Found Item</h1>
          <p className="hero-desc">Help someone get their belongings back</p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Item Name *</label>
            <input type="text" className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="field">
            <label>Your Contact (Email/Phone) *</label>
            <input type="text" className="input" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
          </div>
          <div className="field">
            <label>Category *</label>
            <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option>Electronics</option><option>ID/Wallet</option><option>Books/Stationery</option>
              <option>Keys</option><option>Accessories</option><option>Other</option>
            </select>
          </div>
          <div className="field">
            <label>Date Found *</label>
            <input type="date" className="input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="field">
            <label>Location Found *</label>
            <select className="input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
              <option>Library</option><option>Cafeteria</option><option>Hostel</option>
              <option>Ground</option><option>Classroom Block A</option><option>Classroom Block B</option>
              <option>Other</option>
            </select>
          </div>
          <div className="field">
            <label>Description *</label>
            <textarea className="input" rows="4" required value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})}></textarea>
          </div>
          <div className="field">
            <label>Upload Image (Optional)</label>
            <input type="file" className="input" accept="image/*" onChange={e => setImage(e.target.files[0])} />
          </div>
          <button type="submit" className="btn" style={{width: '100%'}}>Submit Report</button>
        </form>
      </div>
    </section>
  );
};

export default ReportFound;
