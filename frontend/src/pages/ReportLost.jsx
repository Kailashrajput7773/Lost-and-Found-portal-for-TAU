import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import VoiceRecorder from '../components/VoiceRecorder';

const HANDOVER_STATIONS = [
  'University Central Library Helpdesk',
  'Main Campus Security Gate 1',
  'Student Welfare Dean Office (Admin Block)',
  'Hostel Block 1 & 2 Warden Office',
  'Sports Complex Help Center'
];

const ReportLost = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    roll: user?.roll || '',
    contact: user?.phone || user?.email || '',
    category: 'Electronics',
    desc: '',
    location: 'Library',
    date: new Date().toISOString().slice(0, 10),
    type: 'lost',
    verificationQuestion: '',
    handoverStation: HANDOVER_STATIONS[0]
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Smart Candidate Matches
  const [matches, setMatches] = useState([]);
  const [showMatches, setShowMatches] = useState(false);

  // Debounced similarity matching against "found" items
  useEffect(() => {
    if (!formData.name || formData.name.trim().length < 3) {
      setMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({
          name: formData.name,
          category: formData.category,
          location: formData.location,
          type: 'lost'
        }).toString();
        const res = await axios.get(`http://localhost:5001/api/items/match?${query}`);
        if (res.data.ok && res.data.matches.length > 0) {
          setMatches(res.data.matches);
          setShowMatches(true);
        } else {
          setMatches([]);
        }
      } catch (e) {
        // silent catch
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.name, formData.category, formData.location]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append('userRoll', formData.roll || user?.roll || '');
    data.append('userEmail', user?.email || '');
    if (image) data.append('image', image);
    if (audioFile) data.append('audio', audioFile, 'lost-voice-note.webm');

    try {
      const res = await axios.post('http://localhost:5001/api/items', data);
      if (res.data.ok) {
        alert("Lost item report submitted successfully! Once approved by admin, it will appear on the catalog.");
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
              <span className="pill pill-lost" style={{ marginBottom: '12px' }}>
                ❓ Report Lost Item
              </span>
              <h1 className="page-title">Report a Lost Item</h1>
              <p className="section-desc">
                Fill in the details below so campus finders and moderators can identify your item.
              </p>
            </div>

            {/* Smart Matching Alert Banner */}
            {matches.length > 0 && (
              <div className="smart-match-banner" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                <div className="smart-match-header">
                  <div>
                    <span style={{ fontSize: '18px', marginRight: '6px' }}>🎉</span>
                    <strong>Potential Matches Found!</strong> {matches.length} {matches.length === 1 ? 'item was' : 'items were'} found on campus that match your report!
                  </div>
                  <button
                    type="button"
                    className="btn-subtle-pill"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => setShowMatches(!showMatches)}
                  >
                    {showMatches ? 'Hide Matches ▴' : 'View Matches ▾'}
                  </button>
                </div>

                {showMatches && (
                  <div className="smart-match-list">
                    {matches.map(m => (
                      <div className="smart-match-card" key={m._id || m.id}>
                        {m.img ? (
                          <img src={`http://localhost:5001${m.img}`} alt={m.name} className="smart-match-thumb" />
                        ) : (
                          <div className="smart-match-thumb-placeholder">📦</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-heading)' }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Found at: <strong>{m.location}</strong> on <strong>{m.date}</strong>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-body)' }}>
                            {m.desc.slice(0, 90)}...
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                          <span className="pill pill-found" style={{ fontSize: '11px' }}>
                            {m.matchScore}% Match
                          </span>
                          <Link
                            to={`/listings?q=${encodeURIComponent(m.name)}`}
                            className="btn-primary-pill"
                            style={{ fontSize: '11.5px', padding: '4px 10px' }}
                            target="_blank"
                          >
                            Claim Item ↗
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-grid">
              <div className="field">
                <label>Item Name *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Wireless Earbuds, HP Laptop, Casio Watch, Scientific Calculator"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="field-grid-2">
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

              <div className="field-grid-2">
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
                <label>Campus Zone / Last Seen Location *</label>
                <select
                  className="select"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                >
                  <option>Library</option>
                  <option>Academic Block</option>
                  <option>Cafeteria</option>
                  <option>Ground</option>
                  <option>Hostel</option>
                  <option>Main Gate</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="field">
                <label>Description & Distinguishing Features *</label>
                <textarea
                  className="textarea"
                  rows="3"
                  placeholder="Describe color, brand, stickers, scratches, or any identifying marks..."
                  required
                  value={formData.desc}
                  onChange={e => setFormData({...formData, desc: e.target.value})}
                />
              </div>

              {/* Secret Verification Detail */}
              <div className="field">
                <label>
                  🔒 Secret Ownership Detail (Only you know)
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '12px', marginLeft: '6px' }}>
                    (Used to verify against finder notes)
                  </span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Small crack on bottom left edge, wallpaper is blue car"
                  value={formData.verificationQuestion}
                  onChange={e => setFormData({...formData, verificationQuestion: e.target.value})}
                />
              </div>

              {/* Preferred Handover Station */}
              <div className="field">
                <label>🏛️ Preferred Campus Handover Station *</label>
                <select
                  className="select"
                  value={formData.handoverStation}
                  onChange={e => setFormData({...formData, handoverStation: e.target.value})}
                >
                  {HANDOVER_STATIONS.map((st, i) => (
                    <option key={i} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Upload Photo of Item (Optional)</label>
                <input
                  type="file"
                  className="input"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img
                      src={imagePreview}
                      alt="Uploaded preview"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                    />
                  </div>
                )}
              </div>

              {/* Voice Message Recorder */}
              <div className="field">
                <VoiceRecorder
                  onAudioChange={setAudioFile}
                  label="Lost Item Voice Note (Describe how and where you lost it)"
                />
              </div>

              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Submitting Report...' : 'Publish Lost Item Report ❓'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReportLost;
