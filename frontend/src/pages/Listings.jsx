import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import api, { getMediaUrl } from '../services/api';
import {
  Search,
  X,
  Heart,
  Share2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  Flag,
  Trash2,
  Laptop,
  CreditCard,
  Key,
  BookOpen,
  Watch,
  Package,
  Building,
  Printer
} from 'lucide-react';
import { useToast } from '../components/Toast';
import NoticeboardFlyerModal from '../components/NoticeboardFlyerModal';

const CAMPUS_LOCATIONS = [
  "All Locations",
  "Central Library (Floors 1-2)",
  "Main Academic Block A",
  "Main Academic Block B",
  "Main Academic Block C",
  "Cafeteria & Student Food Court",
  "Apollo Auditorium & Open Air Theatre",
  "Sports Arena & Cricket Ground",
  "Boys Hostel (Blocks 1-3)",
  "Girls Hostel (Blocks 1-2)",
  "Medical & Allied Health Science Block",
  "Examination Cell & Administrative Office",
  "Campus Bus Bay & Parking",
  "Other Campus Location"
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'ID/Wallet', label: 'IDs and Documents' },
  { value: 'Keys', label: 'Keys' },
  { value: 'Books/Stationery', label: 'Books and Stationery' },
  { value: 'Accessories', label: 'Clothing and Accessories' },
  { value: 'Other', label: 'Other' }
];

const ITEMS_PER_PAGE = 9;

