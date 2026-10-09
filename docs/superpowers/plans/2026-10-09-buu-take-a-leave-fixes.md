# BUU Take A Leave - Comprehensive Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all bugs and UX improvements reported by the Tester (October 8, 2569) and the 7 user screenshots across Student, Teacher, Admin, and Login portals in BUU Take A Leave.

**Architecture:** Maintain the single-workbench architecture while eliminating redundant headers, correcting dropdown padding, removing unnecessary theme duplicates, improving responsive touch targets, fixing teacher section groupings, and refining stat filters.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Playwright E2E.

**Spec:** Primary tester audit document (`เอกสาร.docx`, 8 ต.ค. 2569) and 7 annotated UI screenshots (`Screenshot 1` through `Screenshot 7`).

## Global Constraints
- Preserve existing Playwright E2E test flows (`take-a-leave.spec.js`).
- Maintain consistent BUU purple theme palette (`#7749BC`, `#653ba6`, `#5B21B6`).
- Dark mode compatibility across all modified components.
- Thai language copy following BUU university standards and academic terminology.

## Review Focus
- **Duplicate headers on tab switch:** Sub-components (`history-view.js`, `stats-view.js`) rendering their own back-header inside `student-homepage-view.js`.
- **Dropdown chevron padding:** Native `<select>` arrows cramped against the right border.
- **Section grouping duplicate keys:** Multiple course sections across different semesters appearing in the current semester course buttons.
- **Stat card filter interaction:** Clicking status cards should filter status without navigation anomalies.
- **Responsive date pickers on mobile/tablet:** Date inputs overflowing container bounds.

---

### Task 1: Remove Duplicate Headers & Modal Redundancy (Screenshots 1, 3, 4)

**Files:**
- Modify: `app/student/student-homepage-view.js`
- Modify: `app/student/history/history-view.js`
- Modify: `app/student/stats/stats-view.js`
- Modify: `components/StudentScheduleGrid.js`

**Interfaces:**
- Consumes: `StudentHistoryView`, `StudentStatsView`, `StudentScheduleGrid`
- Produces: Single unified header per view; course outline modal without duplicate "ปิด" button.

- [ ] **Step 1: Check existing duplicate header markup in `student-homepage-view.js` vs subviews**
  - In `student-homepage-view.js`, when `activeTab === 'history'`, an outer header is rendered, and inside `history-view.js`, an inner header is also rendered.
  - In `student-homepage-view.js`, when `activeTab === 'stats'`, an outer header is rendered, and inside `stats-view.js`, an inner header is also rendered.

- [ ] **Step 2: Remove redundant sub-headers and duplicate action buttons**
  - Remove duplicate header and duplicate "+ ยื่นใบลาใหม่" button from `history-view.js` when embedded, or consolidate into one clean top bar.
  - Remove duplicate header and second back button in `stats-view.js`.
  - In `components/StudentScheduleGrid.js`, remove the bottom "ปิด" button in the course syllabus modal (keep only the top-right `(X)` close button).

- [ ] **Step 3: Verify visually and run linter/build**
  - Run: `npm run build`
  - Ensure zero build or compile errors.

---

### Task 2: Status Cards Filter Interaction & Semester Ordering (Screenshot 2, Screenshot 3)

**Files:**
- Modify: `app/student/history/history-view.js`
- Modify: `app/student/student-homepage-view.js`

**Interfaces:**
- Consumes: `leaves`, `summaries`, `selectedStatus`, `setSelectedStatus`
- Produces: Clickable stat pill cards that toggle status filtering; chronological semester ordering in dropdowns.

- [ ] **Step 1: Make status summary cards interactive filter buttons in `history-view.js`**
  - Transform "คำขอทั้งหมด", "รออนุมัติ", "อนุมัติแล้ว", and add "ไม่อนุมัติ" cards into clickable buttons with active outline/ring when selected.
  - Clicking "อนุมัติแล้ว" filters table to show only approved leaves.
  - Clicking "รออนุมัติ" filters to pending.
  - Clicking "ไม่อนุมัติ" filters to rejected.
  - Clicking "คำขอทั้งหมด" resets status filter to 'all'.

- [ ] **Step 2: Correct semester sorting in dropdowns**
  - Ensure semesters sort chronologically without jumping between years (e.g., `1/2568`, `2/2568`, `1/2569` or sorted consistently by academic year and term).

- [ ] **Step 3: Verify filter behavior and term order**
  - Test filtering by clicking cards and check dropdown options.

---

### Task 3: Dropdown Arrow Spacing & Settings Theme Option Removal (Screenshot 5, Screenshot 7)

**Files:**
- Modify: `components/SettingsModal.js`
- Modify: `components/SupportModal.js`
- Modify: `app/teacher/archive/archive-view.js`
- Modify: `app/student/leave/leave-form.js`
- Modify: `app/student/history/history-view.js`

