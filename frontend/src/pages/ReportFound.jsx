import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Camera, X, ShieldCheck, Sparkles, Building, CheckCircle2 } from 'lucide-react';
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

const ReportFound = ({ user }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    contact: user?.phone || user?.email || '',
    category: 'Electronics',
    desc: '',
    location: CAMPUS_LOCATIONS[0],
    date: new Date().toISOString().split('T')[0],
    type: 'found',
    question: '', // Ownership verification challenge
    custodyHandedOver: false,
    custodyLocation: 'Central Library Front Desk',
    custodyReceiptNo: ''
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
        toast.success("Found item published live to Apollo University catalog!");
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || "Error reporting found item";
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
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌟</div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Found Item Published!
                </h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px' }}>
                  Thank you for helping reconnect a fellow Apollo University student with their belonging: <strong>"{submissionSuccess.name}"</strong>.
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
                    <Sparkles size={16} /> Check Potential Owners
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="page-header">
                  <span className="pill pill-found" style={{ marginBottom: '12px' }}>Report Found</span>
                  <h1 className="page-title">Report a Found Item</h1>
                  <p className="section-desc">Thank you for helping reconnect a student with their lost belonging!</p>
                </div>

                <form onSubmit={handleSubmit} className="form-grid">
                  <div className="field">
                    <label htmlFor="found-item-name" className="field-label">Found Item Name *</label>
                    <input
                      id="found-item-name"
                      type="text"
                      className="input"
                      placeholder="e.g., Apple AirPods Case, Scientific Calculator, Blue Water Bottle"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      style={{ minHeight: '44px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                    <div className="field">
                      <label htmlFor="found-contact" className="field-label">Your Contact (Phone / Email) *</label>
                      <input
                        id="found-contact"
                        type="text"
                        className="input"
                        placeholder="e.g., 9876543210 or student@apollo.edu.in"
                        required
                        value={formData.contact}
                        onChange={e => setFormData({...formData, contact: e.target.value})}
                        style={{ minHeight: '44px' }}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="found-date" className="field-label">Date Found *</label>
                      <input
                        id="found-date"
                        type="date"
                        className="input"
                        required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        style={{ minHeight: '44px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                    <div className="field">
                      <label htmlFor="found-category" className="field-label">Category *</label>
                      <select
                        id="found-category"
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
                      <label htmlFor="found-location" className="field-label">Location Picked Up *</label>
                      <select
                        id="found-location"
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
                  </div>

                  <div className="field">
                    <label htmlFor="found-desc" className="field-label">Description & Safe Deposit Note *</label>
                    <textarea
                      id="found-desc"
                      className="textarea"
                      placeholder="Where was it picked up? Where is it currently kept (e.g. Hostels, Library Desk, or with you)?"
                      required
                      value={formData.desc}
                      onChange={e => setFormData({...formData, desc: e.target.value})}
                    />
                  </div>

                  {/* Anti-Fraud / Ownership Challenge Field */}
                  <div className="field" style={{ background: 'rgba(13, 148, 136, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                    <label htmlFor="found-secret-question" className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                      <ShieldCheck size={18} /> Secret Verification Question (Optional - Prevents False Claims)
                    </label>
                    <input
                      id="found-secret-question"
                      type="text"
                      className="input"
                      placeholder="e.g., What sticker is on the back? / What keychain is attached?"
                      value={formData.question}
                      onChange={e => setFormData({...formData, question: e.target.value})}
                      style={{ minHeight: '44px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Claimants will be prompted to answer this question to prove ownership before claiming valuable items.
                    </span>
                  </div>

                  {/* Official Campus Custody Handover */}
                  <div className="field custody-field-card" style={{ background: formData.custodyHandedOver ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-muted)', padding: '18px', borderRadius: '12px', border: formData.custodyHandedOver ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)', transition: 'all 0.2s ease' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={formData.custodyHandedOver}
                        onChange={e => setFormData({ ...formData, custodyHandedOver: e.target.checked })}
                        style={{ width: '18px', height: '18px', marginTop: '3px', accentColor: 'var(--primary)' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-main)', fontSize: '14.5px' }}>
                          <Building size={17} color="var(--primary)" /> Deposited with Official Campus Custody
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
                          Check this if you have handed this item over to the Central Library front desk, campus security gate, or student affairs office so the owner knows exactly where to retrieve it safely.
                        </div>
                      </div>
                    </label>

                    {formData.custodyHandedOver && (
                      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                        <div>
                          <label htmlFor="found-custody-location" className="field-label" style={{ fontSize: '13px' }}>Custody Department / Desk *</label>
                          <select
                            id="found-custody-location"
                            className="select"
                            value={formData.custodyLocation}
                            onChange={e => setFormData({ ...formData, custodyLocation: e.target.value })}
                            style={{ minHeight: '42px', fontSize: '13.5px' }}
                          >
                            <option>Central Library Front Desk</option>
                            <option>Main Gate Security Office (Gate 1)</option>
                            <option>Student Affairs & Welfare Office</option>
                            <option>Boys Hostel Warden Office</option>
                            <option>Girls Hostel Warden Office</option>
                            <option>Sports Complex Control Desk</option>
                            <option>Academic Block A Information Desk</option>
                            <option>Other Campus Office</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="found-custody-receipt" className="field-label" style={{ fontSize: '13px' }}>Custody Token / Receipt # (Optional)</label>
                          <input
                            id="found-custody-receipt"
                            type="text"
                            className="input"
                            placeholder="e.g., LIB-2026-442"
                            value={formData.custodyReceiptNo}
                            onChange={e => setFormData({ ...formData, custodyReceiptNo: e.target.value })}
                            style={{ minHeight: '42px', fontSize: '13.5px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Upload with Camera & Preview */}
                  <div className="field">
                    <label id="found-photo-label" className="field-label">Upload Item Photo (Optional)</label>
                    {imagePreview ? (
                      <div style={{ position: 'relative', display: 'inline-block', marginTop: '6px' }}>
                        <img
                          src={imagePreview}
                          alt="Preview of reported found item"
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
                          htmlFor="found-photo-upload"
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
                            id="found-photo-upload"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageChange}
                            aria-labelledby="found-photo-label"
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
                    {submitting ? 'Submitting Report...' : 'Publish Found Item Report'}
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

export default ReportFound;
