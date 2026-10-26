import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Upload, Camera, X, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/Toast';

const CAMPUS_LOCATIONS = [
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

const ReportLost = ({ user }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    roll: user?.roll || '',
    contact: user?.phone || user?.email || '',
    category: 'Electronics',
    desc: '',
    location: CAMPUS_LOCATIONS[0],
    date: new Date().toISOString().split('T')[0],
    type: 'lost'
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image exceeds 10MB limit. Please choose a smaller file.");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (image) data.append('image', image);

    try {
      const res = await api.post('/api/items', data);
      if (res.data.ok) {
        setSubmissionSuccess(res.data.item);
        toast.success("Lost item report broadcast to Apollo campus catalog!");
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || "Error reporting lost item";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="form-wrapper">
          <div className="form-card">
            {submissionSuccess ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Report Published Live!
                </h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px' }}>
                  Your lost item report for <strong>"{submissionSuccess.name}"</strong> has been broadcast to the Apollo University catalog.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/listings')}
                    className="btn-submit"
                    style={{ minWidth: '180px', padding: '12px 24px' }}
                  >
                    View in Browse Items
                  </button>
                  <button
                    onClick={() => navigate(`/listings?q=${encodeURIComponent(submissionSuccess.name)}`)}
                    className="btn-action"
                    style={{
                      background: 'rgba(13, 148, 136, 0.1)',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary)',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={16} /> Check Instant Matches
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="page-header">
                  <span className="pill pill-lost" style={{ marginBottom: '12px' }}>Report Lost</span>
                  <h1 className="page-title">Report a Lost Item</h1>
                  <p className="section-desc">Fill in the details below so campus finders can identify and return your belonging.</p>
                </div>

                <form onSubmit={handleSubmit} className="form-grid">
                  <div className="field">
                    <label htmlFor="lost-item-name" className="field-label">Item Name *</label>
                    <input
                      id="lost-item-name"
                      type="text"
                      className="input"
                      placeholder="e.g., Wireless Earbuds, HP Envy Laptop, Titan Watch"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      style={{ minHeight: '44px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                    <div className="field">
                      <label htmlFor="lost-student-roll" className="field-label">Student Roll Number *</label>
                      <input
                        id="lost-student-roll"
                        type="text"
                        className="input"
                        placeholder="e.g., 122311520111"
                        required
                        value={formData.roll}
                        onChange={e => setFormData({...formData, roll: e.target.value})}
                        style={{ minHeight: '44px' }}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="lost-contact" className="field-label">Contact (Phone / Email) *</label>
                      <input
                        id="lost-contact"
                        type="text"
                        className="input"
                        placeholder="e.g., 9876543210 or student@apollo.edu.in"
                        required
                        value={formData.contact}
                        onChange={e => setFormData({...formData, contact: e.target.value})}
                        style={{ minHeight: '44px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                    <div className="field">
                      <label htmlFor="lost-category" className="field-label">Category *</label>
                      <select
                        id="lost-category"
                        className="select"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        style={{ minHeight: '44px' }}
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
                      <label htmlFor="lost-date" className="field-label">Date Lost *</label>
                      <input
                        id="lost-date"
                        type="date"
                        className="input"
                        required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        style={{ minHeight: '44px' }}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="lost-location" className="field-label">Last Seen Campus Location *</label>
                    <select
                      id="lost-location"
                      className="select"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      style={{ minHeight: '44px' }}
                    >
                      {CAMPUS_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="lost-desc" className="field-label">Description & Distinguishing Features *</label>
                    <textarea
                      id="lost-desc"
                      className="textarea"
                      placeholder="Describe color, brand, stickers, scratches, or any unique identifiers that prove ownership..."
                      required
                      value={formData.desc}
                      onChange={e => setFormData({...formData, desc: e.target.value})}
                    />
                  </div>

                  {/* Photo Upload with Camera & Preview */}
                  <div className="field">
                    <label id="lost-photo-label" className="field-label">Upload Photo (Optional)</label>
                    {imagePreview ? (
                      <div style={{ position: 'relative', display: 'inline-block', marginTop: '6px' }}>
                        <img
                          src={imagePreview}
                          alt="Preview of reported lost item"
                          style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--primary)' }}
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          aria-label="Remove uploaded image"
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Remove image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <label
                          htmlFor="lost-photo-upload"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            fontSize: '13.5px',
                            fontWeight: 600,
                            minHeight: '44px'
                          }}
                        >
                          <Camera size={18} color="var(--primary)" /> Take Photo / Select Image
                          <input
                            id="lost-photo-upload"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageChange}
                            aria-labelledby="lost-photo-label"
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          Max 10MB • JPG, PNG, WEBP
                        </span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-submit" disabled={submitting} style={{ minHeight: '44px' }}>
                    {submitting ? 'Submitting Report...' : 'Submit Lost Item Report'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReportLost;
