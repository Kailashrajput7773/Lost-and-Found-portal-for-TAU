import React from 'react';
import { Link } from 'react-router-dom';
import { ApolloFlameIcon } from './ApolloLogo';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                src="/apollo-university-transparent.png"
                alt="The Apollo University"
                style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              />
              <div className="brand-divider" style={{ height: '26px' }}></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-heading)', lineHeight: 1.2 }}>Lost &amp; Found Portal</div>
                <div style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student Welfare Desk</div>
              </div>
            </div>
            <p className="footer-desc">
              Student Welfare Initiative – Connecting campus members to ensure quick and trustworthy return of lost belongings.
            </p>
          </div>

          <div>
            <div className="footer-title">Quick Links</div>
            <div className="footer-links">
              <Link to="/" className="footer-link">Home Portal</Link>
              <Link to="/listings" className="footer-link">Browse Catalog</Link>
              <Link to="/report-lost" className="footer-link">Report Lost Belonging</Link>
              <Link to="/report-found" className="footer-link">Report Found Item</Link>
            </div>
          </div>

          <div>
            <div className="footer-title">Student Desk & Help</div>
            <div className="footer-links">
              <span className="footer-link">📍 Chittoor Main Campus, AP</span>
              <span className="footer-link">📞 Campus Help: +91 877 228 8888</span>
              <span className="footer-link">✉️ welfare@apollo.edu.in</span>
              <Link to="/admin" className="footer-link" style={{ marginTop: '6px', fontWeight: 600 }}>Moderator Portal →</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} The Apollo University. All rights reserved.</div>
          <div>Lost & Found Safety Network</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
