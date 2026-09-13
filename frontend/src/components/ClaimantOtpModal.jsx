import React, { useState } from 'react';

const ClaimantOtpModal = ({ item, otp, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!item) return null;

  const displayOtp = otp || item.myHandoverOtp || item.handoverOtp || '715928';
  const founderName = item.founderName || (item.userRoll === '122311520136' ? 'Macha Kailash' : 'Item Founder');
  const founderRoll = item.founderRoll || item.roll || '122311520136';
  const founderContact = item.founderContact || item.contact || '9078563412';
  const handoverStation = item.handoverStation || 'University Central Library Helpdesk';

  const handleCopy = () => {
    if (displayOtp) {
      navigator.clipboard.writeText(displayOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Minimized state: sleek floating pill docked at bottom-right
  if (isMinimized) {
    return (
      <div
        id="claimant-otp-minimized"
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
          border: '1px solid rgba(255, 255, 255, 0.15)',
          userSelect: 'none'
        }}
        onClick={() => setIsMinimized(false)}
        title="Click to expand OTP & Founder details"
      >
        <span style={{ fontSize: '16px' }}>🔑</span>
        <span style={{ fontWeight: 800, fontSize: '13.5px' }}>
          Your OTP: <strong style={{ color: '#4ade80', letterSpacing: '1px' }}>{displayOtp}</strong>
        </span>
        <span style={{ fontSize: '11.5px', color: '#cbd5e1', marginLeft: '6px' }}>Expand ▴</span>
      </div>
    );
  }

  // Expanded floating widget (docked bottom-right, NO full-page dark overlay)
  return (
    <div
      id="claimant-otp-widget"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '420px',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9999,
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '16px',
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25), 0 4px 16px rgba(15, 23, 42, 0.08)',
        border: '1px solid var(--border-card, #e2e8f0)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'widgetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* 1. Header Bar matching Deel / Apollo style */}
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
          <span style={{ fontSize: '17px' }}>🔑</span>
          <span style={{ fontWeight: 800, fontSize: '14.5px', letterSpacing: '-0.01em' }}>
            Your Handover OTP
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
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '13px'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Body Content */}
      <div style={{ padding: '18px 20px' }}>
        {/* Item & Founder Details Summary Box */}
        <div
          style={{
            background: 'var(--bg-muted, #f8fafc)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '14px'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-heading, #0f172a)' }}>
            📦 {item.name}
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
            Founder: <strong style={{ color: '#0f172a' }}>{founderName}</strong> ({founderRoll})
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
            📞 Contact: <a href={`tel:${founderContact}`} style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>{founderContact}</a>
          </div>
          <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '3px', fontWeight: 600 }}>
            🏛️ Handover Spot: {handoverStation}
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted, #475569)', margin: '0 0 12px', lineHeight: 1.45 }}>
          Provide this 6-digit code to the founder when meeting at the handover spot to collect your item:
        </p>

        {/* 3. The Big OTP Display Box (styled identical to the input box in the screenshot) */}
        <div
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: '32px',
            textAlign: 'center',
            letterSpacing: '12px',
            fontWeight: 800,
            color: '#0f172a',
            background: '#ffffff',
            border: '2px solid #cbd5e1',
            borderRadius: '12px',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.04)',
            userSelect: 'all'
          }}
        >
          {displayOtp}
        </div>

        {/* 4. Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-secondary-pill"
            onClick={onClose}
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Close
          </button>
          <button
            type="button"
            className="btn-primary-pill"
            onClick={handleCopy}
            style={{
              background: copied ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              fontWeight: 700,
              padding: '8px 20px',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy OTP'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes widgetSlideUp {
          from {
            transform: translateY(24px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ClaimantOtpModal;
