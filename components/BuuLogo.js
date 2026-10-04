'use client';

/**
 * BuuLogo - Modernist Institutional Brand Mark for BUU Take A Leave
 * Designed directly from modernist reference archives:
 * 1. 'crest' - Modern Academic Shield (inspired by kiwismedia school. in LOGO2.jpeg)
 * 2. 'sunrise' - The Burapha East Sun (inspired by Yasaburo Kuwayama 'The Sun 太陽' 3239, 3243 in _ (30).jpeg)
 * 3. 'minimal' - Geometric Lettermark & Leaf (inspired by modern studio marks in LOGO2 & _ (31).jpeg)
 */
export default function BuuLogo({ size = 42, variant = 'crest', className = '' }) {
  if (variant === 'sunrise') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 transition-transform duration-200 ${className}`}
        aria-label="ตราสัญลักษณ์ มหาวิทยาลัยบูรพา Take A Leave (The Burapha Sunrise)"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6C39B7" />
            <stop offset="100%" stopColor="#481F85" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="16" y1="18" x2="32" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Squircle Canvas */}
        <rect width="48" height="48" rx="14" fill="url(#bgGrad)" />
        <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="13.25" stroke="#FFFFFF" strokeOpacity="0.15" strokeWidth="1.5" />

        {/* Burapha Rising Sun (ตะวันบูรพา) */}
        <circle cx="24" cy="28" r="9.5" fill="url(#goldGrad)" />

        {/* 5 Modernist Radiating Leaves / Rays (Ref _ (30).jpeg #3239) */}
        {/* Center Ray */}
        <path d="M 22.8 7.5 C 22.8 7.5 24 5 24 5 C 24 5 25.2 7.5 25.2 7.5 L 24.8 19 L 23.2 19 Z" fill="#FFFFFF" />
        {/* Left Ray 1 */}
        <path d="M 16.5 10.5 C 15.5 10 14.5 9 14.5 9 C 15 10.5 15.5 12 15.5 12 L 20.8 19.5 L 22.2 18.5 Z" fill="#FDE68A" />
        {/* Right Ray 1 */}
        <path d="M 31.5 10.5 C 32.5 10 33.5 9 33.5 9 C 33 10.5 32.5 12 32.5 12 L 27.2 19.5 L 25.8 18.5 Z" fill="#FDE68A" />
        {/* Left Ray 2 */}
        <path d="M 11.5 16.5 C 10 17 9 17 9 17 C 10 18 11.5 19 11.5 19 L 19 21.5 L 19.5 20 Z" fill="#FFFFFF" />
        {/* Right Ray 2 */}
        <path d="M 36.5 16.5 C 38 17 39 17 39 17 C 38 18 36.5 19 36.5 19 L 29 21.5 L 28.5 20 Z" fill="#FFFFFF" />

        {/* Modernist University Architectural Portal / Gateway */}
        <path d="M 8.5 33 L 39.5 33" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M 15.5 33 C 15.5 26.5 32.5 26.5 32.5 33"
          fill="url(#bgGrad)"
          stroke="#FFFFFF"
          strokeWidth="2"
        />

        {/* Base Pillar Inscription */}
        <rect x="18" y="37" width="12" height="4.5" rx="2.25" fill="#F59E0B" />
        <text
          x="24"
          y="40.3"
          textAnchor="middle"
          fill="#481F85"
          fontSize="3.4"
          fontWeight="900"
          letterSpacing="0.08em"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          BUU
        </text>
      </svg>
    );
  }

  if (variant === 'minimal') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 transition-transform duration-200 ${className}`}
        aria-label="ตราสัญลักษณ์ มหาวิทยาลัยบูรพา Take A Leave (Modernist Geometry)"
      >
        {/* Minimalist Geometric Mark: Quadrants forming T + L + Rising Sun */}
        <rect width="48" height="48" rx="14" fill="#582B9E" />
        {/* Golden Sun Arc */}
        <path d="M 24 8 A 14 14 0 0 1 38 22 L 24 22 Z" fill="#F59E0B" />
        {/* Academic Pillar T */}
        <rect x="10" y="8" width="12" height="4" rx="2" fill="#FFFFFF" />
        <rect x="14" y="12" width="4" height="26" rx="2" fill="#FFFFFF" />
        {/* Semicircular Leaf Accent */}
        <path d="M 20 38 C 20 28 30 24 38 24 C 38 34 28 38 20 38 Z" fill="#EDE9FE" />
        <circle cx="29" cy="31" r="2.2" fill="#582B9E" />
      </svg>
    );
  }

  // Default: 'crest' - Modern Academic Shield (Directly inspired by kiwismedia school. in LOGO2.jpeg)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="ตราสัญลักษณ์ทางการ มหาวิทยาลัยบูรพา Take A Leave"
    >
      <defs>
        {/* Clip to heraldic modern crest contour */}
        <clipPath id="crestShape">
          <path d="M 5 6 C 5 2.5 8.5 2.5 12 2.5 L 36 2.5 C 39.5 2.5 43 2.5 43 6 L 43 27 C 43 37.5 32.5 44 24 46.5 C 15.5 44 5 37.5 5 27 Z" />
        </clipPath>
        <filter id="crestShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2E1065" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Main Crest with ClipPath */}
      <g filter="url(#crestShadow)">
        <g clipPath="url(#crestShape)">
          {/* Quadrant 1 (Top-Left): Royal Purple with 3 Academic Columns / Pillars */}
          <rect x="4" y="2" width="20" height="22" fill="#582B9E" />
          <rect x="8.5" y="6.5" width="2.6" height="13" rx="1.3" fill="#FFFFFF" />
          <rect x="12.7" y="6.5" width="2.6" height="13" rx="1.3" fill="#FFFFFF" />
          <rect x="16.9" y="6.5" width="2.6" height="13" rx="1.3" fill="#FFFFFF" />

          {/* Quadrant 2 (Top-Right): Burapha Amber Gold with Purple Sun of the East */}
          <rect x="24" y="2" width="20" height="22" fill="#F59E0B" />
          <circle cx="33.5" cy="13" r="6" fill="#582B9E" />
          <circle cx="33.5" cy="13" r="2.4" fill="#FEF3C7" />

          {/* Quadrant 3 (Bottom-Left): Deep Royal Indigo with Quarter-Circle Arc */}
          <rect x="4" y="24" width="20" height="24" fill="#431D7A" />
          <path d="M 5 44 A 16 16 0 0 1 21 28 L 5 28 Z" fill="#7749BC" />
          <circle cx="10.5" cy="33.5" r="2.2" fill="#FFFFFF" />

          {/* Quadrant 4 (Bottom-Right): Soft Lavender with Organic Modern Leaf & Stem */}
          <rect x="24" y="24" width="20" height="24" fill="#EDE9FE" />
          <path
            d="M 28 40.5 C 28 32.5 34 27.5 41.5 27.5 C 41.5 35.5 35.5 40.5 28 40.5 Z"
            fill="#582B9E"
          />
          <path
            d="M 29 40 L 36.5 32.5"
            stroke="#FEF3C7"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>

        {/* Precision Outline Contour */}
        <path
          d="M 5 6 C 5 2.5 8.5 2.5 12 2.5 L 36 2.5 C 39.5 2.5 43 2.5 43 6 L 43 27 C 43 37.5 32.5 44 24 46.5 C 15.5 44 5 37.5 5 27 Z"
          stroke="#4C1D95"
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Subtle Inner Hairline */}
        <path
          d="M 6.5 7 C 6.5 4 9.5 4 12.5 4 L 35.5 4 C 38.5 4 41.5 4 41.5 7 L 41.5 26.5 C 41.5 36 32 42.5 24 44.8 C 16 42.5 6.5 36 6.5 26.5 Z"
          stroke="#FFFFFF"
          strokeOpacity="0.2"
          strokeWidth="0.8"
          fill="none"
        />
      </g>
    </svg>
  );
}
