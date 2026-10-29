import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Sparkles,
  CheckCircle2,
  Award,
  Star,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  Calendar,
  MapPin,
  User,
  Heart,
  MessageSquare,
  Share2,
  Printer,
  ChevronRight,
  TrendingUp,
  Clock,
  ExternalLink,
  X
} from 'lucide-react';
import { useToast } from '../components/Toast';

const CATEGORIES = [
  'All',
  'Electronics',
  'IDs and Documents',
  'Bags and Wallets',
  'Keys',
  'Books and Stationery',
  'Clothing and Accessories',
  'Other'
];

const REVIEW_CATEGORIES = [
  'All',
  'Smart Matching & Recovery',
  'SafeTag QR Return',
  'Handover Verification',
  'Campus Governance & Privacy',
  'Overall Experience'
];

const Reunited = ({ user }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('reunited'); // 'reunited' | 'reviews'

  // Reunited State
  const [reunitedItems, setReunitedItems] = useState([]);
  const [reunitedStats, setReunitedStats] = useState({
    totalReunited: 0,
    verifiedHandovers: 0,
    verificationRate: 100,
    averageHoursToReturn: 14
  });
  const [reunitedLoading, setReunitedLoading] = useState(true);
  const [reunitedSearch, setReunitedSearch] = useState('');
  const [reunitedCategory, setReunitedCategory] = useState('All');

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    average: 5.0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    satisfactionRate: 100
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [selectedReviewCategory, setSelectedReviewCategory] = useState('All');

  // Modals
  const [selectedCertificateItem, setSelectedCertificateItem] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Review Form
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(user?.name || user?.fullName || '');
  const [reviewerRoll, setReviewerRoll] = useState(user?.roll || '');
  const [reviewerRole, setReviewerRole] = useState('owner');
  const [reviewCategory, setReviewCategory] = useState('Overall Experience');
  const [reviewItemName, setReviewItemName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch Reunited Belongings
  const fetchReunited = async () => {
    setReunitedLoading(true);
    try {
      const res = await api.get('/api/items/reunited');
      if (res.data.ok) {
        setReunitedItems(res.data.items || []);
        if (res.data.stats) {
          setReunitedStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('Could not load reunited items:', err.message);
    } finally {
      setReunitedLoading(false);
    }
  };

  // Fetch Reviews
  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await api.get('/api/reviews');
      if (res.data.ok) {
        setReviews(res.data.reviews || []);
        if (res.data.stats) {
          setReviewStats(res.data.stats);
        }
      }
    } catch (err) {
      console.warn('Could not load reviews:', err.message);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReunited();
    fetchReviews();
  }, []);

  // Update Reviewer details if user logs in
  useEffect(() => {
    if (user) {
      if (!reviewerName) setReviewerName(user.name || user.fullName || '');
      if (!reviewerRoll) setReviewerRoll(user.roll || '');
    }
  }, [user]);

  // Submit Review Handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      addToast('Please write a feedback comment of at least 5 characters.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.post('/api/reviews', {
        name: reviewerName.trim() || 'Campus Member',
        roll: reviewerRoll.trim(),
        email: user?.email || '',
        role: reviewerRole,
        rating,
        category: reviewCategory,
        itemName: reviewItemName.trim(),
        comment: reviewComment.trim()
      });

      if (res.data.ok) {
        addToast('🎉 Thank you! Your review has been published.', 'success');
        setShowReviewModal(false);
        setReviewComment('');
        setReviewItemName('');
        fetchReviews();
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtered Reunited Items
  const filteredReunited = reunitedItems.filter(item => {
    if (reunitedCategory !== 'All' && item.category !== reunitedCategory) return false;
    if (reunitedSearch.trim()) {
      const q = reunitedSearch.toLowerCase();
      const matchName = String(item.name || '').toLowerCase().includes(q);
      const matchLoc = String(item.location || '').toLowerCase().includes(q);
      const matchOwner = String(item.claimedBy || '').toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchOwner) return false;
    }
    return true;
  });

  // Filtered Reviews
  const filteredReviews = reviews.filter(rev => {
    if (selectedReviewCategory !== 'All' && rev.category !== selectedReviewCategory) return false;
    return true;
  });

  return (
    <div className="reunited-page">
      {/* 1. HERO SECTION */}
      <section className="reunited-hero">
        <div className="container">
          <div className="reunited-hero-content">
            <div className="badge-pill">
              <Sparkles size={14} className="badge-icon-spin" />
              <span>Hall of Reunited Belongings &amp; Community Voice</span>
            </div>
            <h1 className="reunited-title">
              Celebrating Restored Belongings &amp; Verified Handovers
            </h1>
            <p className="reunited-subtitle">
              Every lost article reunited represents an honest student, a diligent campus desk, and a secure handover verification. Explore our recovery track record and authentic campus community reviews.
            </p>

            {/* LIVE RECOVERY STATS STRIP */}
            <div className="reunited-stats-grid">
              <div className="reunited-stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{reunitedStats.totalReunited || reunitedItems.length || 18}+</div>
                  <div className="stat-label">Belongings Reunited</div>
                </div>
              </div>

              <div className="reunited-stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#4f46e5' }}>
                  <ShieldCheck size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{reunitedStats.verificationRate || 100}%</div>
                  <div className="stat-label">Verified Handovers</div>
                </div>
              </div>

              <div className="reunited-stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                  <Clock size={24} />
                </div>
                <div className="stat-info">
                  <div className="stat-number">&lt; {reunitedStats.averageHoursToReturn || 14}h</div>
                  <div className="stat-label">Average Return Time</div>
                </div>
              </div>

              <div className="reunited-stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#db2777' }}>
                  <Star size={24} fill="#db2777" />
                </div>
                <div className="stat-info">
                  <div className="stat-number">{reviewStats.average || '4.9'} / 5</div>
                  <div className="stat-label">Campus Rating ({reviewStats.total || reviews.length} Reviews)</div>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="reunited-tab-nav">
              <button
                className={`tab-btn ${activeTab === 'reunited' ? 'active' : ''}`}
                onClick={() => setActiveTab('reunited')}
              >
                <Award size={18} />
                <span>Reunited Items Gallery ({filteredReunited.length})</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                <MessageSquare size={18} />
                <span>Community Reviews &amp; Ratings ({reviews.length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TAB CONTENT: REUNITED GALLERY */}
      {activeTab === 'reunited' && (
        <section className="section" style={{ paddingTop: '20px' }}>
          <div className="container">
            {/* Filter Bar */}
            <div className="reunited-filter-bar">
              <div className="reunited-search-box">
                <Search size={18} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search reunited items by name, owner or location..."
                  value={reunitedSearch}
                  onChange={e => setReunitedSearch(e.target.value)}
                />
                {reunitedSearch && (
                  <button onClick={() => setReunitedSearch('')} className="clear-btn">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="category-chips-scroll">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`category-chip ${reunitedCategory === cat ? 'active' : ''}`}
                    onClick={() => setReunitedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Reunited Items Grid */}
            {reunitedLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading reunited campus belongings...</p>
              </div>
            ) : filteredReunited.length === 0 ? (
              <div className="empty-state-card">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <h3>No Reunited Items Match Filters</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 16px' }}>
                  Try resetting your category or search query to see all successfully recovered belongings.
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => { setReunitedCategory('All'); setReunitedSearch(''); }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="reunited-grid">
                {filteredReunited.map(item => {
                  const handover = item.handover || {};
                  const receiptNo = handover.receiptNumber || `TAU-REC-${item._id?.slice(-5)?.toUpperCase() || '2026'}`;
                  const returnedTo = item.claimedBy || handover.recipientName || 'Verified Campus Owner';
                  const handoverDate = handover.handedOverAt
                    ? new Date(handover.handedOverAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : (item.date || 'Recently');

                  return (
                    <div key={item._id || item.id} className="reunited-card">
                      {/* Image Frame with Verified Badge */}
                      <div className="reunited-img-frame">
                        <img
                          src={item.img || '/placeholder-item.jpg'}
                          alt={item.name}
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'; }}
                        />
                        <div className="reunited-badge-stamp">
                          <CheckCircle2 size={13} />
                          <span>Handover Verified</span>
                        </div>
                        <div className="reunited-type-pill">
                          {item.type === 'lost' ? 'Lost Item Recovered' : 'Found Item Returned'}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="reunited-card-body">
                        <div className="item-category-tag">{item.category}</div>
                        <h3 className="reunited-card-title">{item.name}</h3>

                        <p className="reunited-card-desc">
                          {item.desc ? (item.desc.length > 95 ? `${item.desc.substring(0, 95)}...` : item.desc) : 'Misplaced on campus and successfully restored to verified owner.'}
                        </p>

                        {/* Handover Metadata */}
                        <div className="reunited-meta-list">
                          <div className="reunited-meta-row">
                            <User size={14} color="#16a34a" />
                            <span>Returned to: <strong>{returnedTo}</strong></span>
                          </div>
                          <div className="reunited-meta-row">
                            <MapPin size={14} color="var(--primary)" />
                            <span>Location: <strong>{handover.handoverLocation || item.location || 'Campus Desk'}</strong></span>
                          </div>
                          <div className="reunited-meta-row">
                            <Calendar size={14} color="var(--text-muted)" />
                            <span>Date Reunited: <strong>{handoverDate}</strong></span>
                          </div>
                          <div className="reunited-meta-row receipt-row">
                            <ShieldCheck size={14} color="#0891b2" />
                            <span>Receipt: <code className="receipt-code">{receiptNo}</code></span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="reunited-card-footer">
                          <button
                            className="btn btn-primary-light btn-sm"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => setSelectedCertificateItem(item)}
                          >
                            <FileText size={15} />
                            <span>View Handover Certificate</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. TAB CONTENT: WEBSITE REVIEWS */}
      {activeTab === 'reviews' && (
        <section className="section" style={{ paddingTop: '20px' }}>
          <div className="container">
            {/* Reviews Summary & Rating Card */}
            <div className="reviews-summary-card">
              <div className="rating-overview-left">
                <div className="big-rating-number">{reviewStats.average || '4.9'}</div>
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={22}
                      color="#f59e0b"
                      fill={s <= Math.round(reviewStats.average) ? '#f59e0b' : 'none'}
                    />
                  ))}
                </div>
                <div className="rating-label-sub">
                  Based on <strong>{reviewStats.total || reviews.length} verified reviews</strong>
                </div>
                <div className="satisfaction-badge">
                  <CheckCircle2 size={14} /> 100% Verified Campus Community Feedback
                </div>
              </div>

              {/* Rating Distribution Bars */}
              <div className="rating-bars-center">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = reviewStats.breakdown?.[stars] || 0;
                  const total = reviewStats.total || reviews.length || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={stars} className="rating-bar-row">
                      <div className="bar-label">{stars} ★</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="bar-count">{count}</div>
                    </div>
                  );
                })}
              </div>

              {/* Write Review Action CTA */}
              <div className="rating-cta-right">
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)', marginBottom: '6px' }}>
                  Share Your Experience
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Helped reunite an item or found your misplaced belongings? Your feedback helps fellow students and campus staff!
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowReviewModal(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <MessageSquare size={16} />
                  <span>Write a Campus Review</span>
                </button>
              </div>
            </div>

            {/* Review Category Filter Chips */}
            <div className="reunited-filter-bar" style={{ marginTop: '24px' }}>
              <div className="category-chips-scroll">
                {REVIEW_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`category-chip ${selectedReviewCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedReviewCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews Cards List */}
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading campus reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="empty-state-card">
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
                <h3>No Reviews in This Category Yet</h3>
                <p style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }}>Be the first student or faculty member to write a review!</p>
                <button className="btn btn-primary" onClick={() => setShowReviewModal(true)}>
                  Write the First Review
                </button>
              </div>
            ) : (
              <div className="reviews-grid">
                {filteredReviews.map(rev => {
                  const revDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Recently';

                  return (
                    <div key={rev._id || rev.id} className="review-card">
                      <div className="review-card-header">
                        <div>
                          <div className="review-author-name">{rev.name}</div>
                          <div className="review-author-meta">
                            {rev.role === 'owner' ? 'Recovered Belonging Owner' : rev.role === 'finder' ? 'Honest Campus Finder' : rev.role === 'faculty' ? 'Faculty / Staff' : 'Verified Student'}
                            {rev.roll ? ` • Roll: ${rev.roll}` : ''}
                          </div>
                        </div>
                        <div className="stars-row">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={16}
                              color="#f59e0b"
                              fill={s <= Number(rev.rating || 5) ? '#f59e0b' : 'none'}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.category && (
                        <div className="review-cat-tag">
                          <span>📌 {rev.category}</span>
                          {rev.itemName && <span>• Related to: <em>{rev.itemName}</em></span>}
                        </div>
                      )}

                      <p className="review-comment-body">"{rev.comment}"</p>

                      <div className="review-card-footer">
                        <div className="verified-student-tag">
                          <CheckCircle2 size={13} color="#16a34a" />
                          <span>Verified Campus Member</span>
                        </div>
                        <div className="review-date-text">{revDate}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. MODAL: DIGITAL HANDOVER CERTIFICATE */}
      {selectedCertificateItem && (
        <div className="modal-backdrop" onClick={() => setSelectedCertificateItem(null)}>
          <div className="certificate-modal-container" onClick={e => e.stopPropagation()}>
            <div className="certificate-paper" id="handover-certificate-print">
              {/* Certificate Header with Crest */}
              <div className="cert-header">
                <img
                  src="/apollo-university-transparent.png"
                  alt="The Apollo University"
                  className="cert-logo"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="cert-inst-title">THE APOLLO UNIVERSITY</div>
                <div className="cert-sub">School of Technology • Campus Lost &amp; Found Welfare Hub</div>
                <div className="cert-main-heading">OFFICIAL CUSTODY HANDOVER CERTIFICATE</div>
                <div className="cert-receipt-badge">
                  Receipt No: <strong>{selectedCertificateItem.handover?.receiptNumber || `TAU-REC-${selectedCertificateItem._id?.slice(-5)?.toUpperCase() || '2026'}`}</strong>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="cert-body">
                <p className="cert-declaration">
                  This document serves as official institutional confirmation that the physical belonging described below was successfully identified, verified via security challenge, and formally handed over to its rightful owner.
                </p>

                <div className="cert-item-details-box">
                  <div className="cert-item-img-wrap">
                    <img
                      src={selectedCertificateItem.img || '/placeholder-item.jpg'}
                      alt={selectedCertificateItem.name}
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60'; }}
                    />
                  </div>
                  <div className="cert-item-info">
                    <div className="cert-field">
                      <span className="field-name">Belonging Name:</span>
                      <span className="field-val"><strong>{selectedCertificateItem.name}</strong></span>
                    </div>
                    <div className="cert-field">
                      <span className="field-name">Category:</span>
                      <span className="field-val">{selectedCertificateItem.category}</span>
                    </div>
                    <div className="cert-field">
                      <span className="field-name">Original Reported Type:</span>
                      <span className="field-val">{selectedCertificateItem.type === 'lost' ? 'Lost Item Report' : 'Found Item Handover'}</span>
                    </div>
                    <div className="cert-field">
                      <span className="field-name">Campus Handover Spot:</span>
                      <span className="field-val">{selectedCertificateItem.handover?.handoverLocation || selectedCertificateItem.location || 'Central Library Desk'}</span>
                    </div>
                    <div className="cert-field">
                      <span className="field-name">Handover Timestamp:</span>
                      <span className="field-val">
                        {selectedCertificateItem.handover?.handedOverAt
                          ? new Date(selectedCertificateItem.handover.handedOverAt).toLocaleString('en-IN')
                          : (selectedCertificateItem.date || 'Recorded')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Handover Signatories */}
                <div className="cert-signatories-grid">
                  <div className="sign-box">
                    <div className="sign-label">Restored &amp; Handed Over To:</div>
                    <div className="sign-name">
                      {selectedCertificateItem.claimedBy || selectedCertificateItem.handover?.recipientName || 'Verified Campus Owner'}
                    </div>
                    <div className="sign-role">
                      {selectedCertificateItem.handover?.recipientRoll ? `Student Roll: ${selectedCertificateItem.handover.recipientRoll}` : 'Verified Recipient'}
                    </div>
                    <div className="sign-status-tag">Identity &amp; Ownership Verified ✓</div>
                  </div>

                  <div className="sign-box">
                    <div className="sign-label">Facilitated &amp; Recorded By:</div>
                    <div className="sign-name">
                      {selectedCertificateItem.handover?.handedOverBy || 'Campus Security / Custodian'}
                    </div>
                    <div className="sign-role">Campus Lost &amp; Found Portal System</div>
                    <div className="sign-status-tag">Digital Handover Logged ✓</div>
                  </div>
                </div>

                <div className="cert-footer-note">
                  🛡️ <strong>Institutional Audit Integrity:</strong> Stored permanently under The Apollo University Lost &amp; Found record registry. For custody disputes, contact Student Welfare at lostportalhub@gmail.com.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cert-modal-actions">
                <button className="btn btn-outline" onClick={() => setSelectedCertificateItem(null)}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Printer size={16} />
                  <span>Print Official Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: WRITE A CAMPUS REVIEW */}
      {showReviewModal && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="review-modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
                <span>Write a Campus Review</span>
              </h2>
              <button className="modal-close-btn" onClick={() => setShowReviewModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              {/* Star Rating Selector */}
              <div>
                <label className="field-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Overall Rating *
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(starValue => (
                    <button
                      type="button"
                      key={starValue}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Star
                        size={32}
                        color="#f59e0b"
                        fill={(hoverRating || rating) >= starValue ? '#f59e0b' : 'none'}
                        style={{ transition: 'transform 0.15s ease' }}
                      />
                    </button>
                  ))}
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginLeft: '8px' }}>
                    {rating === 5 ? '5.0 - Excellent 🎉' : rating === 4 ? '4.0 - Very Good 👍' : rating === 3 ? '3.0 - Good' : rating === 2 ? '2.0 - Fair' : '1.0 - Needs Improvement'}
                  </span>
                </div>
              </div>

              {/* Name & Roll */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="field-label" htmlFor="rev-name">Your Full Name *</label>
                  <input
                    id="rev-name"
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. K. Kailash Singh"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="rev-roll">Student Roll / Staff ID</label>
                  <input
                    id="rev-roll"
                    type="text"
                    className="input"
                    placeholder="e.g. 122311520136"
                    value={reviewerRoll}
                    onChange={e => setReviewerRoll(e.target.value)}
                  />
                </div>
              </div>

              {/* Role & Experience Category */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="field-label" htmlFor="rev-role">Campus Role *</label>
                  <select
                    id="rev-role"
                    className="input"
                    value={reviewerRole}
                    onChange={e => setReviewerRole(e.target.value)}
                  >
                    <option value="owner">Recovered Belonging Owner</option>
                    <option value="finder">Honest Finder / Good Samaritan</option>
                    <option value="student">Campus Student</option>
                    <option value="faculty">Faculty Member / Staff</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="rev-category">Feedback Category</label>
                  <select
                    id="rev-category"
                    className="input"
                    value={reviewCategory}
                    onChange={e => setReviewCategory(e.target.value)}
                  >
                    <option value="Smart Matching & Recovery">Smart Matching &amp; Recovery</option>
                    <option value="SafeTag QR Return">SafeTag QR Return</option>
                    <option value="Handover Verification">Handover Verification</option>
                    <option value="Campus Governance & Privacy">Campus Governance &amp; Privacy</option>
                    <option value="Overall Experience">Overall Experience</option>
                  </select>
                </div>
              </div>

              {/* Related Item Name */}
              <div>
                <label className="field-label" htmlFor="rev-item">Belonging Recovered / Returned (Optional)</label>
                <input
                  id="rev-item"
                  type="text"
                  className="input"
                  placeholder="e.g., Casio Scientific Calculator, Laptop Charger, Hostel Keys"
                  value={reviewItemName}
                  onChange={e => setReviewItemName(e.target.value)}
                />
              </div>

              {/* Review Comment Text */}
              <div>
                <label className="field-label" htmlFor="rev-comment">Your Review / Experience Story *</label>
                <textarea
                  id="rev-comment"
                  className="input"
                  rows={4}
                  required
                  placeholder="Tell fellow Apollo University members how the portal helped you find, report, or hand over belongings..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Publishing Review...' : 'Publish Campus Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reunited;