**Interfaces:**
- Consumes: Modal props and form states.
- Produces: `pr-8` / `pr-10` padding on all `<select>` inputs; removal of redundant Theme section in `SettingsModal`.

- [ ] **Step 1: Remove Theme toggle from `SettingsModal.js`**
  - Remove "โหมดการแสดงผล (Theme)" section and `ThemeToggle` import from `SettingsModal.js` as requested in Screenshot 7.

- [ ] **Step 2: Add sufficient right padding to select elements across all modals and views**
  - Update `SettingsModal.js` select styling to have proper `pr-8` and Chevron alignment.
  - Update `SupportModal.js` select styling with `pr-8` and custom chevron alignment.
  - Update `archive-view.js` and other teacher/student filter dropdowns so the chevron does not collide with the right border.

---

### Task 4: Teacher Section De-duplication & Schedule/Menu Fixes (Screenshot 6 & Tester Feedback)

**Files:**
- Modify: `app/teacher/stats/wireframe-stats-view.js`
- Modify: `app/teacher/stats/teacher-stats-view.js`
- Modify: `app/teacher/schedule/teacher-schedule-view.js`
- Modify: `components/TeacherSidebar.js`

**Interfaces:**
- Consumes: Teacher `courses`, `leaves`, `rosterByCourse`.
- Produces: Unique section buttons for course 24527664; "หน้าหลัก" in teacher sidebar; removal of duplicate "ดูสถิติการลารายวิชา" button.

- [ ] **Step 1: Fix duplicate group buttons in `wireframe-stats-view.js`**
  - Ensure section grouping filters courses by current semester or deduplicates `sec.group` (so course 24527664 only shows distinct sections, e.g., 'กลุ่ม 01', 'กลุ่ม 02').

- [ ] **Step 2: Remove redundant "ดูสถิติการลารายวิชา" in `teacher-schedule-view.js`**
  - Remove the button from the timetable header.

- [ ] **Step 3: Add "หน้าหลัก" and "สถิติการลา" navigation links to `TeacherSidebar.js`**
  - Ensure teacher sidebar always provides a clear link back to Home/Dashboard and Leave Statistics.

---

### Task 5: Student Profile in Menus, "Ghost Button" Clarity & Responsive Inputs

**Files:**
- Modify: `components/StudentSidebar.js`
- Modify: `components/TeacherSidebar.js`
- Modify: `app/student/student-homepage-view.js`
- Modify: `app/student/leave/leave-form.js`

**Interfaces:**
- Consumes: `user` object.
- Produces: User profile summary in sidebar; explicit card styling for homepage summary boxes; responsive date inputs for tablet/mobile.

- [ ] **Step 1: Add user summary profile and account modal trigger in sidebar**
  - Display student name, ID, and faculty in the sidebar.
  - Add account info / edit modal (contact email, phone, major, faculty).

- [ ] **Step 2: Fix "Ghost Button" misconception on student homepage**
  - Make the 4 summary stat boxes clearly look like clickable metric tabs or cards with explicit interactive indicators.

- [ ] **Step 3: Fix responsive date picker column layout in `leave-form.js`**
  - Add `min-w-0`, responsive grid spacing, and input padding to prevent overlapping columns on iPad and mobile screens.

---

### Task 6: Login Screen Demo Accounts & Mobile Guidance (Tester Feedback)

**Files:**
- Modify: `app/login/page.js`

**Interfaces:**
- Consumes: Auth login form.
- Produces: Clean login screen without intrusive demo test account boxes, and visible system guidance for mobile devices.

- [ ] **Step 1: Remove or hide demo test credentials before production**
  - Remove hardcoded demo switcher from main production view (or place behind a subtle development toggle).

- [ ] **Step 2: Add responsive system guidance banner for mobile screens**
  - Ensure the key system introductory information is visible on mobile devices as well as desktop/iPad.

---

### Task 7: Admin Portal Header & Stat Boxes Scope (Tester Feedback)

**Files:**
- Modify: `app/admin/admin-dashboard.js`
- Modify: `components/AdminSidebar.js`

**Interfaces:**
- Consumes: Admin dashboard tabs.
- Produces: Top summary metric boxes only visible on 'overview' tab; clear page header titles on every tab.

- [ ] **Step 1: Move the 4 summary metric boxes into the 'overview' tab only**
  - Ensure tabs `tickets`, `courses`, and `leaves` do not have the redundant top metric cards.

- [ ] **Step 2: Add distinct page header titles for all admin tabs**
  - Add breadcrumb/header titles (เช่น จัดการคำร้องเรียน, รายวิชาที่เปิดสอน, บันทึกการลา).

---

### Task 8: Verification & E2E Testing

**Files:**
- Modify: `e2e/take-a-leave.spec.js` (if needed for updated selectors)

- [ ] **Step 1: Run Next.js build**
  - Run: `npm run build`
  - Verify zero compile errors.

- [ ] **Step 2: Run Playwright E2E test suite**
  - Run: `npm run test:e2e`
  - Verify all tests pass.
