import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, X, Sparkles, MapPin, Calendar, Shield, Phone, HelpCircle } from 'lucide-react';
import { getMediaUrl } from '../services/api';

const NoticeboardFlyerModal = ({ item, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const flyerRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    const itemUrl = `${window.location.origin}/items/${item._id || item.id}`;
    QRCode.toDataURL(itemUrl, {
      width: 180,
      margin: 1.5,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating flyer QR:", err));
  }, [item]);

  if (!item) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLost = item.type === 'lost';
  const itemUrl = `${window.location.origin}/items/${item._id || item.id}`;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Campus Noticeboard Flyer">
      <div className="flyer-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Action Header bar (hidden during print) */}
        <div className="flyer-actions-bar no-print">
          <div className="flyer-actions-title">
            <Sparkles size={16} /> Campus Noticeboard Printable Flyer (A4 Format)
          </div>
          <div className="flyer-actions-buttons">
            <button type="button" className="btn-secondary btn-sm" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <Printer size={15} /> Print Flyer (A4)
            </button>
            <button type="button" className="btn-icon" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Flyer Sheet */}
        <div className="printable-flyer-sheet" ref={flyerRef}>
          {/* Top Apollo University Official Header */}
          <div className="flyer-header">
            <div className="flyer-header-crest">
              <img src="/apollo-university-transparent.png" alt="Apollo University Logo" className="flyer-logo" />
            </div>
            <div className="flyer-header-text">
              <div className="flyer-univ-name">THE APOLLO UNIVERSITY</div>
              <div className="flyer-portal-name">Student Welfare &amp; Campus Security Desk • Lost &amp; Found Bulletin</div>
              <div className="flyer-campus-loc">Chittoor Campus, Andhra Pradesh</div>
            </div>
          </div>

          {/* Urgent Notice Banner */}
          <div className={`flyer-banner ${isLost ? 'banner-lost' : 'banner-found'}`}>
            <span className="banner-alert-icon">{isLost ? '🚨' : '✨'}</span>
            <span className="banner-text">
              {isLost ? 'CAMPUS LOST BELONGING NOTICE' : 'FOUND BELONGING RECOVERY NOTICE'}
            </span>
            <span className="banner-alert-icon">{isLost ? '🚨' : '✨'}</span>
          </div>

          {/* Main Content Body */}
          <div className="flyer-body">
            <h1 className="flyer-item-title">{item.name}</h1>

            <div className="flyer-tags-row">
              <span className="flyer-tag">
                <strong>Category:</strong> {item.category}
              </span>
              <span className="flyer-tag">
                <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                <strong>Date:</strong> {item.date}
              </span>
              <span className="flyer-tag flyer-tag-highlight">
                <MapPin size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                <strong>Location:</strong> {item.location}
              </span>
            </div>

            {/* Photo & Description Columns */}
            <div className="flyer-details-grid">
              <div className="flyer-photo-box">
                {item.img ? (
                  <img
                    src={getMediaUrl(item.img)}
                    alt={item.name}
                    className="flyer-photo-img"
                  />
                ) : (
                  <div className="flyer-photo-placeholder">
                    <span style={{ fontSize: '36px' }}>📦</span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>Photo not attached</span>
                  </div>
                )}
                <div className="flyer-reference-badge">Reference ID: #{String(item._id || item.id).slice(-6).toUpperCase()}</div>
              </div>

              <div className="flyer-desc-box">
                <h3 className="flyer-section-title">Item Description &amp; Distinctive Features</h3>
                <p className="flyer-desc-text">{item.desc}</p>

                {item.custodyHandedOver && (
                  <div className="flyer-custody-notice">
                    <Shield size={16} color="#0d9488" />
                    <div>
                      <strong>Official Campus Custody:</strong> Deposited safely at{' '}
                      <u>{item.custodyLocation || 'Central Library Desk'}</u>
                      {item.custodyReceiptNo && ` (Receipt Token: #${item.custodyReceiptNo})`}.
                    </div>
                  </div>
                )}

                {item.question && (
                  <div className="flyer-challenge-notice">
                    <HelpCircle size={15} color="#4f46e5" />
                    <div>
                      <strong>Anti-Fraud Verification:</strong> Finder has set an ownership challenge question on the portal to prevent fraudulent claims.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code and Quick Scan Action */}
            <div className="flyer-qr-section">
              <div className="flyer-qr-image-wrapper">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="SafeTag QR Code to Item Details" className="flyer-qr-img" />
                ) : (
                  <div style={{ width: 110, height: 110, background: '#f1f5f9' }} />
                )}
              </div>
              <div className="flyer-qr-instructions">
                <h3>Have Information or Looking to Claim?</h3>
                <p>
                  Scan this official <strong>Campus SafeTag™ QR</strong> with your smartphone camera to view verified photos, answer the security question, or notify the campus desk.
                </p>
                <div className="flyer-url-text">{itemUrl}</div>
              </div>
            </div>

            {/* Contact / Helpdesk Footer */}
            <div className="flyer-helpline-box">
              <span><strong>Campus Security Helpline:</strong> +91 877 228 8888</span>
              <span>•</span>
              <span><strong>Student Welfare Desk:</strong> support@apollo.edu.in</span>
              {item.contact && (
                <>
                  <span>•</span>
                  <span><strong>Reporter Contact:</strong> {item.contact}</span>
                </>
              )}
            </div>
          </div>

          {/* Tear-Off Strips at Bottom */}
          <div className="flyer-tear-off-section">
            <div className="flyer-cut-line">
              <span>✂️ CUT OR TEAR A SLIP BELOW FOR REFERENCE ✂️</span>
            </div>
            <div className="flyer-tear-strips">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flyer-tear-strip">
                  <div className="strip-text-vertical">
                    <strong>{isLost ? 'LOST' : 'FOUND'}: {item.name.slice(0, 18)}</strong>
                    <span>Loc: {item.location.split('(')[0].trim().slice(0, 16)}</span>
                    <span className="strip-contact">{item.contact || 'Portal: TAU Lost & Found'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeboardFlyerModal;
