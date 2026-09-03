import React from 'react';

export const ApolloFlameIcon = ({ size = 28, className = "" }) => (
  <svg
    viewBox="0 0 130 160"
    width={size}
    height={(size * 160) / 130}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <defs>
      <linearGradient id="apolloFlameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE033" />
        <stop offset="30%" stopColor="#FFA800" />
        <stop offset="70%" stopColor="#FF6A00" />
        <stop offset="100%" stopColor="#E53900" />
      </linearGradient>
      <filter id="apolloFlameDrop" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FF6A00" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#apolloFlameDrop)">
      {/* Primary Outer Flame */}
      <path
        d="M 5 155 C 5 95, 35 35, 105 0 C 75 45, 60 95, 120 135 C 90 115, 45 135, 5 155 Z"
        fill="url(#apolloFlameGradient)"
      />
      {/* Secondary Inner Swoop */}
      <path
        d="M 20 65 C 45 55, 85 65, 118 98 C 75 85, 48 95, 22 120 C 36 98, 40 76, 20 65 Z"
        fill="url(#apolloFlameGradient)"
        opacity="0.95"
      />
    </g>
  </svg>
);

export const ApolloBrand = ({ showSubtitle = true, iconSize = 42 }) => (
  <div className="brand" title="The Apollo University - Lost & Found Portal">
    <div
      className="brand-icon"
      style={{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        minWidth: `${iconSize}px`
      }}
    >
      <ApolloFlameIcon size={iconSize * 0.62} />
    </div>
    <div>
      <div className="brand-title">
        Apollo<span>Portal</span>
      </div>
      {showSubtitle && <div className="brand-subtitle">The Apollo University</div>}
    </div>
  </div>
);

export default ApolloFlameIcon;
