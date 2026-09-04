import React from 'react';

const PrintPosterModal = ({ item, onClose }) => {
  if (!item) return null;

  const isLost = item.type === 'lost';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    `http://localhost:5173/listings?q=${encodeURIComponent(item.name)}`
  )}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content poster-modal-box" onClick={e => e.stopPropagation()}>
        <div className="poster-modal-actions no-print">
          <button className="btn-secondary-pill" onClick={onClose}>
            ✕ Close
          </button>
          <button className="btn-primary-pill" onClick={handlePrint}>
            🖨️ Print / Save Notice Poster
          </button>
        </div>

        {/* Printable A4 Poster Canvas */}
        <div className="printable-poster-sheet">
          <div className="poster-topbar">
            <div className="poster-org">
              <span className="poster-logo-badge">TAU</span>
              <div>
                <div className="poster-uni-name">THE APOLLO UNIVERSITY</div>
                <div className="poster-sub">Office of Student Welfare • Campus Lost & Found Network</div>
              </div>
            </div>
            <div className="poster-date">
              Date: {item.date || new Date().toISOString().slice(0, 10)}
            </div>
          </div>

          <div className={`poster-headline-banner ${isLost ? 'banner-lost' : 'banner-found'}`}>
            {isLost ? '🚨 LOST ITEM NOTICE 🚨' : '📢 FOUND ITEM NOTICE 📢'}
          </div>

          <div className="poster-title-section">
            <h1 className="poster-item-title">{item.name}</h1>
            <div className="poster-meta-line">
              <span>Category: <strong>{item.category}</strong></span>
              <span>•</span>
              <span>Reported Location: <strong>{item.location}</strong></span>
              <span>•</span>
              <span>Status: <strong>Active Campus Notice</strong></span>
            </div>
          </div>

          <div className="poster-body-grid">
            <div className="poster-visual-box">
              {item.img ? (
                <img
                  src={`http://localhost:5000${item.img}`}
                  alt={item.name}
                  className="poster-item-img"
                />
              ) : (
                <div className="poster-no-img">
                  <span style={{ fontSize: '54px' }}>📦</span>
                  <span>Photo Not Provided</span>
                </div>
              )}
            </div>

            <div className="poster-desc-box">
              <h3 className="poster-section-heading">Item Description & Identifying Marks:</h3>
              <p className="poster-desc-text">
                {item.desc || 'No specific description provided. Please verify details with campus security or library desk.'}
              </p>

              <div className="poster-station-box">
                <div className="poster-station-title">🏛️ Designated Safe Handover Station:</div>
                <div className="poster-station-name">
                  {item.handoverStation || 'University Central Library Helpdesk / Security Gate 1'}
                </div>
                <div className="poster-station-sub">
                  Do not arrange handovers in unverified private areas. Handover receipts must be verified via portal OTP.
                </div>
              </div>
            </div>
          </div>

          {/* Poster Footer with Verification QR Code */}
          <div className="poster-footer">
            <div className="poster-qr-block">
              <img
                src={qrUrl}
                alt="Scan to view online report"
                className="poster-qr-img"
              />
              <div className="poster-qr-text">
                <strong>SCAN WITH PHONE</strong>
                <span>View live listing, photos & claim online</span>
              </div>
            </div>

            <div className="poster-claim-instructions">
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '2px' }}>
                How to Claim or Return:
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                1. Visit the portal at <strong>apollo-lostfound.edu</strong> or scan the QR code.<br />
                2. Click <strong>"Claim Item"</strong> and provide verification answers.<br />
                3. Exchange safely at the University Library Desk with 6-digit OTP verification.
              </p>
            </div>
          </div>

          <div className="poster-disclaimer">
            The Apollo University Official Notice • For campus display only • Please do not deface this notice.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPosterModal;
