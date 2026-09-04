import React from 'react';

const ZONES = [
  {
    id: 'Library',
    name: 'Central Library',
    code: 'LIB',
    icon: '🏛️',
    desc: 'Main Desk, Reading Halls, Digital Center',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.4)'
  },
  {
    id: 'Academic Block',
    name: 'Academic Blocks (A & B)',
    code: 'ACAD',
    icon: '🏫',
    desc: 'Lecture Theatres, Computer & Bio Labs',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.4)'
  },
  {
    id: 'Cafeteria',
    name: 'Student Cafeteria',
    code: 'CAFE',
    icon: '☕',
    desc: 'Dining Hall, Coffee Lounge, Food Court',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'Ground',
    name: 'TAU Sports Complex',
    code: 'SPT',
    icon: '⚽',
    desc: 'Athletic Track, Football Pitch, Indoor Court',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.4)'
  },
  {
    id: 'Hostel',
    name: 'Student Hostels',
    code: 'HSTL',
    icon: '🏣',
    desc: 'Boys & Girls Blocks, Common Rooms',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.4)'
  },
  {
    id: 'Main Gate',
    name: 'Security Gate 1',
    code: 'GATE',
    icon: '🛡️',
    desc: 'Main Campus Entrance, Security Office',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.4)'
  }
];

const CampusMap = ({ items = [], selectedLocation = '', onSelectLocation }) => {
  // Compute item counts per zone
  const getZoneCount = (zoneId) => {
    return items.filter(it => {
      const loc = (it.location || '').toLowerCase();
      const target = zoneId.toLowerCase();
      return loc.includes(target) || (target === 'ground' && loc.includes('sports'));
    }).length;
  };

  return (
    <div className="campus-map-card">
      <div className="campus-map-header">
        <div>
          <div className="hero-badge" style={{ marginBottom: '6px' }}>
            🗺️ Interactive Campus Zone Heatmap
          </div>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: 'var(--text-heading)' }}>
            The Apollo University – Location Explorer
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Click any campus zone to filter items reported lost or found in that location
          </p>
        </div>

        {selectedLocation && (
          <button
            className="btn-subtle-pill"
            style={{ fontSize: '13px', padding: '6px 14px' }}
            onClick={() => onSelectLocation('')}
          >
            Clear Filter ✕
          </button>
        )}
      </div>

      {/* Visual Campus Grid Layout */}
      <div className="campus-map-canvas">
        <div className="campus-grid-container">
          {ZONES.map(zone => {
            const count = getZoneCount(zone.id);
            const isSelected = selectedLocation.toLowerCase() === zone.id.toLowerCase();

            return (
              <div
                key={zone.id}
                className={`campus-zone-block ${isSelected ? 'selected' : ''}`}
                style={{
                  backgroundColor: isSelected ? zone.color : zone.bg,
                  borderColor: isSelected ? zone.color : zone.border,
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                }}
                onClick={() => onSelectLocation(isSelected ? '' : zone.id)}
              >
                <div className="zone-top">
                  <span className="zone-icon">{zone.icon}</span>
                  <span
                    className="zone-counter-badge"
                    style={{
                      background: isSelected ? '#ffffff' : zone.color,
                      color: isSelected ? zone.color : '#ffffff',
                    }}
                  >
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="zone-info">
                  <div className="zone-title" style={{ color: isSelected ? '#ffffff' : 'inherit' }}>
                    {zone.name}
                  </div>
                  <div className="zone-desc" style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)' }}>
                    {zone.desc}
                  </div>
                </div>

                <div className="zone-indicator">
                  {isSelected ? '✓ Active Filter' : 'Click to filter →'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CampusMap;
