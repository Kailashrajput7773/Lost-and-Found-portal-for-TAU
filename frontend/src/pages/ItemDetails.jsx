import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api, { getMediaUrl } from '../services/api';
import {
  ArrowLeft,
  ShieldCheck,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  User as UserIcon,
  Share2,
  Sparkles,
  Check,
  X,
  Laptop,
  Key,
  CreditCard,
  BookOpen,
  Watch,
  Package,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Electronics': Laptop,
  'IDs and Documents': CreditCard,
  'ID/Wallet': CreditCard,
  'Bags and Wallets': Package,
  'Keys': Key,
  'Books and Stationery': BookOpen,
  'Clothing and Accessories': Watch,
  'Accessories': Watch,
  'Other': Package
};

const ItemDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Claim Submission Modal State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimFormData, setClaimFormData] = useState({
    claimantName: user?.name || '',
    claimantContact: user?.email || user?.phone || '',
    answer: '',
    distinguishingDetails: ''
  });
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [myClaim, setMyClaim] = useState(null);

  // Review Claim Modal State (for Owner / Admin)
  const [reviewingClaim, setReviewingClaim] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null);

  // Smart Matches State
  const [smartMatches, setSmartMatches] = useState([]);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showClaimModal) setShowClaimModal(false);
        if (reviewingClaim) setReviewingClaim(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showClaimModal, reviewingClaim]);

  // --------------------------------------------------------------------------
  // 1. Fetch Item Details
  // --------------------------------------------------------------------------
  const fetchItemDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (user?.adminKey) headers['x-admin-key'] = user.adminKey;
      if (user?.email) headers['x-user-email'] = user.email;
      if (user?.phone) headers['x-user-phone'] = user.phone;
      if (user?.roll) headers['x-user-roll'] = user.roll;

      const res = await api.get(`/api/items/detail/${id}`, { headers });
      if (res.data?.ok && res.data.item) {
        setItem(res.data.item);
        if (res.data.myClaim) {
          setMyClaim(res.data.myClaim);
        }
      } else {
        setError('Item listing not found.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('This listing could not be found. It may have been removed or the link is invalid.');
      } else {
        setError(err.response?.data?.error || 'Unable to connect to campus server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchItemDetails();
  }, [fetchItemDetails]);

  // --------------------------------------------------------------------------
  // 2. Fetch Smart Matches
  // --------------------------------------------------------------------------
  const fetchSmartMatches = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/api/items/${id}/matches`);
      if (res.data?.ok && Array.isArray(res.data.matches)) {
        setSmartMatches(res.data.matches);
      }
    } catch {
      // silent fallback
    }
  }, [id]);

  useEffect(() => {
    if (item && item.status !== 'resolved') {
      fetchSmartMatches();
    }
  }, [item, fetchSmartMatches]);

  // --------------------------------------------------------------------------
  // 3. Share URL
  // --------------------------------------------------------------------------
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Submit Claim
  // --------------------------------------------------------------------------
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (claimSubmitting) return;

    setClaimError(null);
    const details = (claimFormData.answer || claimFormData.distinguishingDetails || '').trim();
    if (!details) {
      setClaimError('Please provide your verification answer or distinguishing details.');
      return;
    }
    if (!claimFormData.claimantContact.trim()) {
      setClaimError('Please enter your contact phone or email.');
      return;
    }

    setClaimSubmitting(true);
    try {
      const res = await api.post(`/api/items/${id}/claim`, {
        claimantName: claimFormData.claimantName.trim() || 'Campus Student',
        claimantContact: claimFormData.claimantContact.trim(),
        answer: details,
        distinguishingDetails: details
      });

      if (res.data?.ok) {
        setClaimSuccess(res.data.claim);
        setMyClaim(res.data.claim);
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 }
        });
        fetchItemDetails();
      } else {
        setClaimError(res.data?.error || 'Failed to submit ownership claim.');
      }
    } catch (err) {
      setClaimError(err.response?.data?.error || 'Could not submit claim. Please try again.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // 5. Review Claim (Owner / Admin)
  // --------------------------------------------------------------------------
  const handleProcessClaimReview = async () => {
    if (!reviewingClaim || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewFeedback(null);

    try {
      const headers = {};
      if (user?.adminKey) headers['x-admin-key'] = user.adminKey;
      if (user?.email) headers['x-user-email'] = user.email;
      if (user?.phone) headers['x-user-phone'] = user.phone;

      const res = await api.patch(
        `/api/items/${id}/claims/${reviewingClaim.id}`,
        {
          action: reviewAction,
          reviewNotes: reviewNotes.trim()
        },
        { headers }
      );

      if (res.data?.ok) {
        setReviewFeedback({
          type: 'success',
          message: res.data.message
        });
        if (reviewAction === 'approve') {
          confetti({ particleCount: 60, spread: 60 });
        }
        setTimeout(() => {
          setReviewingClaim(null);
          setReviewFeedback(null);
          fetchItemDetails();
        }, 1800);
      } else {
        setReviewFeedback({
          type: 'error',
          message: res.data?.error || 'Failed to update claim review.'
        });
      }
    } catch (err) {
      setReviewFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Unauthorized or server error processing claim.'
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Determine Category Icon
  const CategoryIcon = (item && CATEGORY_ICONS[item.category]) || Package;

  // Format Dates
  const formattedEventDate = item?.date
    ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown Date';

  const formattedReportedDate = item?.createdAt
    ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : formattedEventDate;

  // Check if viewing user is owner or admin
  const isOwner = Boolean(item?.canManageClaims || (user?.email && item?.contact && user.email.toLowerCase() === item.contact.toLowerCase()));
  const isAdmin = Boolean(user?.role === 'admin' || user?.isAdmin);

  // --------------------------------------------------------------------------
  // Loading State
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '980px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div style={{ height: '32px', width: '220px', background: 'var(--border-subtle)', borderRadius: '6px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) minmax(280px, 1fr)', gap: '32px' }}>
              <div style={{ height: '380px', background: 'var(--border-subtle)', borderRadius: '16px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ height: '40px', background: 'var(--border-subtle)', borderRadius: '8px' }} />
                <div style={{ height: '20px', width: '60%', background: 'var(--border-subtle)', borderRadius: '6px' }} />
                <div style={{ height: '120px', background: 'var(--border-subtle)', borderRadius: '12px', marginTop: '16px' }} />
                <div style={{ height: '48px', background: 'var(--border-subtle)', borderRadius: '8px', marginTop: '24px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Error / 404 State
  // --------------------------------------------------------------------------
  if (error || !item) {
    return (
      <div className="section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '580px', textAlign: 'center' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '48px 24px',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--error-bg)',
              color: 'var(--error)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <AlertCircle size={32} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
              Listing Not Found
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
              {error || 'The lost or found report you requested is unavailable or has been archived.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/listings')}
                className="btn btn-primary"
                style={{ padding: '10px 24px' }}
              >
                Browse All Items
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-secondary"
                style={{ padding: '10px 20px' }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isResolved = item.status === 'resolved';

  return (
    <div className="section" style={{ paddingTop: '28px', paddingBottom: '64px' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>

        {/* Top Breadcrumb & Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 0'
            }}
          >
            <ArrowLeft size={16} /> Back to Catalog
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleShare}
              className="btn btn-secondary"
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Share listing URL"
            >
              {copiedLink ? <Check size={15} color="var(--success)" /> : <Share2 size={15} />}
              {copiedLink ? 'Link Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Resolved Banner */}
        {isResolved && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 2px' }}>
                Item Successfully Reunited! 🎉
              </h2>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)' }}>
                This item was returned to its verified owner: <strong>{item.claimedBy || 'Verified Campus Member'}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid: Photo Gallery & Item Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* Left Column: Visual Discovery & Ownership Challenge */}
          <div>
            {/* Primary Image / Fallback Container */}
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
              position: 'relative'
            }}>
              {item.img ? (
                <img
                  src={getMediaUrl(item.img)}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '380px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-muted)',
                  color: 'var(--text-light)',
                  padding: '24px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    marginBottom: '16px'
                  }}>
                    <CategoryIcon size={40} />
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    No photo uploaded with this report
                  </span>
                </div>
              )}

              {/* Status Badge Over Image */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                <span className={`pill ${item.type === 'found' ? 'pill-found' : 'pill-lost'}`} style={{ fontWeight: 700 }}>
                  {item.type === 'found' ? 'Found Item' : 'Lost Item'}
                </span>
                {isResolved && (
                  <span className="pill pill-resolved" style={{ fontWeight: 700 }}>
                    Reunited
                  </span>
                )}
              </div>
            </div>

            {/* Verification Challenge Card (Anti-Fraud) */}
            {item.question && (
              <div style={{
                marginTop: '20px',
                background: 'rgba(79, 70, 229, 0.05)',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                borderRadius: '12px',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                  <ShieldCheck size={18} />
                  <span>Ownership Challenge / Verification Question</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', fontStyle: 'italic', fontWeight: 500 }}>
                  "{item.question}"
                </p>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HelpCircle size={13} />
                  <span>Claimants must provide accurate matching details to verify ownership.</span>
                </div>
              </div>
            )}

            {/* Privacy Shield Notice */}
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12.5px',
              color: 'var(--text-muted)'
            }}>
              <Shield size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Campus Privacy Guaranteed:</strong> Contact and ownership records are protected and only released upon verified claims.
              </span>
            </div>
          </div>

          {/* Right Column: Metadata, Description & Claim Actions */}
          <div>
            {/* Title & Category Row */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.category}</span>
                <span>•</span>
                <span>Report ID: #{String(item._id || item.id).slice(-6)}</span>
              </div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.25,
                margin: 0
              }}>
                {item.name}
              </h1>
            </div>

            {/* Quick Metadata Box */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={13} /> Approximate Location
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px', display: 'block' }}>
                  {item.location}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={13} /> Date {item.type === 'found' ? 'Found' : 'Lost'}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px', display: 'block' }}>
                  {formattedEventDate}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={13} /> Date Reported
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px', display: 'block' }}>
                  {formattedReportedDate}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UserIcon size={13} /> Reported By
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px', display: 'block' }}>
                  {isOwner || isAdmin ? (
                    item.contact || 'Registered Reporter'
                  ) : (
                    <span>Campus Member <small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({item.maskedContact || 'Protected'})</small></span>
                  )}
                </span>
              </div>
            </div>

            {/* Description Section */}
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Description & Details
              </h2>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14.5px',
                lineHeight: 1.65,
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap'
              }}>
                {item.desc || 'No additional description provided.'}
              </div>
            </div>

            {/* Claim / Action Area */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '32px'
            }}>
              {/* Case 1: Item is resolved */}
              {isResolved ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ display: 'inline-flex', padding: '10px 16px', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 700, fontSize: '14px', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} /> Reunited with {item.claimedBy || 'Verified Owner'}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                    This case is resolved. New ownership claims are closed for this listing.
                  </p>
                </div>
              ) : myClaim ? (
                /* Case 2: Viewer has already submitted a claim */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} color="var(--primary)" /> Your Ownership Claim
                    </h3>
                    <span className={`pill ${myClaim.status === 'approved' ? 'pill-found' : myClaim.status === 'rejected' ? 'pill-lost' : 'pill-resolved'}`}>
                      Status: {myClaim.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{
                    background: myClaim.status === 'approved' ? 'var(--success-bg)' : 'var(--bg-muted)',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    color: 'var(--text-main)',
                    marginBottom: '14px'
                  }}>
                    {myClaim.status === 'approved' ? (
                      <div>
                        <strong>🎉 Congratulations! Your claim has been approved.</strong>
                        <div style={{ marginTop: '6px', color: 'var(--text-muted)' }}>
                          Direct Finder Contact: <strong>{item.contact}</strong>
                        </div>
                      </div>
                    ) : myClaim.status === 'rejected' ? (
                      <div>
                        <strong>Verification note:</strong> {myClaim.reviewNotes || 'The provided details did not match this item.'}
                      </div>
                    ) : (
                      <div>
                        Your verification answers were securely submitted on{' '}
                        {new Date(myClaim.submittedAt).toLocaleDateString()}. The reporter will review your claim.
                      </div>
                    )}
                  </div>
                </div>
              ) : isOwner ? (
                /* Case 3: Viewer is the reporter or administrator */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      Reporter Management Console
                    </h3>
                    <span className="pill pill-resolved">
                      {isAdmin ? 'Administrator Mode' : 'Your Listing'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    You reported this item. You can review submitted claims below or mark it as reunited when returned.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        setReviewingClaim({ id: 'manual-resolve' });
                        setReviewAction('approve');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '13.5px', padding: '10px 18px' }}
                    >
                      <CheckCircle2 size={16} /> Mark as Reunited 🎉
                    </button>
                  </div>
                </div>
              ) : (
                /* Case 4: General campus student -> Prompt to Claim */
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px' }}>
                      {item.type === 'found' ? 'Think this belongs to you?' : 'Have you seen or found this item?'}
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                      {item.type === 'found'
                        ? 'Submit your distinguishing details or answer the verification question to prove ownership and reconnect with the finder.'
                        : 'Connect with the owner to help return their lost belonging.'}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowClaimModal(true)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      fontSize: '15px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <ShieldCheck size={18} />
                    {item.type === 'found' ? 'I think this is my item — Submit Claim' : 'I Found This Item — Connect With Owner'}
                  </button>
                </div>
              )}
            </div>

            {/* Claims Review Section for Reporter / Admin */}
            {(isOwner || isAdmin) && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    Submitted Claims ({item.claimSubmissions?.length || 0})
                  </h3>
                </div>

                {!item.claimSubmissions || item.claimSubmissions.length === 0 ? (
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
                    No ownership claims have been submitted yet. When a student files a claim, it will appear here for your verification.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {item.claimSubmissions.map((claim) => (
                      <div
                        key={claim.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '16px',
                          background: 'var(--bg-muted)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <strong>{claim.claimantName || 'Anonymous Student'}</strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                              ({claim.claimantContact})
                            </span>
                          </div>
                          <span className={`pill ${claim.status === 'approved' ? 'pill-found' : claim.status === 'rejected' ? 'pill-lost' : 'pill-resolved'}`}>
                            {claim.status || 'pending'}
                          </span>
                        </div>

                        <div style={{ fontSize: '13.5px', color: 'var(--text-main)', marginBottom: '10px' }}>
                          <strong>Verification details:</strong> {claim.answer || claim.distinguishingDetails}
                        </div>

                        {claim.reviewNotes && (
                          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                            Note: {claim.reviewNotes}
                          </div>
                        )}

                        {/* Actions for Pending Claims */}
                        {claim.status === 'pending' && !isResolved && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button
                              onClick={() => {
                                setReviewingClaim(claim);
                                setReviewAction('approve');
                              }}
                              className="btn btn-primary"
                              style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={14} /> Approve Claim
                            </button>
                            <button
                              onClick={() => {
                                setReviewingClaim(claim);
                                setReviewAction('reject');
                              }}
                              className="btn btn-secondary"
                              style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--error)' }}
                            >
                              <X size={14} /> Reject Claim
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Smart Matches Section */}
            {smartMatches.length > 0 && !isResolved && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Sparkles size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Potential Campus Matches
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {smartMatches.map(({ item: match, score }) => (
                    <Link
                      key={match._id || match.id}
                      to={`/items/${match._id || match.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-muted)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>
                          {match.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {match.location} • {match.category}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>
                          {score}% Match
                        </span>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Claim Submission Modal */}
      {/* ------------------------------------------------------------------ */}
      {showClaimModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setShowClaimModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-verification-title"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowClaimModal(false)}
              aria-label="Close claim dialog"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                minWidth: '32px',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            {claimSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Ownership Claim Submitted!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                  Your verification details have been securely delivered to the finder. You will be contacted once your claim is verified.
                </p>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldCheck size={22} color="var(--primary)" />
                  <h3 id="claim-verification-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Verify Ownership Claim
                  </h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '20px' }}>
                  Please describe details that prove this item belongs to you (e.g. unique scratches, decals, serial numbers, wallpapers).
                </p>

                {item.question && (
                  <div style={{
                    background: 'rgba(79, 70, 229, 0.08)',
                    border: '1px solid rgba(79, 70, 229, 0.25)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    marginBottom: '18px'
                  }}>
                    <strong style={{ fontSize: '12.5px', color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                      Finder's Challenge Question:
                    </strong>
                    <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{item.question}</span>
                  </div>
                )}

                {claimError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--error-bg)',
                    color: 'var(--error)',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} /> {claimError}
                  </div>
                )}

                <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label htmlFor="claim-applicant-name" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Your Full Name *
                    </label>
                    <input
                      id="claim-applicant-name"
                      type="text"
                      className="input"
                      required
                      placeholder="e.g. John Doe"
                      value={claimFormData.claimantName}
                      onChange={(e) => setClaimFormData({ ...claimFormData, claimantName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="claim-applicant-contact" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Your Phone or Apollo Email *
                    </label>
                    <input
                      id="claim-applicant-contact"
                      type="text"
                      className="input"
                      required
                      placeholder="e.g. 9876543210 or student@apollo.edu.in"
                      value={claimFormData.claimantContact}
                      onChange={(e) => setClaimFormData({ ...claimFormData, claimantContact: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="claim-applicant-answer" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                      Distinguishing Details & Verification Answer *
                    </label>
                    <textarea
                      id="claim-applicant-answer"
                      className="textarea"
                      rows={4}
                      required
                      placeholder="Describe private features only you would know (e.g., sticker designs, contents inside, lock screen photo, engravings)..."
                      value={claimFormData.answer}
                      onChange={(e) => setClaimFormData({ ...claimFormData, answer: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowClaimModal(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '12px' }}
                      disabled={claimSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 2, padding: '12px' }}
                      disabled={claimSubmitting}
                    >
                      {claimSubmitting ? 'Submitting Claim...' : 'Submit Ownership Claim'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Review Claim Modal (for Reporter / Admin) */}
      {/* ------------------------------------------------------------------ */}
      {reviewingClaim && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setReviewingClaim(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-claim-title"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="review-claim-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
              {reviewAction === 'approve' ? 'Approve Ownership Claim' : 'Reject Ownership Claim'}
            </h3>

            {reviewFeedback && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: reviewFeedback.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                color: reviewFeedback.type === 'success' ? 'var(--success)' : 'var(--error)',
                fontSize: '13.5px',
                marginBottom: '16px'
              }}>
                {reviewFeedback.message}
              </div>
            )}

            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {reviewAction === 'approve'
                ? `Confirming this claim will mark "${item.name}" as REUNITED and reveal your contact to the verified claimant.`
                : `Rejecting this claim will keep the listing active for other claimants.`}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="review-notes-input" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Review Note (Optional):
              </label>
              <input
                id="review-notes-input"
                type="text"
                className="input"
                placeholder={reviewAction === 'approve' ? 'e.g. Distinguishing sticker matched.' : 'e.g. Details did not match item.'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReviewingClaim(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                disabled={reviewSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessClaimReview}
                className="btn btn-primary"
                style={{
                  flex: 1.5,
                  padding: '10px',
                  background: reviewAction === 'approve' ? 'var(--primary)' : 'var(--error)'
                }}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? 'Processing...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ItemDetails;
