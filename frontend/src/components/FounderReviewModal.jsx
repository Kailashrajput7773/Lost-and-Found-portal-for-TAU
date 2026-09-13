import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioPlayer from './AudioPlayer';

const FounderReviewModal = ({ item, onClose, onUpdate }) => {
  const [modalItem, setModalItem] = useState(item);
  const [loadingAction, setLoadingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // OTP Verification state
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  // Fetch freshest item data from API
  useEffect(() => {
    if (!item) return;
    const itemId = item._id || item.id;
    axios.get(`http://localhost:5001/api/items/${itemId}`)
      .then(res => {
        if (res.data.ok && res.data.item) {
          setModalItem(res.data.item);
        }
      })
      .catch(() => {});
  }, [item]);

  if (!modalItem) return null;

  const currentItem = modalItem;
  const claims = Array.isArray(currentItem.claims) ? currentItem.claims : [];
  const pendingClaims = claims.filter(c => c.status === 'pending');

  const handleClaimAction = async (claimId, action) => {
    setLoadingAction(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await axios.patch(`http://localhost:5001/api/items/${currentItem._id || currentItem.id}/claim/${claimId}`, {
        action
      });

      if (res.data.ok) {
        if (action === 'approve') {
          setStatusMessage(`🎉 Claim approved successfully! 6-digit Handover OTP: ${res.data.otp || currentItem.handoverOtp}`);
        } else {
          setStatusMessage('Claim rejected.');
        }
        if (res.data.item) {
          setModalItem(res.data.item);
        }
        if (onUpdate) onUpdate(res.data.item || currentItem);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || `Failed to ${action} claim.`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) return;

    setOtpVerifying(true);
    setErrorMessage(null);
    try {
      const res = await axios.post(`http://localhost:5001/api/items/${currentItem._id || currentItem.id}/verify-handover`, {
        otp: otpInput.trim()
      });

      if (res.data.ok) {
        setOtpSuccess(true);
        setStatusMessage('🎉 Handover confirmed! Item is now marked as Reunited.');
        if (res.data.item) {
          setModalItem(res.data.item);
        }
        if (onUpdate) onUpdate(res.data.item || { ...currentItem, status: 'reunited', handoverOtp: '' });
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Invalid OTP code. Please check with the claimant.');
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content claim-modal-box"
        style={{ maxWidth: '680px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Modal Header */}
        <div className="claim-modal-header" style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="pill pill-found" style={{ fontWeight: 700 }}>
              🛡️ Founder Claim Review &amp; Approval
            </span>
            <span className={`pill ${currentItem.status === 'reunited' ? 'pill-found' : 'pill-lost'}`}>
              {currentItem.status === 'reunited' ? '🎉 Reunited' : `Incoming Claims (${claims.length})`}
            </span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '21px', color: 'var(--text-heading)' }}>
            Review &amp; Approve Claims for: {currentItem.name}
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)' }}>
            As the finder, inspect claimant answers below. Click the green <strong>"✓ Approve Claim"</strong> button to accept ownership and generate the secure Handover OTP.
          </p>
        </div>

        {/* Item Summary Card */}
        <div className="claim-item-preview" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
          {currentItem.img ? (
            <img src={`http://localhost:5001${currentItem.img}`} alt={currentItem.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
          ) : (
            <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
              📦
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>{currentItem.name}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              📍 Found at: <strong>{currentItem.location}</strong> • Category: <strong>{currentItem.category}</strong>
            </div>
            {currentItem.handoverStation && (
              <div style={{ fontSize: '12.5px', color: 'var(--brand-primary)', fontWeight: 600, marginTop: '3px' }}>
                🏛️ Drop-off Station: {currentItem.handoverStation}
              </div>
            )}
            {currentItem.verificationQuestion && (
              <div style={{ fontSize: '12px', color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                ❓ Your Question: <em>"{currentItem.verificationQuestion}"</em>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alerts */}
        {statusMessage && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
            {statusMessage}
          </div>
        )}
        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Active OTP Banner (When an approved claim exists) */}
        {currentItem.handoverOtp && currentItem.status !== 'reunited' && (
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: '#047857' }}>
                  ✓ Claim Approved • Ready for Handover
                </div>
                <div style={{ fontSize: '14px', color: '#065f46', marginTop: '2px' }}>
                  6-digit Handover OTP generated for claimant:
                </div>
              </div>
              <div style={{
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '4px',
                color: '#065f46',
                background: '#ffffff',
                padding: '6px 18px',
                borderRadius: '8px',
                border: '2px dashed #10b981'
              }}>
                {currentItem.handoverOtp}
              </div>
            </div>

            <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#047857', lineHeight: 1.4 }}>
              💡 <em>Meet the claimant at <strong>{currentItem.handoverStation || "University Central Library Helpdesk"}</strong>. Once they verify and show you their OTP code, enter it below to mark the item as successfully Reunited!</em>
            </p>

            {/* OTP Verification Input Form */}
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Enter Claimer's 6-digit OTP"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '2px'
                }}
              />
              <button
                type="submit"
                className="btn-primary-pill"
                style={{ background: '#059669', color: '#ffffff', fontWeight: 700, padding: '10px 22px', fontSize: '14px' }}
                disabled={otpVerifying || otpInput.length < 6}
              >
                {otpVerifying ? 'Verifying...' : 'Finalize Handover 🎉'}
              </button>
            </form>
          </div>
        )}

        {/* Claims Section */}
        <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Submitted Claims ({claims.length})</span>
          {pendingClaims.length > 0 && (
            <span style={{ fontSize: '12.5px', color: '#b45309', fontWeight: 700, background: '#fef3c7', padding: '3px 10px', borderRadius: '12px' }}>
              {pendingClaims.length} awaiting your approval
            </span>
          )}
        </h3>

        {claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-main)', borderRadius: '10px', border: '1px dashed var(--border-subtle)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '15px' }}>No claims submitted yet</div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              When a student claims this item and answers your verification question, their answer will appear here for your approval.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {claims.map((claim, idx) => {
              const claimId = claim.id || claim._id;
              const isApproved = claim.status === 'approved';
              const isRejected = claim.status === 'rejected';
              const isPending = claim.status === 'pending';

              return (
                <div
                  key={claimId || idx}
                  style={{
                    background: isApproved ? 'rgba(16, 185, 129, 0.06)' : isRejected ? 'rgba(239, 68, 68, 0.04)' : '#ffffff',
                    border: isApproved ? '2px solid #10b981' : isPending ? '2px solid #f59e0b' : '1px solid var(--border-card)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: isPending ? '0 4px 12px rgba(245, 158, 11, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👤 {claim.claimantName}</span>
                        {claim.claimantRoll && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            (Roll: {claim.claimantRoll})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📞 Contact: <strong>{claim.claimantContact}</strong> • 🏛️ Handover: <strong>{claim.station}</strong>
                      </div>
                    </div>

                    <span className={`pill ${isApproved ? 'pill-found' : isRejected ? 'pill-subtle' : 'pill-lost'}`} style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                      {isApproved ? '✓ APPROVED' : isRejected ? '✕ REJECTED' : '⏳ PENDING REVIEW'}
                    </span>
                  </div>

                  {/* Submitted Answer Proof Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', margin: '8px 0 12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                      Claimant's Verification Answer / Proof:
                    </div>
                    <div style={{ fontSize: '14.5px', color: '#1e293b', fontWeight: 600, lineHeight: 1.45 }}>
                      "{claim.answer}"
                    </div>
                    {claim.audio && (
                      <div style={{ marginTop: '10px' }}>
                        <AudioPlayer audioSrc={claim.audio} title="Claimant Voice Verification Note" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons for Founder */}
                  {isPending && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                      <button
                        type="button"
                        className="btn-primary-pill"
                        style={{
                          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '14px',
                          padding: '11px 24px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleClaimAction(claimId, 'approve')}
                        disabled={loadingAction}
                      >
                        ✓ Approve &amp; Generate OTP
                      </button>

                      <button
                        type="button"
                        className="btn-subtle-pill"
                        style={{
                          fontSize: '13px',
                          padding: '10px 18px',
                          color: '#dc2626',
                          border: '1px solid rgba(220, 38, 38, 0.35)',
                          fontWeight: 600
                        }}
                        onClick={() => handleClaimAction(claimId, 'reject')}
                        disabled={loadingAction}
                      >
                        ✕ Reject Claim
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✓</span> You approved this claim. The Handover OTP is active above.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary-pill" onClick={onClose} style={{ padding: '8px 20px', fontSize: '13.5px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FounderReviewModal;
