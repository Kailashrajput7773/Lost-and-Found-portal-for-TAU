import React, { useState } from 'react';
import axios from 'axios';
import VoiceRecorder from './VoiceRecorder';
import AudioPlayer from './AudioPlayer';

const HANDOVER_STATIONS = [
  'University Central Library Helpdesk',
  'Main Campus Security Gate 1',
  'Student Welfare Dean Office (Admin Block)',
  'Hostel Block 1 & 2 Warden Office',
  'Sports Complex Help Center'
];

const ClaimModal = ({ item, user, onClose, onSuccess }) => {
  const [claimantName, setClaimantName] = useState(user?.username || '');
  const [claimantRoll, setClaimantRoll] = useState(user?.roll || '');
  const [claimantContact, setClaimantContact] = useState(user?.phone || user?.email || '');
  const [answer, setAnswer] = useState('');
  const [claimAudio, setClaimAudio] = useState(null);
  const [station, setStation] = useState(item?.handoverStation || HANDOVER_STATIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!claimantName.trim() || !claimantContact.trim() || !answer.trim()) {
      setError('Please fill in your name, contact details, and verification answer.');
      return;
    }

    setSubmitting(true);
    try {
      let audioUri = '';
      if (claimAudio instanceof Blob) {
        audioUri = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(claimAudio);
        });
      }

      const res = await axios.post(`http://localhost:5001/api/items/${item._id || item.id}/claim`, {
        claimantName,
        claimantRoll,
        claimantEmail: user?.email || '',
        claimantContact,
        answer,
        audio: audioUri,
        station
      });

      if (res.data.ok) {
        setSubmitted(true);
        if (onSuccess) onSuccess(res.data.claim);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit verification claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content claim-modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {!submitted ? (
          <>
            <div className="claim-modal-header">
              <span className="pill pill-found" style={{ marginBottom: '8px' }}>
                🔐 Secure Verification Claim
              </span>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: 'var(--text-heading)' }}>
                Claim Item: {item.name}
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)' }}>
                To prevent fraud and protect students, provide proof of ownership below.
              </p>
            </div>

            <div className="claim-item-preview">
              {item.img ? (
                <img src={`http://localhost:5001${item.img}`} alt={item.name} className="claim-preview-img" />
              ) : (
                <div className="claim-preview-fallback">📦</div>
              )}
              <div className="claim-preview-details">
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14.5px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Category: <strong>{item.category}</strong> • Found at: <strong>{item.location}</strong>
                </div>
              </div>
            </div>

            {item.audio && (
              <div style={{ marginBottom: '16px' }}>
                <AudioPlayer audioSrc={item.audio} title="Finder's Audio Note" />
              </div>
            )}

            {error && (
              <div className="auth-alert-error" style={{ marginBottom: '16px' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form-grid">
              {item.verificationQuestion ? (
                <div className="verification-prompt-box">
                  <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '13px', marginBottom: '4px' }}>
                    ❓ Secret Question from Reporter:
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic' }}>
                    "{item.verificationQuestion}"
                  </div>
                </div>
              ) : (
                <div className="verification-prompt-box">
                  <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '13px', marginBottom: '4px' }}>
                    🛡️ Proof of Ownership Required:
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Describe unique identifiers (e.g., lock screen wallpaper, internal stickers, exact scratches, contents inside).
                  </div>
                </div>
              )}

              <div className="field">
                <label>Your Verification Answer / Proof Details *</label>
                <textarea
                  className="input"
                  rows="3"
                  placeholder="Provide precise details only the true owner would know..."
                  required
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                />
              </div>

              <div className="field-grid-2">
                <div className="field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={claimantName}
                    onChange={e => setClaimantName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Roll Number (TAU)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 122311520112"
                    value={claimantRoll}
                    onChange={e => setClaimantRoll(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Contact Phone / Email *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Where the finder/moderator can contact you"
                  required
                  value={claimantContact}
                  onChange={e => setClaimantContact(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Preferred Safe Campus Handover Station *</label>
                <select
                  className="select"
                  value={station}
                  onChange={e => setStation(e.target.value)}
                >
                  {HANDOVER_STATIONS.map((st, i) => (
                    <option key={i} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Claimant Voice Message Recorder */}
              <div className="field">
                <VoiceRecorder
                  onAudioChange={setClaimAudio}
                  label="Record Voice Explanation (Optional)"
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary-pill"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-pill"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Claim...' : 'Submit Claim for Review 🤝'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="claim-success-box">
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', color: 'var(--text-heading)' }}>
              Claim Successfully Submitted!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 20px' }}>
              Your verification proof was recorded. The finder and university moderators will review your answer. Once approved, a <strong>secure 6-digit Handover OTP</strong> will be generated for your exchange at <strong>{station}</strong>.
            </p>
            <button className="btn-primary-pill" onClick={onClose}>
              Done / Return to Listings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimModal;
