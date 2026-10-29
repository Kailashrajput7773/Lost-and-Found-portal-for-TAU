import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, Phone, Mail, MapPin, X, CheckCircle2 } from 'lucide-react';

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null); // 'safety' | 'privacy' | 'terms' | null

  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  return (
    <>
      <footer className="footer" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: '48px 0 24px 0' }}>
        <div className="container">
          <div className="footer-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '36px' }}>
            
            {/* Brand Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <img
                  src="/apollo-university-transparent.png"
                  alt="The Apollo University"
                  style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
                />
                <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }}></div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-heading)', lineHeight: 1.2 }}>
                    Lost &amp; Found Hub
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Student Welfare Desk
                  </div>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: 1.6, margin: 0, maxWidth: '320px' }}>
                The official campus lost and found network for The Apollo University students, faculty, and campus staff.
              </p>
            </div>

            {/* Quick Links Column */}
            <div>
              <div style={{ color: 'var(--text-heading)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Portal Navigation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home Portal</Link>
                <Link to="/listings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Browse Active Items</Link>
                <Link to="/report-lost" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Report Lost Item</Link>
                <Link to="/report-found" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Report Found Item</Link>
                <Link to="/safetag" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SafeTag™ QR Protection</Link>
                <Link to="/reunited" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Reunited &amp; Reviews</Link>
              </div>
            </div>

            {/* Help & Safety Column */}
            <div>
              <div style={{ color: 'var(--text-heading)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Trust &amp; Guidelines
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <button
                  onClick={() => setActiveModal('safety')}
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13.5px' }}
                >
                  Campus Safety Guidelines
                </button>
                <button
                  onClick={() => setActiveModal('privacy')}
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13.5px' }}
                >
                  Student Privacy Policy
                </button>
                <button
                  onClick={() => setActiveModal('terms')}
                  style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13.5px' }}
                >
                  Terms of Service &amp; Rules
                </button>
                <Link to="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, marginTop: '4px' }}>
                  Admin Moderation Portal →
                </Link>
              </div>
            </div>

            {/* Campus Contact Column */}
            <div>
              <div style={{ color: 'var(--text-heading)', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Campus Contact Desk
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span>Chittoor Main Campus, Andhra Pradesh</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="var(--primary)" />
                  <a href="tel:+918772288888" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>+91 877 228 8888</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--primary)" />
                  <a href="mailto:welfare@apollo.edu.in" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>welfare@apollo.edu.in</a>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div
            style={{
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '12.5px',
              color: 'var(--text-light)'
            }}
          >
            <div>
              © {new Date().getFullYear()} The Apollo University. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
              <span>All Systems Operational • Real-Time Campus Network</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ----------------------------------------------------------------------
         Interactive Policy & Guidelines Modal
         ---------------------------------------------------------------------- */}
      {activeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-dialog-title"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: 'var(--shadow-card-hover)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                minWidth: '44px',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            {/* Safety Guidelines Modal */}
            {activeModal === 'safety' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Shield size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                    Campus Safety &amp; Handover Guidelines
                  </h3>
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0 }}>
                    To ensure safe, trustworthy item reunions across The Apollo University:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Meet in Public Campus Spaces:</strong> Conduct handovers during daytime at official spots like the Central Library Desk or Main Security Gate.</li>
                    <li><strong>Verify Distinct Details:</strong> Ask for unique proofs such as serial numbers, screen wallpapers, or distinctive markings before releasing high-value items.</li>
                    <li><strong>Never Demand Financial Rewards:</strong> Campus returns are a community welfare initiative; monetary extortion or ransom demands will lead to immediate disciplinary and admin ban.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Privacy Policy Modal */}
            {activeModal === 'privacy' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Lock size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                    Student Privacy Policy
                  </h3>
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0 }}>
                    We value and protect the privacy of all university members:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Contact Shielding:</strong> Personal phone numbers and campus emails are protected until ownership is successfully validated.</li>
                    <li><strong>No Public Scraping:</strong> Student roll numbers and private identity documents are shielded from external indexing.</li>
                    <li><strong>Data Retention:</strong> Resolved listings are archived, and unnecessary personal data is pruned systematically.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Terms of Service Modal */}
            {activeModal === 'terms' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <FileText size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)' }}>
                    Terms of Service &amp; Rules
                  </h3>
                </div>
                <div style={{ fontSize: '13.5px', color: 'var(--text-body)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0 }}>
                    By using the Lost &amp; Found Hub, all users agree to adhere to campus conduct:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong>Honest Reporting:</strong> Submitting fake reports, fraudulent claims, or prank items is strictly prohibited.</li>
                    <li><strong>Prompt Deposition:</strong> Found items should be deposited with building security or returned within a reasonable timeframe.</li>
                    <li><strong>Moderation Enforcement:</strong> Campus moderators hold full authority to suspend, investigate, or ban accounts violating guidelines.</li>
                  </ul>
                </div>
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
