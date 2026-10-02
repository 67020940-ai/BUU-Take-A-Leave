# Design System — BUU Take A Leave (ระบบลาเรียนออนไลน์ มหาวิทยาลัยบูรพา)

A locked Hallmark design system for BUU Take A Leave. Every page and component implementation reads this file as the single source of truth.

---

## 1. Genre & Philosophy
- **Genre:** `modern-minimal` (Utilitarian Academic Operating System)
- **Tone:** **Utilitarian + Academic Rigor** (High clarity, zero AI-slop, clean hairline rules, purposeful data density, no frivolous floating glow or meaningless gradient blobs)
- **Core Principle:** Designed for rapid action on mobile by students under time pressure, and high-efficiency triage on desktop by professors evaluating absence quotas.

---

## 2. Macrostructure Family

| Page Category | Macrostructure | Voice & Rhythm |
| :--- | :--- | :--- |
| **App Dashboards** (`/student`, `/teacher`) | **Workbench** | Status ribbon header, structured timetable/list work areas, floating actionable controls, high information-to-ink ratio. |
| **Action & Forms** (`/student/leave`) | **Long Document / Focus Form** | Single-column linear flow, strict field affordances, real-time quota warnings, tactile upload dropzone. |
| **Records & Analytics** (`/student/history`, `/teacher/history`, `*/stats`) | **Stat-Led / Tabular Specimen** | Honest numbers, filter pills, searchable tabular lists, export shortcuts. |
| **Authentication** (`/login`) | **Minimal Focus** | Centered clean card, high contrast inputs, instant 1-click role switcher. |

---

## 3. Design Tokens (OKLCH System)

### Palette
```css
:root {
  /* Paper & Surfaces */
  --color-paper:        oklch(0.985 0.005 285);  /* Clean warm academic white */
  --color-paper-2:      oklch(1.000 0.000 000);  /* Card surface */
  --color-paper-muted:  oklch(0.965 0.008 285);  /* Subdued backgrounds / table headers */

  /* Ink (Text) */
  --color-ink:          oklch(0.180 0.020 285);  /* Deep slate/navy ink (Never pure #000) */
  --color-ink-2:        oklch(0.420 0.025 285);  /* Secondary captions / labels */
  --color-ink-3:        oklch(0.600 0.020 285);  /* Muted placeholder text */

  /* Hairlines & Borders */
  --color-rule:         oklch(0.910 0.010 285);  /* Clean crisp structural hairline */
  --color-rule-subtle:  oklch(0.950 0.006 285);  /* Inner row dividers */

  /* Brand & Accents */
  --color-accent:       oklch(0.480 0.180 296);  /* BUU Gold Standard Purple #7749bc */
  --color-accent-hover: oklch(0.420 0.180 296);  /* Deeper purple #653ba6 */
  --color-accent-ink:   oklch(0.985 0.005 285);  /* Contrast text on accent button */
  --color-accent-subtle:oklch(0.960 0.030 296);  /* Light purple badge background */

  /* Status Colors */
  --color-success:      oklch(0.550 0.160 145);  /* Approved / Good standing */
  --color-warning:      oklch(0.680 0.160 70);   /* Near quota limit (15-20%) */
  --color-danger:       oklch(0.520 0.200 25);   /* Over quota (>20%) / Rejected */
  --color-info:         oklch(0.550 0.150 240);  /* Pending review */
}
```

### Typography
- **Primary / Body:** `Prompt`, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Secondary / Latin & Numerals:** `Plus Jakarta Sans`, sans-serif
- **Display Weights:** `600` (Semi-bold) or `700` (Bold) — **Strictly Roman (`font-style: normal`), Never Italic Headings**.
- **Body Weights:** `400` (Regular) and `500` (Medium).
- **Numbers / Codes:** Tabular numbers (`font-variant-numeric: tabular-nums`) for student IDs, dates, and course codes.

### Spacing & Metrics Scale
- Spacing follows a 4-pt grid: `--space-2xs: 4px`, `--space-xs: 8px`, `--space-sm: 12px`, `--space-md: 16px`, `--space-lg: 24px`, `--space-xl: 32px`.
- Border Radii:
  - Inputs & Buttons: `8px` (`rounded-lg`) — tactile, not oversized pills.
  - Cards & Modals: `12px` to `16px` (`rounded-xl` to `rounded-2xl`).
  - Badges & Chips: `6px` (`rounded-md`).

---

## 4. Anti-Patterns Forbidden (Hallmark Slop Test Gates)
1. ❌ **No fake glowing bubbles / blurred mesh gradients:** Replace with clean white surfaces with crisp 1px borders and subtle 0.5px inset highlights.
2. ❌ **No italic headings (`font-style: italic`):** All headings must be upright roman.
3. ❌ **No re-drawn browser/phone mock frames:** Embed content directly.
4. ❌ **No vague status indicators:** Every status badge must have both an icon, an explicit Thai label, and accessible color contrast ratio > 4.5:1.
5. ❌ **No two-line buttons on mobile:** Verified at 320px, 375px, 414px.
6. ❌ **No unannounced state changes:** Every button must define hover, focus-visible, active, disabled, and loading states.

---

## 5. Component Archetypes
- **Navigation:** N1b (Responsive header with role badge, quick switcher, and active route underline indicator).
- **Tables & Lists:** High-density, zebra-optional, with inline status badges and direct row actions.
- **Modals / Drawers:** Inset backdrop (`bg-black/40` with `backdrop-blur-sm`), centered, keyboard-escapable.