const Listings = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const routeParams = useParams();

  // Primary Data State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, reunited: 0, lost: 0, found: 0 });

  // Tab Filter ('all' | 'lost' | 'found' | 'saved' | 'my' | 'reunited')
  const [activeTab, setActiveTab] = useState('all');

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'oldest'

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Bookmarked / Saved Item IDs in localStorage
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('tau_saved_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tau_saved_items', JSON.stringify(savedIds));
  }, [savedIds]);

  // Selected Item for Detail Page / Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [revealedContactId, setRevealedContactId] = useState(null);

  // Smart Matching Modal State
  const [matchingItem, setMatchingItem] = useState(null);
  const [smartMatches, setSmartMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Claim Verification Modal State
  const [claimingItem, setClaimingItem] = useState(null);
  const [claimAnswer, setClaimAnswer] = useState('');
  const [claimantContact, setClaimantContact] = useState(user?.phone || user?.email || '');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');

  // Allegation Reporting Modal State
  const [reportingItem, setReportingItem] = useState(null);
  const [reportReason, setReportReason] = useState('Fake or Fraudulent Listing');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Noticeboard Flyer Modal State
  const [flyerItem, setFlyerItem] = useState(null);
  const toast = useToast();

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedItem) setSelectedItem(null);
        if (matchingItem) setMatchingItem(null);
        if (claimingItem) setClaimingItem(null);
        if (reportingItem) setReportingItem(null);
        if (flyerItem) setFlyerItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, matchingItem, claimingItem, reportingItem, flyerItem]);

  // --------------------------------------------------------------------------
  // 1. Fetch single item for detail view
  // --------------------------------------------------------------------------
  const fetchSingleItemDetail = useCallback(async (id) => {
    try {
      const res = await api.get(`/api/items/detail/${id}`);
      if (res.data?.ok && res.data.item) {
        setSelectedItem(res.data.item);
        return;
      }
    } catch {
      // Endpoint may not be active if server wasn't restarted
    }

    try {
      const matchRes = await api.get(`/api/items/${id}/matches`);
      if (matchRes.data?.ok && matchRes.data.targetItem) {
        setSelectedItem(matchRes.data.targetItem);
        return;
      }
    } catch {
      // Fallback search in already loaded items
      setItems(prevItems => {
        const found = prevItems.find(i => (i._id || i.id) === id);
        if (found) setSelectedItem(found);
        return prevItems;
      });
    }
  }, []);

  // --------------------------------------------------------------------------
  // 2. Synchronize URL query params on mount & navigation
  // --------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q');
    const catParam = params.get('category');
    const locParam = params.get('location');
    const dateParam = params.get('date');
    const tabParam = params.get('tab');
    const sortParam = params.get('sort');
    const itemParam = params.get('item') || routeParams.id;

    if (qParam !== null) {
      setSearchInput(qParam);
      setDebouncedSearch(qParam);
    }
    if (catParam !== null) setCategoryFilter(catParam);
    if (locParam !== null) setLocationFilter(locParam);
    if (dateParam !== null) setDateFilter(dateParam);
    if (sortParam && ['newest', 'oldest'].includes(sortParam)) setSortOption(sortParam);
    if (tabParam && ['all', 'lost', 'found', 'saved', 'my', 'reunited'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Auto-open item detail if specified in URL
    if (itemParam) {
      fetchSingleItemDetail(itemParam);
    }
  }, [location.search, routeParams.id, fetchSingleItemDetail]);

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // --------------------------------------------------------------------------
  // 3. Fetch Data from Backend
  // --------------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/items/stats');
      if (res.data?.ok) {
        setStats(res.data.stats);
      }
    } catch {
      // silent fallback
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (categoryFilter) params.category = categoryFilter;
      if (locationFilter && locationFilter !== 'All Locations') params.location = locationFilter;
      if (dateFilter) params.date = dateFilter;
      if (sortOption) params.sort = sortOption;

      // Handle tab-based filtering for remote request
      if (activeTab === 'lost' || activeTab === 'found') {
        params.type = activeTab;
        params.status = 'active';
      } else if (activeTab === 'reunited') {
        params.status = 'resolved';
      } else if (activeTab === 'all') {
        params.status = 'active';
      }

      const queryString = new URLSearchParams(params).toString();
      const res = await api.get(`/api/items?${queryString}`);

      if (res.data?.ok && Array.isArray(res.data.items)) {
        setItems(res.data.items);
      } else {
        setErrorMessage('Failed to retrieve items catalog.');
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Unable to connect to campus server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryFilter, locationFilter, dateFilter, sortOption, activeTab]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchItems();
    setVisibleCount(ITEMS_PER_PAGE); // reset pagination when filters change
  }, [fetchItems]);

  // --------------------------------------------------------------------------
  // 3. Client-Side Tab Filtering (for 'saved' and 'my')
  // --------------------------------------------------------------------------
  const displayedItems = useMemo(() => {
    return items.filter(item => {
      const itemId = item._id || item.id;
      if (activeTab === 'saved') {
        return savedIds.includes(itemId);
      }
      if (activeTab === 'my') {
        if (!user) return false;
        const userMail = (user.email || '').toLowerCase();
        const userPhone = user.phone || '';
        const userRoll = (user.roll || '').toLowerCase();
        const itemContact = (item.contact || '').toLowerCase();
        const itemRoll = (item.roll || '').toLowerCase();
        return (
          (userMail && itemContact.includes(userMail)) ||
          (userPhone && itemContact.includes(userPhone)) ||
          (userRoll && itemRoll.includes(userRoll))
        );
      }
      return true;
    });
  }, [items, activeTab, savedIds, user]);

  const paginatedItems = useMemo(() => {
    return displayedItems.slice(0, visibleCount);
  }, [displayedItems, visibleCount]);

  // --------------------------------------------------------------------------
  // 4. Filter Handlers & Active Filter Chips
  // --------------------------------------------------------------------------
  const clearAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCategoryFilter('');
    setLocationFilter('');
    setDateFilter('');
    setActiveTab('all');
    setSortOption('newest');
    navigate('/listings', { replace: true });
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
    categoryFilter ||
    (locationFilter && locationFilter !== 'All Locations') ||
    dateFilter ||
    activeTab !== 'all' ||
    sortOption !== 'newest'
  );

  const toggleSave = (id, e) => {
    if (e) e.stopPropagation();
    setSavedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open item detail
  const handleCardClick = (item) => {
    navigate(`/items/${item._id || item.id}`);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    navigate('/listings', { replace: true });
  };

  // --------------------------------------------------------------------------
  // 5. Existing Modal Action Handlers
  // --------------------------------------------------------------------------
  const handleShareWhatsApp = (item, e) => {
    if (e) e.stopPropagation();
    const text = `🚨 *The Apollo University Lost & Found Alert* 🚨\n\n📌 *Item:* ${item.name}\n🏷️ *Type:* ${item.type.toUpperCase()}\n📍 *Location:* ${item.location}\n📅 *Date:* ${item.date}\n📝 *Details:* ${item.desc}\n\n🔗 View & connect on campus portal:\n${window.location.origin}/listings?item=${item._id || item.id}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCheckMatches = async (item, e) => {
    if (e) e.stopPropagation();
    setMatchingItem(item);
    setLoadingMatches(true);
    setSmartMatches([]);
    try {
      const res = await api.get(`/api/items/${item._id || item.id}/matches`);
      if (res.data?.ok) {
        setSmartMatches(res.data.matches);
      }
    } catch {
      // silent
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleMarkReunited = async (item, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Celebrate recovery of "${item.name}"? This will mark it as successfully reunited with its owner!`)) {
      return;
    }
    try {
      const res = await api.patch(`/api/items/${item._id || item.id}/resolve`, {
        claimedBy: user?.name || user?.email || 'Apollo Campus Member'
      });
      if (res.data?.ok) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('Item successfully marked as Reunited! 🎉');
        fetchItems();
        fetchStats();
        if (selectedItem && (selectedItem._id || selectedItem.id) === (item._id || item.id)) {
          setSelectedItem(prev => ({ ...prev, status: 'resolved' }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (item, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      const res = await api.delete(`/api/items/${item._id || item.id}`);
      if (res.data?.ok) {
        toast.success(`"${item.name}" deleted successfully.`);
        fetchItems();
        fetchStats();
        if (selectedItem && (selectedItem._id || selectedItem.id) === (item._id || item.id)) {
          setSelectedItem(null);
        }
      }
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleOpenClaim = (item, e) => {
    if (e) e.stopPropagation();
    if (item.question) {
      setClaimingItem(item);
      setClaimAnswer('');
      setClaimSuccess('');
    } else {
      setRevealedContactId(revealedContactId === (item._id || item.id) ? null : (item._id || item.id));
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!claimingItem) return;
    setSubmittingClaim(true);
    try {
      const res = await api.post(`/api/items/${claimingItem._id || claimingItem.id}/claim`, {
        answer: claimAnswer,
        claimantName: user?.name || user?.fullName || 'Campus Member',
        claimantContact
      });
      if (res.data?.ok) {
        setClaimSuccess(res.data.message);
        toast.success('Verification claim submitted to reporter!');
        setRevealedContactId(claimingItem._id || claimingItem.id);
        setTimeout(() => {
          setClaimingItem(null);
          setClaimSuccess('');
        }, 2200);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error submitting claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleOpenReport = (item, e) => {
    if (e) e.stopPropagation();
    setReportingItem(item);
    setReportReason('Fake or Fraudulent Listing');
    setReportDetails('');
    setReportSuccess('');
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportingItem) return;
    setSubmittingReport(true);
    try {
      const res = await api.post('/api/auth/report-user', {
        reportedUserEmail: reportingItem.contact,
        reportedUserName: reportingItem.name,
        reportedByEmail: user?.email || 'student.reporter@apollo.edu.in',
        reportedByName: user?.name || user?.fullName || 'Campus Member',
        reason: reportReason,
        details: reportDetails,
        itemId: reportingItem._id || reportingItem.id,
        itemName: reportingItem.name
      });
      if (res.data?.ok) {
        setReportSuccess('Your allegation has been filed and dispatched to campus administration.');
        setTimeout(() => {
          setReportingItem(null);
          setReportSuccess('');
        }, 1800);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to file report');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Helper: category visual fallback icon
  const renderCategoryIcon = (category) => {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('elect')) return <Laptop size={32} color="var(--primary)" />;
    if (catLower.includes('id') || catLower.includes('wallet')) return <CreditCard size={32} color="var(--primary)" />;
    if (catLower.includes('key')) return <Key size={32} color="var(--primary)" />;
    if (catLower.includes('book') || catLower.includes('stationery')) return <BookOpen size={32} color="var(--primary)" />;
    if (catLower.includes('access')) return <Watch size={32} color="var(--primary)" />;
    return <Package size={32} color="var(--primary)" />;
  };

  return (
    <section className="section" style={{ background: 'var(--bg-page)', minHeight: '90vh', paddingTop: '36px', paddingBottom: '60px' }}>
      <div className="container">
        
        {/* --------------------------------------------------------------------
           1. PAGE HEADING & LIVE STATS
           -------------------------------------------------------------------- */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-subtle)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                <ShieldCheck size={14} /> Official Campus Directory
              </div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.025em' }}>
                Browse Campus Belongings
              </h1>
              <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '14.5px' }}>
                Search, filter, and track lost and found items across The Apollo University campus.
              </p>
            </div>

            {/* Quick Stat Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Lost</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-amber)' }}>{stats.lost || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Found</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand-emerald)' }}>{stats.found || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Reunited</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{stats.reunited || 0} 🎉</div>
              </div>
            </div>
          </div>

          {/* Quick Tab Chips (All, Lost, Found, Reunited, Saved, My Reports) */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'lost', label: '⚠️ Lost Items' },
              { id: 'found', label: '✓ Found Items' },
              { id: 'reunited', label: '🎉 Reunited Hall' },
              { id: 'saved', label: `❤️ Saved (${savedIds.length})` },
              ...(user ? [{ id: 'my', label: '👤 My Reports' }] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  background: activeTab === tab.id ? 'var(--primary)' : 'var(--bg-card)',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-body)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: activeTab === tab.id ? 'var(--shadow-btn)' : 'var(--shadow-xs)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Popular Campus Hotspot Quick Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginTop: '12px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="var(--primary)" /> Hotspots:
            </span>
            {[
              { label: 'All Hotspots', value: '' },
              { label: '📚 Central Library', value: 'Central Library (Floors 1-2)' },
              { label: '🏢 Block A', value: 'Main Academic Block A' },
              { label: '🏢 Block B', value: 'Main Academic Block B' },
              { label: '🍔 Cafeteria', value: 'Cafeteria & Student Food Court' },
              { label: '🏀 Sports Arena', value: 'Sports Arena & Cricket Ground' },
              { label: '🛏️ Boys Hostel', value: 'Boys Hostel (Blocks 1-3)' },
              { label: '🛏️ Girls Hostel', value: 'Girls Hostel (Blocks 1-2)' }
            ].map(spot => {
              const isSelected = (!spot.value && !locationFilter) || locationFilter === spot.value;
              return (
                <button
                  key={spot.label}
                  type="button"
                  onClick={() => setLocationFilter(spot.value)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-body)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {spot.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* --------------------------------------------------------------------
           2. SEARCH & ORGANIZED FILTERS BAR
           -------------------------------------------------------------------- */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Top Search Input */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              id="browse-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search items by name, description, brand, or color..."
              aria-label="Search items by name, description, brand, or color"
              style={{
                width: '100%',
                padding: '11px 40px 11px 42px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-input)',
                color: 'var(--text-main)',
                fontSize: '14.5px',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'var(--font-main)',
                minHeight: '44px'
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                aria-label="Clear search text"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Structured Dropdown Filter Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            {/* Category Select */}
            <div>
              <label htmlFor="browse-filter-category" style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Category
              </label>
              <select
                id="browse-filter-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '40px'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Approximate Location Select */}
            <div>
              <label htmlFor="browse-filter-location" style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Campus Location
              </label>
              <select
                id="browse-filter-location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '40px'
                }}
              >
                {CAMPUS_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label htmlFor="browse-filter-date" style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Reported Date
              </label>
              <input
                id="browse-filter-date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by reported date"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '40px'
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <div>
              <label htmlFor="browse-filter-sort" style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Sort Order
              </label>
              <select
                id="browse-filter-sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  minHeight: '40px'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------------------
           3. ACTIVE FILTER CHIPS ROW & RESULTS SUMMARY
           -------------------------------------------------------------------- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          
          {/* Active Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}:
            </span>

            {debouncedSearch && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid rgba(79, 70, 229, 0.2)'
                }}
              >
                Search: "{debouncedSearch}"
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => setSearchInput('')} />
              </span>
            )}

            {activeTab !== 'all' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid rgba(79, 70, 229, 0.2)'
                }}
              >
                Tab: {activeTab.toUpperCase()}
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('all')} />
              </span>
            )}

            {categoryFilter && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid rgba(79, 70, 229, 0.2)'
                }}
              >
                Category: {categoryFilter}
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => setCategoryFilter('')} />
              </span>
            )}

            {locationFilter && locationFilter !== 'All Locations' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid rgba(79, 70, 229, 0.2)'
                }}
              >
                Location: {locationFilter}
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => setLocationFilter('')} />
              </span>
            )}

            {dateFilter && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid rgba(79, 70, 229, 0.2)'
                }}
              >
                Date: {dateFilter}
                <X size={13} style={{ cursor: 'pointer' }} onClick={() => setDateFilter('')} />
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--error)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  textDecoration: 'underline'
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* --------------------------------------------------------------------
           4. DATA GRID STATES (Loading, Error, Empty, List)
           -------------------------------------------------------------------- */}

        {/* Shimmer Loading Skeletons */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div
                key={n}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  height: '320px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div className="skeleton-shimmer" style={{ height: '180px', width: '100%' }} />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  <div className="skeleton-shimmer" style={{ height: '16px', width: '60%', borderRadius: '4px' }} />
                  <div className="skeleton-shimmer" style={{ height: '12px', width: '90%', borderRadius: '4px' }} />
                  <div className="skeleton-shimmer" style={{ height: '12px', width: '40%', borderRadius: '4px', marginTop: 'auto' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && errorMessage && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center',
              maxWidth: '460px',
              margin: '32px auto'
            }}
          >
            <AlertCircle size={36} color="var(--error)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-heading)' }}>
              Unable to load items
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            <button onClick={fetchItems} className="btn-primary" style={{ padding: '8px 20px', fontSize: '13px' }}>
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMessage && displayedItems.length === 0 && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '56px 20px',
              textAlign: 'center',
              maxWidth: '520px',
              margin: '32px auto'
            }}
          >
            <div style={{ fontSize: '42px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-heading)' }}>
              No matching items found
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              {hasActiveFilters
                ? 'Try broadening your search query or removing some active filters.'
                : 'No items currently in this section. Be the first to file a report!'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                  Clear All Filters
                </button>
              )}
              <button onClick={() => navigate('/report-lost')} className="btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }}>
                Report Lost Item
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------
           5. AIRBNB/LINEAR IMAGE-FIRST CARD GRID
           -------------------------------------------------------------------- */}
        {!loading && !errorMessage && displayedItems.length > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: '20px'
              }}
            >
              {paginatedItems.map(item => {
                const itemId = item._id || item.id;
                const isFound = item.type === 'found';
                const isResolved = item.status === 'resolved';
                const isSaved = savedIds.includes(itemId);

                return (
                  <div
                    key={itemId}
                    onClick={() => handleCardClick(item)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${item.name}`}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(item); }}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'var(--shadow-xs)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                    }}
                  >
                    {/* Image Header Area (Airbnb style) */}
                    <div
                      style={{
                        height: '180px',
                        width: '100%',
                        background: 'var(--bg-img-box)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    >
                      {item.img ? (
                        <img
                          src={getMediaUrl(item.img)}
                          alt={item.name ? `Item photo of ${item.name}` : 'Reported item photo'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                          {renderCategoryIcon(item.category)}
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600, marginTop: '6px' }}>
                            {item.category || 'Belonging'}
                          </div>
                        </div>
                      )}

                      {/* Status Badges Overlay */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: isResolved
                            ? 'var(--success-bg)'
                            : isFound ? 'var(--tag-found-bg)' : 'var(--tag-lost-bg)',
                          color: isResolved
                            ? 'var(--success)'
                            : isFound ? 'var(--tag-found-text)' : 'var(--tag-lost-text)',
                          border: `1px solid ${isResolved ? 'var(--success-border)' : isFound ? 'var(--tag-found-border)' : 'var(--tag-lost-border)'}`,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                      >
                        {isResolved ? '✓ Reunited' : isFound ? '✓ Found' : '⚠️ Lost'}
                      </span>

                      {/* Bookmark Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleSave(itemId, e)}
                        title={isSaved ? 'Remove from Saved' : 'Save Item'}
                        aria-label={isSaved ? `Remove ${item.name} from saved items` : `Save ${item.name}`}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(255, 255, 255, 0.92)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: isSaved ? 'var(--error)' : 'var(--text-muted)',
                          boxShadow: 'var(--shadow-xs)',
                          transition: 'transform 0.1s ease'
                        }}
                      >
                        <Heart size={16} fill={isSaved ? 'var(--error)' : 'none'} />
                      </button>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                        <h3
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            margin: 0,
                            color: 'var(--text-heading)',
                            lineHeight: 1.3,
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word'
                          }}
                        >
                          {item.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* Description excerpt */}
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-body)',
                          margin: '0 0 12px 0',
                          lineHeight: 1.45,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {item.desc || 'No description provided.'}
                      </p>

                      {/* Location & Date */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <MapPin size={13} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.location || 'Campus Location'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <Calendar size={13} style={{ flexShrink: 0 }} />
                          <span>{item.date || 'Recent'}</span>
                        </div>

                        {item.custodyHandedOver && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#0f766e', fontWeight: 600, marginTop: '2px' }}>
                            <Building size={12} style={{ flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              Safe Custody: {item.custodyLocation ? item.custodyLocation.split('(')[0].trim() : 'Library Desk'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Row */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '12.5px', justifyContent: 'center' }}
                        >
                          <Eye size={13} /> View Details
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFlyerItem(item);
                          }}
                          title="Generate printable noticeboard flyer (A4)"
                          style={{
                            padding: '7px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Printer size={14} />
                        </button>

                        {!isResolved && (
                          <button
                            type="button"
                            onClick={(e) => handleCheckMatches(item, e)}
                            title="Check Smart Matches"
                            style={{
                              padding: '7px 10px',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid rgba(79, 70, 229, 0.3)',
                              background: 'var(--primary-subtle)',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Sparkles size={14} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleShareWhatsApp(item, e)}
                          title="Share on WhatsApp"
                          style={{
                            padding: '7px 10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: '#25D366',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination / Load More Controls */}
            {visibleCount < displayedItems.length && (
              <div style={{ textAlign: 'center', marginTop: '36px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Showing {visibleCount} of {displayedItems.length} items
                </div>
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="btn-secondary"
                  style={{ padding: '10px 24px', fontSize: '13.5px', fontWeight: 600 }}
                >
                  Load More Items ({displayedItems.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* --------------------------------------------------------------------
           6. ITEM DETAIL MODAL (Requirement 9)
           -------------------------------------------------------------------- */}
        {selectedItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(17, 24, 39, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9000,
              padding: '16px'
            }}
            onClick={handleCloseDetail}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                maxWidth: '640px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card-hover)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Close Button */}
              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  zIndex: 10
                }}
                aria-label="Close details"
              >
                <X size={16} />
              </button>

              {/* Detail Photo / Hero Banner */}
              <div
                style={{
                  height: '240px',
                  width: '100%',
                  background: 'var(--bg-img-box)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                {selectedItem.img ? (
                  <img
                    src={getMediaUrl(selectedItem.img)}
                    alt={selectedItem.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    {renderCategoryIcon(selectedItem.category)}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '8px' }}>
                      {selectedItem.category}
                    </div>
                  </div>
                )}

                {/* Status Badges */}
                <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                  <span
                    style={{
                      background: selectedItem.status === 'resolved'
                        ? 'var(--success-bg)'
                        : selectedItem.type === 'found' ? 'var(--tag-found-bg)' : 'var(--tag-lost-bg)',
                      color: selectedItem.status === 'resolved'
                        ? 'var(--success)'
                        : selectedItem.type === 'found' ? 'var(--tag-found-text)' : 'var(--tag-lost-text)',
                      border: `1px solid ${selectedItem.status === 'resolved' ? 'var(--success-border)' : selectedItem.type === 'found' ? 'var(--tag-found-border)' : 'var(--tag-lost-border)'}`,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {selectedItem.status === 'resolved' ? '✓ Reunited' : selectedItem.type === 'found' ? '✓ Found Item' : '⚠️ Lost Item'}
                  </span>
                </div>
              </div>

              {/* Detail Info Body */}
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-heading)' }}>
                    {selectedItem.name}
                  </h2>
                  <span style={{ fontSize: '12px', fontWeight: 600, background: 'var(--bg-muted)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: 'var(--radius-sm)' }}>
                    {selectedItem.category}
                  </span>
                </div>

                {/* Location & Date */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span>{selectedItem.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>{selectedItem.date}</span>
                  </div>
                </div>

                {/* Full Description */}
                <div style={{ background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: '14px', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Item Description
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6 }}>
                    {selectedItem.desc || 'No additional details provided.'}
                  </p>
                </div>

                {/* Verification Check Notice */}
                {selectedItem.question ? (
                  <div style={{ background: 'var(--primary-subtle)', border: '1px solid rgba(79, 70, 229, 0.25)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
                    <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '12.5px', color: 'var(--primary)', lineHeight: 1.4 }}>
                      <strong>Verification Question Protected:</strong> The founder set an ownership challenge question to ensure safe return.
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
                    <CheckCircle2 size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '12.5px', color: 'var(--success)', lineHeight: 1.4 }}>
                      <strong>Direct Contact Available:</strong> You can contact the reporter directly to coordinate a handover.
                    </div>
                  </div>
                )}

                {/* Contact Reveal Box */}
                {revealedContactId === (selectedItem._id || selectedItem.id) && (
                  <div style={{ background: 'var(--bg-muted)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-heading)', marginBottom: '4px' }}>
                      📞 Reporter Contact Details:
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '4px' }}>
                      Reach: <strong>{selectedItem.contact}</strong>
                    </div>
                    {selectedItem.roll && (
                      <div style={{ fontSize: '13px', color: 'var(--text-body)' }}>
                        Roll No / Campus ID: <strong>{selectedItem.roll}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {selectedItem.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenClaim(selectedItem)}
                      className="btn-primary"
                      style={{ flex: 1, padding: '10px 18px', fontSize: '13.5px' }}
                    >
                      {revealedContactId === (selectedItem._id || selectedItem.id)
                        ? 'Hide Contact Info'
                        : selectedItem.type === 'lost' ? 'I Found This Item' : 'Claim Ownership'}
                    </button>
                  ) : (
                    <div style={{ flex: 1, padding: '10px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>
                      ✅ Successfully Reunited With Owner
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCheckMatches(selectedItem)}
                    className="btn-secondary"
                    style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Sparkles size={15} color="var(--primary)" /> Smart Matches
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(selectedItem)}
                    className="btn-secondary"
                    style={{ padding: '10px 14px', fontSize: '13px', color: '#25D366' }}
                    title="Share to WhatsApp"
                  >
                    <Share2 size={15} />
                  </button>

                  {/* Mark Reunited Action (for owner/admin/finder) */}
                  {selectedItem.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleMarkReunited(selectedItem)}
                      className="btn-secondary"
                      style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--success)' }}
                      title="Mark as Reunited"
                    >
                      🎉 Reunited
                    </button>
                  )}

                  {/* Report Listing Flag */}
                  <button
                    type="button"
                    onClick={() => handleOpenReport(selectedItem)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--error)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px'
                    }}
                  >
                    <Flag size={13} /> Report False Listing
                  </button>

                  {/* Delete Listing Button (Admin or Owner) */}
                  {(user?.role === 'admin' || user?.isAdmin || (user?.email && selectedItem.contact && user.email.toLowerCase() === selectedItem.contact.toLowerCase())) && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(selectedItem, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px'
                      }}
                      title="Delete Listing"
                    >
                      <Trash2 size={13} /> Delete Listing
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------
           7. EXISTING WORKING MODALS PRESERVED
           -------------------------------------------------------------------- */}

        {/* SMART MATCHES MODAL */}
        {matchingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(17, 24, 39, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
            onClick={() => setMatchingItem(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="smart-matches-title"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                maxWidth: '560px',
                width: '100%',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card-hover)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 id="smart-matches-title" style={{ margin: 0, fontSize: '17px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--primary)" /> Smart Matches: {matchingItem.name}
                </h3>
                <button
                  onClick={() => setMatchingItem(null)}
                  aria-label="Close smart matches"
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px' }}
                >
                  ✕
                </button>
              </div>

              {loadingMatches ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
                  Scanning catalog for matching category, location, and keywords...
                </div>
              ) : smartMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    No direct matches found right now
                  </p>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    We automatically scan and alert when a matching {matchingItem.type === 'lost' ? 'Found' : 'Lost'} report is filed.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Found <strong>{smartMatches.length} potential matches</strong>:
                  </div>

                  {smartMatches.map(({ item, score, reasons }) => (
                    <div
                      key={item._id || item.id}
                      style={{
                        padding: '14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--primary-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14.5px', color: 'var(--text-heading)' }}>{item.name}</strong>
                        <span style={{ background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: 800 }}>
                          {score}% Match
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        📍 {item.location} • 📅 {item.date} • Category: {item.category}
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '13px', color: 'var(--text-body)' }}>
                        {item.desc}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        {reasons.map((r, i) => (
                          <span key={i} style={{ fontSize: '11px', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                      <div style={{ marginTop: '6px', borderTop: '1px solid rgba(79, 70, 229, 0.2)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Contact: <strong>{item.contact}</strong>
                        </span>
                        <button
                          onClick={() => {
                            setMatchingItem(null);
                            handleShareWhatsApp(item);
                          }}
                          style={{
                            background: '#25D366',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            minHeight: '36px'
                          }}
                        >
                          <Share2 size={12} /> WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLAIM VERIFICATION CHALLENGE MODAL */}
        {claimingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(17, 24, 39, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
            onClick={() => setClaimingItem(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="claim-modal-title"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                maxWidth: '480px',
                width: '100%',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card-hover)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 id="claim-modal-title" style={{ margin: 0, fontSize: '17px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="var(--primary)" /> Ownership Verification Check
                </h3>
                <button
                  onClick={() => setClaimingItem(null)}
                  aria-label="Close verification check"
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                The person who found <strong>"{claimingItem.name}"</strong> set this security question to protect against fraudulent claims:
              </p>

              <div style={{ background: 'var(--bg-page)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Security Question:
                </div>
                <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-heading)' }}>
                  "{claimingItem.question}"
                </div>
              </div>

              {claimSuccess ? (
                <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                  ✅ {claimSuccess}
                </div>
              ) : (
                <form onSubmit={handleSubmitClaim} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label htmlFor="claim-answer-input" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                      Your Answer (e.g., Wallpaper, serial code, scratch location) *
                    </label>
                    <textarea
                      id="claim-answer-input"
                      required
                      rows={3}
                      value={claimAnswer}
                      onChange={(e) => setClaimAnswer(e.target.value)}
                      placeholder="Describe unique details that prove this belonging is yours..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        fontFamily: 'var(--font-main)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="claim-contact-input" style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                      Your Contact Info (Phone / Email) *
                    </label>
                    <input
                      id="claim-contact-input"
                      type="text"
                      required
                      value={claimantContact}
                      onChange={(e) => setClaimantContact(e.target.value)}
                      placeholder="e.g., 9876543210 or student@apollo.edu.in"
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setClaimingItem(null)}
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', minHeight: '40px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingClaim}
                      className="btn-primary"
                      style={{ padding: '8px 18px', fontSize: '13px', minHeight: '40px' }}
                    >
                      {submittingClaim ? 'Submitting...' : 'Submit Answer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ALLEGATION REPORTING MODAL */}
        {reportingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(17, 24, 39, 0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
            onClick={() => setReportingItem(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-modal-title"
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                maxWidth: '460px',
                width: '100%',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card-hover)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 id="report-modal-title" style={{ margin: 0, fontSize: '17px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flag size={18} /> Report Listing to Admin
                </h3>
                <button
                  onClick={() => setReportingItem(null)}
                  aria-label="Close report dialog"
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)', minWidth: '32px', minHeight: '32px' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                Submitting a report for <strong>"{reportingItem.name}"</strong> will alert campus moderators to review and investigate this listing.
              </p>

              {reportSuccess ? (
                <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                  ✅ {reportSuccess}
                </div>
              ) : (
                <form onSubmit={handleSendReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label htmlFor="report-reason-select" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Reason *</label>
                    <select
                      id="report-reason-select"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        minHeight: '40px'
                      }}
                    >
                      <option>Fake or Fraudulent Listing</option>
                      <option>Suspicious Extortion or Demand</option>
                      <option>Inappropriate or Offensive Content</option>
                      <option>Item Already Claimed / Solved</option>
                      <option>Other Guideline Violation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="report-details-textarea" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Additional Evidence or Notes</label>
                    <textarea
                      id="report-details-textarea"
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Explain why this listing violates campus guidelines..."
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-input)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'var(--font-main)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setReportingItem(null)}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '13px', minHeight: '40px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport}
                      style={{
                        background: 'var(--error)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: submittingReport ? 'not-allowed' : 'pointer',
                        minHeight: '40px'
                      }}
                    >
                      {submittingReport ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Noticeboard Printable Flyer Modal */}
        {flyerItem && (
          <NoticeboardFlyerModal
            item={flyerItem}
            onClose={() => setFlyerItem(null)}
          />
        )}

      </div>
    </section>
  );
};

export default Listings;
