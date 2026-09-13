import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FloatingHandoverWidget = ({ item, onClose, onSuccess }) => {
  const [itemData, setItemData] = useState(item);
  const [otpInput, setOtpInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch full item details
  useEffect(() => {
    const id = item?._id || item?.id;
    if (id) {
      axios.get(`http://localhost:5001/api/items/${id}`)
        .then(res => {
          if (res.data?.ok && res.data?.item) {
            setItemData(res.data.item);
          }
        })
        .catch(() => {});
    }
  }, [item]);

  if (!itemData) return null;

  const approvedClaim = Array.isArray(itemData.claims)
    ? itemData.claims.find(c => c.status === 'approved') || itemData.claims[0]
    : null;

  const claimantName = approvedClaim?.claimantName || itemData.claimedBy || 'Item Claimer';
  const claimantRoll = approvedClaim?.claimantRoll ? `(${approvedClaim.claimantRoll})` : '';
  const handoverStation = itemData.handoverStation || 'University Central Library Helpdesk';

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otpInput.trim()) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const id = itemData._id || itemData.id;
      const res = await axios.post(`http://localhost:5001/api/items/${id}/verify-handover`, {
        otp: otpInput.trim()
      });

      if (res.data.ok) {
        setSuccessMsg('🎉 Handover confirmed! Item marked as Reunited.');
        if (onSuccess) onSuccess(res.data.item);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Incorrect Handover OTP. Please verify with the claimant.');
    } finally {
      setLoading(false);
    }
  };

  // Minimized state
  if (isMinimized) {
    return (
      <div
        id="floating-handover-minimized"
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '9999px',
          padding: '12px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)',
          cursor: 'pointer',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
        onClick={() => setIsMinimized(false)}
        title="Click to expand Handover Verification"
      >
        <span style={{ fontSize: '16px' }}>🔑</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px' }}>
          Handover: <strong style={{ color: '#4ade80' }}>{itemData.name}</strong>
        </span>
        <span style={{ fontSize: '11.5px', color: '#cbd5e1', marginLeft: '6px' }}>Expand ▴</span>
      </div>
    );
  }

  // Expanded clean widget
  return (
    <div
      id="floating-handover-widget"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '400px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9999,
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '16px',
        boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)',
        border: '1px solid var(--border-card, #e2e8f0)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '13px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🔑</span>
          <span style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.01em' }}>
            Verify Handover OTP
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              width: '26px',
              height: '26px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
            title="Minimize"
          >
            ▾
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '6px',
              width: '26px',
              height: '26px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px' }}>
        {/* Item & Claimant Brief */}
        <div
          style={{
            background: 'var(--bg-muted, #f8fafc)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-heading, #0f172a)' }}>
            📦 {itemData.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '3px' }}>
            Claimant: <strong style={{ color: '#0f172a' }}>{claimantName}</strong> {claimantRoll}
          </div>
          <div style={{ fontSize: '11.5px', color: '#0369a1', marginTop: '2px' }}>
            🏛️ Handover Spot: {handoverStation}
          </div>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-muted, #475569)', margin: '0 0 12px', lineHeight: 1.45 }}>
          Enter the 6-digit code shown on the claimant's screen to finalize the exchange:
        </p>

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: 600 }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <input
            type="text"
            maxLength="6"
            placeholder="· · · · · ·"
            value={otpInput}
            onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoFocus
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '26px',
              textAlign: 'center',
              letterSpacing: '8px',
              fontWeight: 800,
              color: '#0f172a',
              background: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '10px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="button"
              className="btn-secondary-pill"
              onClick={onClose}
              style={{ padding: '7px 14px', fontSize: '12.5px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || otpInput.length < 6}
              className="btn-primary-pill"
              style={{
                background: otpInput.length === 6 ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : '#94a3b8',
                color: '#ffffff',
                fontWeight: 700,
                padding: '7px 18px',
                fontSize: '12.5px',
                cursor: (loading || otpInput.length < 6) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Mark Reunited 🎉'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FloatingHandoverWidget;
