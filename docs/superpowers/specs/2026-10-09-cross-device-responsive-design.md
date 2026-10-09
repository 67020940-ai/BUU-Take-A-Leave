# Specification: Cross-Device Responsive UI (Desktop, iPad/Tablet, Mobile)

## 1. Executive Summary & Goals
Convert the BUU Take A Leave web application into a seamless, modern, multi-device responsive experience tailored for:
1. **Desktop / Computer (>= 1024px)**: Full workspace workbench with persistent sidebar, expansive timetable grids, and comprehensive data tables.
2. **iPad / Tablet (768px - 1023px, Portrait & Landscape)**: Adaptive layout featuring collapsible sidebar / icon rail, touch-friendly touch targets (min 44px), and spacious data tables.
3. **Mobile Phone (< 768px)**: Native app-like mobile experience featuring a fixed Bottom Navigation Bar, responsive Card List views instead of cramped horizontal tables, day-by-day swipe/tab schedule cards, and mobile-friendly sheets.

---

## 2. Architecture & Device Breakpoint Strategy

| Breakpoint | Target Devices | Navigation Pattern | Table / List Pattern | Timetable Grid Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile (`< 768px`)** | iPhone, Android phones | Fixed **Bottom Navigation Bar** + Header Profile | **Card List View** (Vertical cards with clear badges & big action buttons) | **Day Tabs / Daily Agenda Cards** (Mon-Sun tabs, auto-select current day) |
| **Tablet (`768px - 1023px`)** | iPad Mini, iPad Air, iPad Pro portrait | **Adaptive Collapsible Sidebar / Rail** (`w-20` or toggleable) | **Responsive Full Table** with touch-friendly row heights | **Responsive Grid** with condensed class pills |
| **Desktop (`>= 1024px`)** | Mac, PC, Laptops | **Full Persistent Sidebar** (`w-64` / `w-68`) | **Full Workbench Data Table** with filter bar | **Full Weekly Time Grid** (08:00 - 20:00) |

---

## 3. Component Design & Changes

### 3.1 Universal Bottom Navigation Bar (Mobile Only `< md`)
Create reusable bottom navigation bars matching the role:
- `components/MobileBottomNav.js`:
  - Fixed at screen bottom (`fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-neutral-200 dark:border-slate-800 pb-safe shadow-lg`).
  - Active tab highlighting in BUU purple (`#7749BC`).
  - Safe-area bottom padding for iOS Home Bar.
  - Tab items:
    - **Student**: หน้าหลัก (Home), ยื่นใบลา (Leave), ตารางเรียน (Schedule), ประวัติ (History), บัญชี (Account/More).
    - **Teacher**: หน้าหลัก (Home), คำขอลา (Requests + Pending Badge), สถิติ (Stats), ประวัติ (History), ตารางสอน (Schedule).
    - **Admin**: ภาพรวม (Overview), คำร้องลา (Leaves), รายวิชา (Courses), ปัญหา (Tickets), เมนู (Menu).
  - Main content containers across all pages will receive `pb-24 md:pb-8` to ensure content is never obscured by the bottom nav.

### 3.2 Student Experience Adaptation
1. **Schedule Grid (`components/StudentScheduleGrid.js`)**:
   - On Desktop/iPad (`md:block`): Maintain standard time grid.
   - On Mobile (`md:hidden`): Add a clean Day-Selector tab bar (`จันทร์` - `อาทิตย์`), displaying the selected day's classes as high-contrast cards showing course code, name, time, room, teacher, and "+ ยื่นใบลา" button.
2. **Student History (`app/student/history/history-view.js`)**:
   - On Mobile: Render each leave record as an interactive card displaying:
     - Header: Course code + Acronym, status badge (อนุมัติ / รออนุมัติ / ไม่อนุมัติ)
     - Body: Date range (e.g. 15 ต.ค. 2569), leave type badge, reason, attachment indicator
     - Footer: Teacher comments and detail trigger button
   - On Tablet/Desktop: Maintain standard table.
3. **Homepage 4 Metric Cards**:
   - Mobile: 2x2 grid with tactile touch press state.
   - Tablet/Desktop: 4-column row.
4. **Leave Application Form (`app/student/leave/leave-form.js`)**:
   - Single-column flow on mobile, 2-column on iPad/Desktop.
   - Date picker and file upload buttons sized at minimum 44px height for touch precision.

### 3.3 Teacher Experience Adaptation
1. **Requests View (`app/teacher/requests/teacher-requests-view.js`)**:
   - Mobile Card View: Each pending leave shows student avatar, name, student ID, course, dates, and full-width side-by-side "อนุมัติ" (emerald) and "ไม่อนุมัติ" (rose) buttons.
   - Modal detail preview accommodates mobile screen height with scrollable body.
2. **History View (`app/teacher/history/teacher-history-view.js`)**:
   - Mobile Card View with "ดูข้อมูล" and "เพิกถอน" buttons.
3. **Leave Statistics (`app/teacher/stats/wireframe-stats-view.js`)**:
   - Course selection pill tabs on mobile and tablet for quick switching.
   - Responsive bar chart container preventing canvas overflow.

### 3.4 Admin Experience Adaptation
1. **Overview**: Metric cards scale 2x2 on mobile, 4x1 on desktop.
2. **Tickets & Leaves**: Dual-mode (Card list on mobile, table on tablet/desktop).

### 3.5 Modals & Dialogs
- Ensure all modals (`AccountModal`, `SettingsModal`, `SupportModal`, detail modals) use `max-h-[90vh] overflow-y-auto` and bottom-sheet styling on mobile (`rounded-t-3xl sm:rounded-3xl`).

---

## 4. Verification & Testing Criteria
- **Playwright Responsive Emulation**:
  - iPhone 14/15 (390 x 844) viewport verification.
  - iPad Mini / iPad Pro (768 x 1024, 820 x 1180) viewport verification.
  - Desktop (1280 x 800+) viewport verification.
- Verify zero horizontal scrolling (`overflow-x-hidden`) on mobile.
- Verify all Next.js builds compile cleanly with zero errors.
- Existing E2E test suite remains 100% passing.
