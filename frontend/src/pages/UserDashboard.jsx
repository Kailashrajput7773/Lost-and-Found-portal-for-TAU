import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import confetti from 'canvas-confetti';
import {
  LayoutDashboard,
  FileText,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Search,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  Shield,
  Sparkles,
  RefreshCw,
  X,
  Check,
  Laptop,
  CreditCard,
  Key,
  BookOpen,
  Watch,
  Package
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

const UserDashboard = ({ user, defaultTab = 'overview' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab: 'overview' | 'reports' | 'review_claims' | 'my_claims' | 'matches'
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Dashboard Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    stats: {
      totalReports: 0,
      activeLostCount: 0,
      activeFoundCount: 0,
      resolvedCount: 0,
      pendingClaimsToReviewCount: 0,
      mySubmittedClaimsCount: 0,
      possibleMatchesCount: 0
    },
    myReports: [],
    claimsToReview: [],
    mySubmittedClaims: [],
    possibleMatches: [],
    recentActivity: []
  });

  // Filter State for "My Reports" tab
  const [reportFilterType, setReportFilterType] = useState('all'); // 'all' | 'lost' | 'found'
  const [reportFilterStatus, setReportFilterStatus] = useState('all'); // 'all' | 'active' | 'resolved'
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Edit Report Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    desc: '',
    location: '',
    category: '',
    question: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  // Review Claim Modal State
  const [reviewingClaim, setReviewingClaim] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Escape key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingItem) setEditingItem(null);
        if (reviewingClaim) setReviewingClaim(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItem, reviewingClaim]);

  // Sync tab with route if provided
  useEffect(() => {
    if (location.pathname === '/my-reports') {
      setActiveTab('reports');
    } else if (location.pathname === '/dashboard') {
      setActiveTab('overview');
    }
  }, [location.pathname]);

  // --------------------------------------------------------------------------
  // 1. Fetch User Dashboard Data
  // --------------------------------------------------------------------------
  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (user.email) headers['x-user-email'] = user.email;
      if (user.phone) headers['x-user-phone'] = user.phone;
      if (user.roll) headers['x-user-roll'] = user.roll;
      if (user.adminKey) headers['x-admin-key'] = user.adminKey;

      const res = await api.get('/api/items/user/dashboard', { headers });
      if (res.data?.ok) {
        setData(res.data);
      } else {
        setError(res.data?.error || 'Failed to retrieve user dashboard.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to connect to campus server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --------------------------------------------------------------------------
  // 2. Filtered Reports
  // --------------------------------------------------------------------------
  const filteredReports = useMemo(() => {
    return (data.myReports || []).filter(item => {
      if (reportFilterType !== 'all' && item.type !== reportFilterType) return false;
      if (reportFilterStatus !== 'all' && (item.status || 'active') !== reportFilterStatus) return false;
      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesLoc = (item.location || '').toLowerCase().includes(q);
        const matchesDesc = (item.desc || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc) return false;
      }
      return true;
    });
  }, [data.myReports, reportFilterType, reportFilterStatus, reportSearchQuery]);

  // --------------------------------------------------------------------------
  // 3. Edit Report Handlers
  // --------------------------------------------------------------------------
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name || '',
      desc: item.desc || '',
      location: item.location || '',
      category: item.category || 'Electronics',
      question: item.question || ''
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem || editSubmitting) return;

    setEditSubmitting(true);
    setEditError(null);
    try {
      const headers = {};
      if (user?.email) headers['x-user-email'] = user.email;
      if (user?.phone) headers['x-user-phone'] = user.phone;
      if (user?.adminKey) headers['x-admin-key'] = user.adminKey;

      const res = await api.patch(
        `/api/items/${editingItem._id || editingItem.id}/edit`,
        editFormData,
        { headers }
      );

      if (res.data?.ok) {
        setEditingItem(null);
        fetchDashboardData();
      } else {
        setEditError(res.data?.error || 'Failed to update report.');
      }
    } catch (err) {
      setEditError(err.response?.data?.error || 'Server error updating report.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. Close / Resolve Report
  // --------------------------------------------------------------------------
  const handleResolveReport = async (item) => {
    const confirm = window.confirm(`Mark "${item.name}" as successfully reunited? This will close the case.`);
    if (!confirm) return;

    try {
      const res = await api.patch(`/api/items/${item._id || item.id}/resolve`, {
        claimedBy: 'Reunited with Student'
      });
      if (res.data?.ok) {
        confetti({ particleCount: 50, spread: 60 });
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error resolving report');
    }
  };

  // --------------------------------------------------------------------------
  // 5. Delete Report
  // --------------------------------------------------------------------------
  const handleDeleteReport = async (item) => {
    const confirm = window.confirm(`Permanently delete the listing "${item.name}"? This action cannot be undone.`);
    if (!confirm) return;

    try {
      const headers = {};
      if (user?.email) headers['x-user-email'] = user.email;
      if (user?.phone) headers['x-user-phone'] = user.phone;
      if (user?.adminKey) headers['x-admin-key'] = user.adminKey;

      const res = await api.delete(`/api/items/${item._id || item.id}`, { headers });
      if (res.data?.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting report');
    }
  };

  // --------------------------------------------------------------------------
  // 6. Review Claim Handlers
  // --------------------------------------------------------------------------
  const handleProcessClaimReview = async () => {
    if (!reviewingClaim || reviewSubmitting) return;

    setReviewSubmitting(true);
    try {
      const headers = {};
      if (user?.email) headers['x-user-email'] = user.email;
      if (user?.phone) headers['x-user-phone'] = user.phone;
      if (user?.adminKey) headers['x-admin-key'] = user.adminKey;

      const res = await api.patch(
        `/api/items/${reviewingClaim.itemId}/claims/${reviewingClaim.id}`,
        {
          action: reviewAction,
          reviewNotes: reviewNotes.trim()
        },
        { headers }
      );

      if (res.data?.ok) {
        if (reviewAction === 'approve') {
          confetti({ particleCount: 60, spread: 60 });
        }
        setReviewingClaim(null);
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error processing claim review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Unauthorized Screen
  // --------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '520px', textAlign: 'center' }}>
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
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <Shield size={32} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
              Authentication Required
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '28px' }}>
              Please sign in with your Apollo University email or roll number to access your personal dashboard, track reported belongings, and review claims.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
                style={{ padding: '11px 24px' }}
              >
                Sign In with Apollo ID
              </button>
              <button
                onClick={() => navigate('/listings')}
                className="btn btn-secondary"
                style={{ padding: '11px 20px' }}
              >
                Browse Public Hub
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ paddingTop: '28px', paddingBottom: '72px' }}>
      <div className="container" style={{ maxWidth: '1120px' }}>

        {/* Dashboard Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pill pill-resolved" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Campus Member
              </span>
              {user.roll && (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Roll: {user.roll}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              {user.name ? `${user.name}'s Dashboard` : 'My Lost & Found Dashboard'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
              Manage your reported items, incoming verification claims, and automated campus matches.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/report-lost')}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Report Lost
            </button>
            <button
              onClick={() => navigate('/report-found')}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Report Found
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '28px'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'reports', label: `My Reports (${data.stats.totalReports})`, icon: FileText },
            { id: 'review_claims', label: `Claims Received (${data.stats.pendingClaimsToReviewCount})`, icon: ShieldCheck, alert: data.stats.pendingClaimsToReviewCount > 0 },
            { id: 'my_claims', label: `My Claims (${data.stats.mySubmittedClaimsCount})`, icon: Shield },
            { id: 'matches', label: `Smart Matches (${data.stats.possibleMatchesCount})`, icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: isActive ? 700 : 500,
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.alert && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--warning)',
                    display: 'inline-block'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Loading / Error States */}
        {/* ------------------------------------------------------------------ */}
        {loading && (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading your dashboard records...</p>
          </div>
        )}

        {!loading && error && (
          <div style={{
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{error}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="btn btn-secondary"
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
            >
              <RefreshCw size={13} style={{ marginRight: '4px' }} /> Retry
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: OVERVIEW */}
        {/* ------------------------------------------------------------------ */}
        {!loading && !error && activeTab === 'overview' && (
          <div>
            {/* Urgent Alert for Pending Claims */}
            {data.stats.pendingClaimsToReviewCount > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldCheck size={24} color="var(--warning)" />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 2px', color: 'var(--text-main)' }}>
                      Action Required: {data.stats.pendingClaimsToReviewCount} Ownership Claim{data.stats.pendingClaimsToReviewCount > 1 ? 's' : ''} Awaiting Review
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      Fellow campus members have submitted verification details to prove ownership of items you reported.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('review_claims')}
                  className="btn btn-primary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Review Claims Now →
                </button>
              </div>
            )}

            {/* Summary Metric Cards (Compact SaaS Linear style) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="var(--primary)" /> Total Reports
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
                  {data.stats.totalReports}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                  Filed under your account
                </div>
              </div>

              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--brand-amber)' }}>⚠️</span> Active Lost Items
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-amber)', marginTop: '8px' }}>
                  {data.stats.activeLostCount}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                  Currently searching campus
                </div>
              </div>

              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--brand-emerald)' }}>✓</span> Active Found Items
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--brand-emerald)', marginTop: '8px' }}>
                  {data.stats.activeFoundCount}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                  Held safely for owners
                </div>
              </div>

              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} color="var(--primary)" /> Successfully Reunited
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)', marginTop: '8px' }}>
                  {data.stats.resolvedCount} 🎉
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                  Resolved and returned
                </div>
              </div>
            </div>

            {/* Split Content: Recent Activity & Quick Tools */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* Left Column: Recent Activity Feed */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 16px' }}>
                  Recent Account Activity
                </h3>

                {data.recentActivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                    No recorded activity yet. When you report items or submit claims, they will appear here chronologically.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {data.recentActivity.map((act) => (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: act.status === 'resolved' ? 'var(--success-bg)' : 'rgba(79, 70, 229, 0.08)',
                          color: act.status === 'resolved' ? 'var(--success)' : 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {act.type === 'report_resolved' ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Link
                            to={`/items/${act.itemId}`}
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 600,
                              color: 'var(--text-main)',
                              textDecoration: 'none'
                            }}
                          >
                            {act.title}
                          </Link>
                          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>
                            {new Date(act.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Quick Shortcuts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 14px' }}>
                    Student Safety & Protection
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                    Protect your laptops, calculators, ID badges, and backpacks before they get misplaced on campus.
                  </p>
                  <Link
                    to="/safetag"
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <span>🏷️</span> Generate Free SafeTag™ QR Sticker
                  </Link>
                </div>

                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 14px' }}>
                    Need to Find Belongings?
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                    Search the complete live directory with categories, campus locations, and photos.
                  </p>
                  <Link
                    to="/listings"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    <Search size={15} /> Browse Full Campus Catalog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: MY REPORTS */}
        {/* ------------------------------------------------------------------ */}
        {!loading && !error && activeTab === 'reports' && (
          <div>
            {/* Filter and Search Bar for Reports */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* Search within my reports */}
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={16} color="var(--text-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="dashboard-search-reports"
                  type="text"
                  className="input"
                  placeholder="Filter by report title or location..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  aria-label="Filter my reports by title or location"
                  style={{ paddingLeft: '36px', width: '100%', minHeight: '44px' }}
                />
              </div>

              {/* Type Filter */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  id="dashboard-filter-type"
                  value={reportFilterType}
                  onChange={(e) => setReportFilterType(e.target.value)}
                  className="select"
                  aria-label="Filter reports by item type"
                  style={{ padding: '8px 12px', fontSize: '13px', minHeight: '44px' }}
                >
                  <option value="all">All Types</option>
                  <option value="lost">Lost Items</option>
                  <option value="found">Found Items</option>
                </select>

                <select
                  id="dashboard-filter-status"
                  value={reportFilterStatus}
                  onChange={(e) => setReportFilterStatus(e.target.value)}
                  className="select"
                  aria-label="Filter reports by status"
                  style={{ padding: '8px 12px', fontSize: '13px', minHeight: '44px' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="resolved">Reunited Only</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {filteredReports.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                  No reports match your filters
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 20px' }}>
                  {data.myReports.length === 0
                    ? 'You have not submitted any lost or found reports yet.'
                    : 'Try clearing your search query or status filter.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => navigate('/report-lost')} className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>
                    Report Lost Item
                  </button>
                  <button onClick={() => navigate('/report-found')} className="btn btn-secondary" style={{ padding: '9px 18px', fontSize: '13px' }}>
                    Report Found Item
                  </button>
                </div>
              </div>
            ) : (
              /* Reports Table / Card List */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {filteredReports.map((item) => {
                  const itemId = item._id || item.id;
                  const isFound = item.type === 'found';
                  const isResolved = item.status === 'resolved';
                  const pendingCount = (item.claimSubmissions || []).filter(c => c.status === 'pending').length;
                  const CategoryIcon = CATEGORY_ICONS[item.category] || Package;

                  return (
                    <div
                      key={itemId}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '14px',
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      {/* Left: Thumbnail & Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px', flex: '1 1 300px' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: 'var(--bg-muted)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {item.img ? (
                            <img
                              src={getMediaUrl(item.img)}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <CategoryIcon size={24} color="var(--primary)" />
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span className={`pill ${isFound ? 'pill-found' : 'pill-lost'}`} style={{ fontSize: '11px' }}>
                              {isFound ? 'Found' : 'Lost'}
                            </span>
                            {isResolved && (
                              <span className="pill pill-resolved" style={{ fontSize: '11px' }}>
                                Reunited 🎉
                              </span>
                            )}
                            {pendingCount > 0 && !isResolved && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--warning)',
                                padding: '2px 8px',
                                borderRadius: '12px'
                              }}>
                                {pendingCount} Pending Claim{pendingCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <Link
                            to={`/items/${itemId}`}
                            style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              textDecoration: 'none'
                            }}
                          >
                            {item.name}
                          </Link>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} /> {item.location}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> {item.date}
                            </span>
                            <span>•</span>
                            <span>{item.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Link
                          to={`/items/${itemId}`}
                          className="btn btn-secondary"
                          style={{ fontSize: '12.5px', padding: '7px 12px' }}
                        >
                          View Details
                        </Link>

                        {!isResolved && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="btn btn-secondary"
                              style={{ fontSize: '12.5px', padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Edit Report"
                            >
                              <Edit3 size={13} /> Edit
                            </button>

                            <button
                              onClick={() => handleResolveReport(item)}
                              className="btn btn-primary"
                              style={{ fontSize: '12.5px', padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Mark Reunited"
                            >
                              <CheckCircle2 size={13} /> Close / Reunited
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDeleteReport(item)}
                          className="btn btn-secondary"
                          style={{ fontSize: '12.5px', padding: '7px 10px', color: 'var(--error)' }}
                          title="Delete Listing"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: CLAIMS RECEIVED (TO REVIEW) */}
        {/* ------------------------------------------------------------------ */}
        {!loading && !error && activeTab === 'review_claims' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Ownership Claims Awaiting Your Review
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
                Review verification answers submitted by claimants to ensure items are returned to their genuine owners.
              </p>
            </div>

            {data.claimsToReview.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
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
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                  All Caught Up!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
                  You have no pending claims awaiting review on your reported items.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {data.claimsToReview.map((claim) => (
                  <div
                    key={claim.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Claim for Item:</span>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                          <Link to={`/items/${claim.itemId}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                            {claim.itemName}
                          </Link>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                            ({claim.itemLocation})
                          </span>
                        </div>
                      </div>
                      <span className="pill pill-resolved">Pending Review</span>
                    </div>

                    <div style={{
                      background: 'var(--bg-muted)',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ fontSize: '13px', marginBottom: '6px' }}>
                        <strong>Claimant:</strong> {claim.claimantName} •{' '}
                        <span style={{ color: 'var(--text-muted)' }}>Contact: {claim.claimantContact}</span>
                      </div>
                      <div style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                        <strong>Verification Answer / Distinguishing Details:</strong>
                        <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-body)' }}>
                          "{claim.answer || claim.distinguishingDetails}"
                        </div>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-light)', marginTop: '8px' }}>
                        Submitted on: {new Date(claim.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          setReviewingClaim(claim);
                          setReviewAction('approve');
                        }}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Check size={14} /> Approve &amp; Reunited 🎉
                      </button>
                      <button
                        onClick={() => {
                          setReviewingClaim(claim);
                          setReviewAction('reject');
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '13px', padding: '8px 16px', color: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <X size={14} /> Reject Claim
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: MY SUBMITTED CLAIMS */}
        {/* ------------------------------------------------------------------ */}
        {!loading && !error && activeTab === 'my_claims' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Claims You Submitted on Campus Listings
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
                Track the status of your claims when you identify your lost items in the hub.
              </p>
            </div>

            {data.mySubmittedClaims.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                  No Claims Submitted
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 20px' }}>
                  When you spot your missing belonging in the browse catalog, click "I think this is my item" to submit an ownership claim.
                </p>
                <button onClick={() => navigate('/listings')} className="btn btn-primary" style={{ padding: '9px 20px', fontSize: '13px' }}>
                  Browse Found Items
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {data.mySubmittedClaims.map((claim) => (
                  <div
                    key={claim.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <Link
                        to={`/items/${claim.itemId}`}
                        style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', textDecoration: 'none' }}
                      >
                        {claim.itemName}
                      </Link>
                      <span className={`pill ${claim.status === 'approved' ? 'pill-found' : claim.status === 'rejected' ? 'pill-lost' : 'pill-resolved'}`}>
                        {claim.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Location: <strong>{claim.itemLocation}</strong> • Submitted: {new Date(claim.submittedAt).toLocaleDateString()}
                    </div>

                    <div style={{ background: 'var(--bg-muted)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-body)' }}>
                      <strong>Your submitted proof:</strong> "{claim.answer || claim.distinguishingDetails}"
                    </div>

                    {claim.status === 'approved' && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--success-bg)',
                        color: 'var(--success)',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <span>🎉 Verified Owner! Direct Finder Contact: <strong>{claim.itemContact}</strong></span>
                          <Link
                            to={`/items/${claim.itemId}`}
                            className="btn btn-primary"
                            style={{ fontSize: '11.5px', padding: '4px 10px', background: '#0d9488', borderColor: '#0d9488' }}
                          >
                            View Handover Passcode 🤝
                          </Link>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 400 }}>
                          Quote your 6-digit passcode or show your Student ID when collecting your belongings in person.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: SMART MATCHES */}
        {/* ------------------------------------------------------------------ */}
        {!loading && !error && activeTab === 'matches' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px' }}>
                Automated Campus Match Recommendations
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
                Correlating your reported active items against opposite campus submissions using category and keyword indexing.
              </p>
            </div>

            {data.possibleMatches.length === 0 ? (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(79, 70, 229, 0.08)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Sparkles size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 6px' }}>
                  No Direct Matches Detected
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto' }}>
                  As students submit new lost and found reports across Apollo University campus, automated matches with your listings will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {data.possibleMatches.map((match, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      boxShadow: 'var(--shadow-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Match for your {match.userItem.type.toUpperCase()}: <strong>"{match.userItem.name}"</strong>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                        <Link to={`/items/${match.matchedItem.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                          {match.matchedItem.name}
                        </Link>
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {match.matchedItem.location} • {match.matchedItem.category} • {match.matchedItem.date}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {match.reasons.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            style={{
                              fontSize: '11px',
                              background: 'rgba(79, 70, 229, 0.08)',
                              color: 'var(--primary)',
                              padding: '2px 8px',
                              borderRadius: '10px'
                            }}
                          >
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)' }}>
                        {match.score}% Match
                      </span>
                      <Link to={`/items/${match.matchedItem.id}`} className="btn btn-primary" style={{ fontSize: '12.5px', padding: '8px 14px' }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Edit Report Modal */}
      {/* ------------------------------------------------------------------ */}
      {editingItem && (
        <div
          onClick={() => setEditingItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-report-dialog-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 id="edit-report-dialog-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Edit Report Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                aria-label="Close edit report modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {editError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--error-bg)',
                color: 'var(--error)',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label htmlFor="edit-item-name" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Item Title *
                </label>
                <input
                  id="edit-item-name"
                  type="text"
                  className="input"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div>
                <label htmlFor="edit-item-location" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Approximate Location *
                </label>
                <input
                  id="edit-item-location"
                  type="text"
                  className="input"
                  required
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div>
                <label htmlFor="edit-item-desc" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Description *
                </label>
                <textarea
                  id="edit-item-desc"
                  className="textarea"
                  rows={3}
                  required
                  value={editFormData.desc}
                  onChange={(e) => setEditFormData({ ...editFormData, desc: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="edit-item-question" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Verification Challenge / Distinguishing Detail
                </label>
                <input
                  id="edit-item-question"
                  type="text"
                  className="input"
                  placeholder="e.g. Secret question to challenge claimants"
                  value={editFormData.question}
                  onChange={(e) => setEditFormData({ ...editFormData, question: e.target.value })}
                  style={{ minHeight: '44px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', minHeight: '44px' }}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '10px', minHeight: '44px' }}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Review Claim Modal */}
      {/* ------------------------------------------------------------------ */}
      {reviewingClaim && (
        <div
          onClick={() => setReviewingClaim(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-claim-dialog-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 id="review-claim-dialog-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {reviewAction === 'approve' ? 'Approve Ownership Claim' : 'Reject Ownership Claim'}
              </h3>
              <button
                type="button"
                onClick={() => setReviewingClaim(null)}
                aria-label="Close review claim modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {reviewAction === 'approve'
                ? `Confirming this claim will mark "${reviewingClaim.itemName}" as successfully REUNITED and share your contact details with the verified claimant.`
                : `Rejecting this claim will leave the item listing active for other claimants.`}
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="review-claim-notes" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Review Note (Optional):
              </label>
              <input
                id="review-claim-notes"
                type="text"
                className="input"
                placeholder={reviewAction === 'approve' ? 'e.g. Card serial matched.' : 'e.g. Details did not match item.'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                style={{ minHeight: '44px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setReviewingClaim(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px', minHeight: '44px' }}
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
                  minHeight: '44px',
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

export default UserDashboard;
