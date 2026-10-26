import React from 'react';

/**
 * Official Roblox Robux logo (transparent background, tilted hexagon with square hole).
 */
export function RobuxIcon({ className = 'w-3.5 h-3.5 inline-block shrink-0', color = 'currentColor' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Robux"
    >
      {/* Outer tilted hexagon */}
      <path
        d="M6.2 3.5L17.8 3.5L23.6 13.5L17.8 23.5L6.2 23.5L0.4 13.5L6.2 3.5Z"
        fill={color === 'currentColor' ? '#00A2FF' : color}
        opacity="0.2"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.16 2.5H16.84L22.68 12.5L16.84 22.5H7.16L1.32 12.5L7.16 2.5ZM8.5 5.5L4.5 12.5L8.5 19.5H15.5L19.5 12.5L15.5 5.5H8.5ZM9.5 9.5H14.5V14.5H9.5V9.5Z"
        fill={color}
      />
    </svg>
  );
}

export function RobuxBadge({ amount, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold font-mono ${className}`}>
      <RobuxIcon className="w-3.5 h-3.5 text-[#00A2FF]" />
      <span>{amount > 0 ? amount.toLocaleString() : 'Free'}</span>
    </span>
  );
}
