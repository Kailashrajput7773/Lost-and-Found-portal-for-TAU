import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode, Printer, Download, Sparkles, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

const SafeTag = ({ user }) => {
  const [itemName, setItemName] = useState('MacBook Pro / Laptop');
  const [ownerName, setOwnerName] = useState(user?.name || user?.fullName || '');
  const [rollNumber, setRollNumber] = useState(user?.roll || '');
  const [contact, setContact] = useState(user?.phone || user?.email || '');
  const [returnNote, setReturnNote] = useState('Please return to Central Library front desk or call me.');
  const [qrUrl, setQrUrl] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    // Generate QR code encoding return instructions or contact
    const payload = `THE APOLLO UNIVERSITY SAFETAG\nItem: ${itemName}\nOwner: ${ownerName || 'TAU Student'}\nRoll: ${rollNumber || 'N/A'}\nContact: ${contact}\nInstructions: ${returnNote}\nPortal: ${window.location.origin}/report-found`;

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#0f766e', // TAU Teal
        light: '#ffffff'
      }
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error("Error generating QR:", err));
  }, [itemName, ownerName, rollNumber, contact, returnNote]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `TAU-SafeTag-${itemName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  return (
    <section className="section safetag-section">
      <div className="container">
        {/* Header */}
        <div className="section-header" style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(13, 148, 136, 0.1)', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
            <Sparkles size={16} /> Preventative Campus Protection
          </div>
          <h1 className="section-title">Campus SafeTag™ QR Generator</h1>
          <p className="section-desc">
            Generate and print a personalized waterproof QR sticker for your laptop, wallet, charger, or backpack. If misplaced on campus, anyone who scans it can return it immediately!
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
          {/* Form Configuration */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--primary)" /> 1. Configure Your SafeTag
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="field-label">Valuable Item Name *</label>
                <select
                  className="select"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                >
                  <option>MacBook Pro / Laptop</option>
                  <option>AirPods / Earbuds Case</option>
                  <option>Backpack / College Bag</option>
                  <option>Student ID Card Holder & Wallet</option>
                  <option>Scientific Calculator</option>
                  <option>Room Keys & Bike Keys</option>
                  <option>Course Notes / Binder</option>
                  <option>Insulated Water Bottle</option>
                  <option>Sports Equipment</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label">Your Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Kailash R."
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">Student Roll No.</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 122311520111"
                    value={rollNumber}
                    onChange={e => setRollNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Direct Contact (Phone or Apollo Email) *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. +91 98765 43210 or student@apollo.edu.in"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label">Return Location / Safe Deposit Note</label>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="e.g. If found, please return to Central Library Desk or call me."
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-action"
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Printer size={18} /> Print Sticker
                </button>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="btn-action"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px 18px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Download size={18} /> Save QR
                </button>
              </div>
            </div>
          </div>

          {/* Sticker Preview Badge (Printable Area) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>LIVE STICKER PREVIEW (2.5" x 3.5")</span>
              <span style={{ fontSize: '12px', background: 'var(--bg-tag)', padding: '3px 8px', borderRadius: '6px' }}>Print Ready</span>
            </div>

            <div
              id="safetag-printable"
              ref={printRef}
              style={{
                background: 'linear-gradient(145deg, #ffffff, #f0fdfa)',
                color: '#0f172a',
                border: '2px dashed #0d9488',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 12px 30px rgba(13, 148, 136, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Header inside tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px', color: '#0f766e', textTransform: 'uppercase' }}>
                    The Apollo University
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CAMPUS SAFETAG™</div>
                </div>
              </div>

              {/* QR Image */}
              <div style={{ background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #ccfbf1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '14px' }}>
                {qrUrl ? (
                  <img src={qrUrl} alt="SafeTag QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
                ) : (
                  <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCode size={48} color="#0d9488" />
                  </div>
                )}
              </div>

              {/* Tag Details */}
              <div style={{ width: '100%', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a', marginBottom: '4px' }}>
                  {itemName}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                  {ownerName ? `Belongs to: ${ownerName}` : 'Apollo University Campus Belonging'} {rollNumber && `(${rollNumber})`}
                </div>
                <div style={{ background: '#0f766e', color: '#ffffff', fontSize: '11.5px', fontWeight: 700, padding: '6px 12px', borderRadius: '6px', margin: '6px 0' }}>
                  📞 Return: {contact || 'Check Portal'}
                </div>
                {returnNote && (
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                    "{returnNote}"
                  </div>
                )}
              </div>
            </div>

            {/* How It Works Tip */}
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                <CheckCircle2 size={16} color="var(--primary)" /> How SafeTag Works:
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Stick this tag on your laptop sleeve or notebook. If misplaced anywhere around campus, fellow students or staff can scan the QR code to instantly see how to safely contact you or hand it in to security!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafeTag;
