'use client';

/**
 * BuuLogo - Modernist Brand Identity for BUU TL (Take A Leave)
 * Designed based on the 'ref logo' archives (Yasaburo Kuwayama, LOGO2, Xiaohongshu modernist marks):
 * 
 * Concept: "อ่อ นี่คือเว็บไซต์ลาเรียนนะ" (Aha! This is a student leave website!)
 * Elements:
 *  - Abbreviation: BUU TL
 *  - Leave cues: Calendar date-pad (ปฏิทินวันลา), Folded document (ใบลาเรียน),
 *                Approval checkmark (เครื่องหมายอนุมัติ ✓), Sprouting leaf (Leave / พักฟื้น)
 *  - Colors: BUU Royal Purple (#7749BC), Approval Emerald (#10B981), Burapha Sunrise Gold (#F59E0B)
 */
export default function BuuLogo({ size = 42, variant = 'calendar', className = '' }) {
  // Variant 1 (Default): "The Leave Calendar & Approval Check" (ปฏิทินวันลา & เครื่องหมายอนุมัติ)
  // An approachable, friendly calendar pad displaying TL with an integrated approval checkmark and leaf
  if (variant === 'calendar' || !variant) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 transition-transform duration-200 select-none ${className}`}
        aria-label="โลโก้ BUU TL - ระบบลาเรียนออนไลน์"
      >
        <defs>
          <linearGradient id="calBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7E4BC4" />
            <stop offset="100%" stopColor="#582B9E" />
          </linearGradient>
          <linearGradient id="checkGrad" x1="24" y1="28" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#3B1374" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Calendar Body (Soft Rounded Sheet) */}
        <g filter="url(#softShadow)">
          <rect x="4" y="8" width="40" height="36" rx="11" fill="url(#calBg)" />
          {/* Header Bar Line */}
          <path d="M 4 19 L 44 19" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.2" />

          {/* Two Calendar Binder Rings at top (representing leave days/dates) */}
          <rect x="13" y="4" width="4.5" height="8" rx="2.25" fill="#F59E0B" />
          <rect x="30.5" y="4" width="4.5" height="8" rx="2.25" fill="#F59E0B" />

          {/* Letter "T" (Take) - Clean, bold modern geometry */}
          <path
            d="M 12 25 L 24 25 M 18 25 L 18 39"
            stroke="#FFFFFF"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Letter "L" (Leave) - Extends into an Approval Checkmark & Leaf! */}
          {/* Vertical stem of L */}
          <path
            d="M 27 25 L 27 38 L 33 38"
            stroke="#FEF08A"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vibrant Emerald Approval Checkmark (อนุมัติการลา ✓) emerging from L */}
          <path
            d="M 31 35 L 34.5 38.5 L 42 27"
            stroke="url(#checkGrad)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Tiny Organic Leaf (Leave) floating above the checkmark */}
          <path
            d="M 39 23 C 39 19 43 17 43 17 C 43 17 43 21 39 23 Z"
            fill="#34D399"
          />
        </g>
      </svg>
    );
  }

  // Variant 2: "The Folded Leave Document" (ใบคำร้องลาเรียน & ตัวย่อ BUU TL)
  // Inspired by CHIC UNIT in ref logo (folded document sheet) with BUU on top and TL checkmark
  if (variant === 'document') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 transition-transform duration-200 select-none ${className}`}
        aria-label="โลโก้ BUU TL - ใบลาเรียนอนุมัติ"
      >
        <defs>
          <linearGradient id="docBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6D38B5" />
            <stop offset="100%" stopColor="#4A1D96" />
          </linearGradient>
          <filter id="docShadow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#2E1065" floodOpacity="0.25" />
          </filter>
        </defs>

        <g filter="url(#docShadow)">
          {/* Document Sheet with Dog-Ear Folded Corner */}
          <path
            d="M 8 7 C 8 4.8 9.8 3 12 3 L 32 3 L 42 13 L 42 41 C 42 43.2 40.2 45 38 45 L 12 45 C 9.8 45 8 43.2 8 41 Z"
            fill="url(#docBg)"
          />

          {/* Dog-ear Fold (สีทองสว่าง Burapha Gold) */}
          <path
            d="M 32 3 L 32 11 C 32 12.1 32.9 13 34 13 L 42 13 Z"
            fill="#FBBF24"
          />

          {/* Micro text: BUU header inside document */}
          <rect x="13" y="11" width="14" height="4.5" rx="2.25" fill="#FFFFFF" fillOpacity="0.2" />
          <text
            x="20"
            y="14.4"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="3.8"
            fontWeight="900"
            letterSpacing="0.1em"
            fontFamily="system-ui, sans-serif"
          >
            BUU
          </text>

          {/* Large Bold "TL" + Emerald Checkmark inside */}
          {/* T */}
          <path d="M 13 22 L 23 22 M 18 22 L 18 36" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          {/* L */}
          <path d="M 26 22 L 26 36 L 31 36" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {/* Emerald Checkmark (Approved Leave) */}
          <path d="M 29 33 L 33 37 L 40 27" stroke="#10B981" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  // Variant 3: "The Friendly Modernist Sprout" (BUU TL โมโนแกรมอิสระผสานใบไม้และรอยยิ้ม)
  // Pure modernist graphic geometry with no heavy container box (inspired by _ (31).jpeg CLK & B!ery)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 select-none ${className}`}
      aria-label="โลโก้ BUU TL - โมโนแกรมเรขาคณิต"
    >
      <defs>
        <linearGradient id="pillGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7749BC" />
          <stop offset="100%" stopColor="#582B9E" />
        </linearGradient>
      </defs>

      {/* Modern Circular Badge with Asymmetric Cut */}
      <rect width="48" height="48" rx="16" fill="url(#pillGrad)" />

      {/* Connected Modernist Lettermark "TL" */}
      {/* T: Clean top bar with golden sun accent */}
      <rect x="9" y="14" width="17" height="4" rx="2" fill="#FFFFFF" />
      <rect x="15.5" y="18" width="4" height="18" rx="2" fill="#FFFFFF" />

      {/* Sun / Appointment Dot */}
      <circle cx="21" cy="9" r="3" fill="#F59E0B" />

      {/* L: Curves upward like a smile / checkmark */}
      <path
        d="M 27 15 L 27 32 C 27 34.5 29 36 31.5 36 L 37 36"
        stroke="#FEF08A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Emerald Sprouting Leaf from the tip of L (representing Leave / พักฟื้น) */}
      <path
        d="M 37 36 C 41 36 43 32 43 28 C 39 28 37 32 37 36 Z"
        fill="#10B981"
      />
    </svg>
  );
}
