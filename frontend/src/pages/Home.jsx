import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getMediaUrl } from '../services/api';
import {
  Search,
  ArrowRight,
  MapPin,
  Calendar,
  ShieldCheck,
  Laptop,
  CreditCard,
  Briefcase,
  Key,
  BookOpen,
  Watch,
  Package,
  AlertCircle,
  RefreshCw,
  Lock,
  Eye,
  Users,
  QrCode,
  Building
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'electronics',
    name: 'Electronics',
    desc: 'Laptops, phones, headphones, chargers',
    icon: Laptop,
    queryParam: 'Electronics'
  },
  {
    id: 'ids',
    name: 'IDs and Documents',
    desc: 'Campus IDs, licenses, certificates, passes',
    icon: CreditCard,
    queryParam: 'ID/Wallet'
  },
  {
    id: 'bags',
    name: 'Bags and Wallets',
    desc: 'Backpacks, purses, wallets, pouches',
    icon: Briefcase,
    queryParam: 'ID/Wallet'
  },
  {
    id: 'keys',
    name: 'Keys',
    desc: 'Hostel keys, vehicle keys, locker tags',
    icon: Key,
    queryParam: 'Keys'
  },
  {
    id: 'books',
    name: 'Books and Stationery',
    desc: 'Textbooks, notebooks, calculators, files',
    icon: BookOpen,
    queryParam: 'Books/Stationery'
  },
  {
    id: 'clothing',
    name: 'Clothing and Accessories',
    desc: 'Watches, spectacles, jackets, umbrellas',
    icon: Watch,
    queryParam: 'Accessories'
  },
  {
    id: 'other',
    name: 'Other',
    desc: 'Sports gear, bottles, lab equipment',
    icon: Package,
    queryParam: 'Other'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState(null);

  // Fetch actual recent items from API
  const fetchRecentItems = async () => {
    setLoadingItems(true);
    setItemsError(null);
    try {
      const res = await api.get('/api/items');
      if (res.data?.ok && Array.isArray(res.data.items)) {
        // Show up to 6 most recently reported active items
        const activeItems = res.data.items
          .filter(item => item.status !== 'resolved')
          .slice(0, 6);
        setRecentItems(activeItems);
      } else {
        setItemsError('Unable to load recent items from the server.');
      }
    } catch (err) {
      setItemsError('Could not connect to the campus server. Please try again.');
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    fetchRecentItems();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/listings?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/listings');
    }
  };

  const handleCategoryClick = (categoryParam) => {
    navigate(`/listings?category=${encodeURIComponent(categoryParam)}`);
  };

  // Helper to render realistic item fallback icon based on category
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
    <div className="home-page" style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      
      {/* ----------------------------------------------------------------------
         2. HERO SECTION
         ---------------------------------------------------------------------- */}
      <section className="section hero-section" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
        <div className="container">
          <div
            style={{
              maxWidth: '820px',
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Campus Trust Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--primary-subtle)',
                color: 'var(--primary)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12.5px',
                fontWeight: 600,
                border: '1px solid rgba(79, 70, 229, 0.2)',
                marginBottom: '20px'
              }}
            >
              <ShieldCheck size={16} />
              <span>The Apollo University • Official Campus Lost &amp; Found Portal</span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 800,
                color: 'var(--text-heading)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: '0 0 16px 0'
              }}
            >
              Lost something? Let's help you find it.
            </h1>

            {/* Supporting Text */}
            <p
              style={{
                fontSize: 'clamp(15px, 2vw, 17px)',
                color: 'var(--text-body)',
                lineHeight: 1.6,
                maxWidth: '640px',
                margin: '0 0 28px 0'
              }}
            >
              Search reported items, report something you've lost, or help someone reunite with their belongings across our campus.
            </p>

            {/* Prominent Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              style={{
                width: '100%',
                maxWidth: '640px',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '6px 8px 6px 16px',
                boxShadow: 'var(--shadow-card)',
                marginBottom: '20px',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <Search size={20} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: '10px' }} />
              <input
                id="hero-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name, category, or location (e.g., AirPods, Library, ID Card)..."
                aria-label="Search reported items across campus"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-main)',
                  minWidth: '120px',
                  minHeight: '44px'
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: '9px 20px',
                  fontSize: '14px',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                  minHeight: '44px'
                }}
              >
                Search
              </button>
            </form>

            {/* Primary & Secondary Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '28px'
              }}
            >
              <Link to="/report-lost" className="btn-primary" style={{ padding: '11px 24px', fontSize: '14px' }}>
                Report Lost Item
              </Link>
              <Link to="/report-found" className="btn-secondary" style={{ padding: '11px 24px', fontSize: '14px' }}>
                Report Found Item
              </Link>
            </div>

            {/* SafeTag Preventative Feature Highlight */}
            <Link
              to="/safetag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-muted)',
                fontSize: '13px',
                textDecoration: 'none',
                boxShadow: 'var(--shadow-xs)',
                transition: 'color 0.15s ease, border-color 0.15s ease'
              }}
            >
              <QrCode size={16} color="var(--primary)" />
              <span>Looking to protect personal belongings? <strong>Generate a free SafeTag™ QR Sticker →</strong></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
         3. CATEGORIES SECTION
         ---------------------------------------------------------------------- */}
      <section className="section" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <div className="container">
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Explore By Category
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                Browse Specific Belongings
              </h2>
            </div>
            <Link to="/listings" style={{ fontSize: '13.5px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              View All Categories <ArrowRight size={14} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
              gap: '16px'
            }}
          >
            {CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.queryParam)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Browse items in category: ${cat.name}`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCategoryClick(cat.queryParam); }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all 0.15s ease'
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
                  <div
                    style={{
                      background: 'var(--primary-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <IconComponent size={22} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-heading)' }}>
                      {cat.name}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {cat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
         4. RECENTLY REPORTED ITEMS SECTION
         ---------------------------------------------------------------------- */}
      <section className="section" style={{ paddingTop: '32px', paddingBottom: '48px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Live Campus Activity
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                Recently Reported Items
              </h2>
            </div>
            <Link to="/listings" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Browse Complete Directory →
            </Link>
          </div>

          {/* Loading State */}
          {loadingItems && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div className="skeleton-shimmer" style={{ height: '160px', width: '100%' }} />
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <div className="skeleton-shimmer" style={{ height: '16px', width: '65%', borderRadius: '4px' }} />
                    <div className="skeleton-shimmer" style={{ height: '12px', width: '85%', borderRadius: '4px' }} />
                    <div className="skeleton-shimmer" style={{ height: '12px', width: '40%', borderRadius: '4px', marginTop: 'auto' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loadingItems && itemsError && (
            <div
              style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '36px',
                textAlign: 'center',
                maxWidth: '480px',
                margin: '0 auto'
              }}
            >
              <AlertCircle size={32} color="var(--error)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>
                Unable to load recent items
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                {itemsError}
              </p>
              <button onClick={fetchRecentItems} className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13px' }}>
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loadingItems && !itemsError && recentItems.length === 0 && (
            <div
              style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📦</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-heading)' }}>
                No active items reported yet
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Be the first to report a lost belonging or submit a found item on campus.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Link to="/report-lost" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Report Lost
                </Link>
                <Link to="/report-found" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  Report Found
                </Link>
              </div>
            </div>
          )}

          {/* Actual Existing Data Grid */}
          {!loadingItems && !itemsError && recentItems.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: '20px'
              }}
            >
              {recentItems.map((item) => {
                const isFound = item.type === 'found';
                return (
                  <div
                    key={item._id || item.id}
                    style={{
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'var(--shadow-xs)',
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
                    {/* Item Image or Fallback Visual */}
                    <div
                      style={{
                        height: '160px',
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
                          alt={item.name ? `Reported item: ${item.name}` : 'Campus reported item'}
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

                      {/* Status Tag (Found vs Lost) */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: isFound ? 'var(--tag-found-bg)' : 'var(--tag-lost-bg)',
                          color: isFound ? 'var(--tag-found-text)' : 'var(--tag-lost-text)',
                          border: `1px solid ${isFound ? 'var(--tag-found-border)' : 'var(--tag-lost-border)'}`,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {isFound ? '✓ Found' : '⚠️ Lost'}
                      </span>
                    </div>

                    {/* Card Content Details */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
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

                      {/* Description Excerpt */}
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
                        {item.desc || 'No additional description provided.'}
                      </p>

                      {/* Location & Date Metadata */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
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

                      {/* Link to Dedicated Item Details */}
                      <Link
                        to={`/items/${item._id || item.id}`}
                        className="btn-secondary"
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          padding: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-md)'
                        }}
                      >
                        View Details &amp; Connect →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------------
         5. HOW IT WORKS SECTION
         ---------------------------------------------------------------------- */}
      <section className="section" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Simple 3-Step Process
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
              A straightforward, secure procedure to reunite Apollo campus members with their misplaced belongings.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  marginBottom: '16px'
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-heading)' }}>
                Report an Item
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Submit descriptive details, campus zone or building location, incident date, and optional reference photos. The listing goes live for campus searches immediately.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  marginBottom: '16px'
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-heading)' }}>
                Find a Potential Match
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Our intelligent smart-match algorithm actively scans titles, categories, and campus locations to suggest matching lost and found listings automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  marginBottom: '16px'
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-heading)' }}>
                Verify Ownership Safely
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                To prevent false claims, finders set a private verification question. Only claimants who answer correctly unlock contact details to coordinate return.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
         6. TRUST & SAFETY SECTION
         ---------------------------------------------------------------------- */}
      <section className="section" style={{ paddingTop: '32px', paddingBottom: '56px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Responsible Campus Community
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 10px 0', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Trust &amp; Safety First
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text-body)', margin: 0, lineHeight: 1.5 }}>
              Built with security safeguards and moderation to protect every student, faculty, and campus visitor.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {/* Trust Item 1 */}
            <div
              style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--primary-subtle)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                  <Lock size={20} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                  Safe Communication
                </h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Personal phone numbers and student email addresses are protected. Contact details are never exposed to scrapers and are only shared after verified claim approval.
              </p>
            </div>

            {/* Trust Item 2 */}
            <div
              style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--primary-subtle)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                  <Eye size={20} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                  Student Privacy Protection
                </h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Sensitive student identification data (roll numbers, document numbers, private belongings) is screened by moderators to ensure adherence to campus privacy policies.
              </p>
            </div>

            {/* Trust Item 3 */}
            <div
              style={{
                background: 'var(--bg-page)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--primary-subtle)', borderRadius: 'var(--radius-md)', padding: '8px' }}>
                  <Users size={20} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                  Responsible Item Handover
                </h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Never arrange handovers off-campus. Always meet at designated campus locations such as the Central Library Desk, Student Welfare Office, or Main Gate Security Post.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
