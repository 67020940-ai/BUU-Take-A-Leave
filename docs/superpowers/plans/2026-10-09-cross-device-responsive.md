# Cross-Device Responsive UI (Desktop, iPad, Mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform BUU Take A Leave into a cross-device responsive application supporting Desktop (>=1024px), iPad/Tablet (768px-1023px), and Mobile Phone (<768px) with role-specific bottom navigation, dual-mode card/table views, and day-by-day timetable tabs.

**Architecture:** Introduce `components/MobileBottomNav.js` with role-aware tab routing; convert tabular data in Student, Teacher, and Admin portals into responsive Dual-Mode (Card List on `< md`, Full Data Table on `>= md`); equip the timetable grid with mobile day-by-day cards; and tune touch targets to >=44px.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-10-09-cross-device-responsive-design.md`

## Global Constraints
- Strictly preserve BUU purple palette (`#7749BC`, `#653ba6`, `#582B9E`).
- Support both Light and Dark mode across all new and modified components.
- Zero horizontal scroll bleed (`overflow-x-hidden`) on mobile viewports (375px - 430px).
- All clickable elements on mobile/tablet must satisfy minimum touch target of 44x44px.
- Keep all existing Playwright tests passing and add responsive viewport tests.

## Review Focus
- Mobile Bottom Nav covering floating page actions or buttons at screen bottom — solved via `pb-24 md:pb-8` in main containers.
- Horizontal table clipping on mobile — solved via Dual-Mode rendering (Card List for `< md`, Table for `>= md`).
- Timetable grid illegibility on phone screens — solved via Day Tabs (`จันทร์` - `อาทิตย์`) on `< md`.
- Date pickers and action buttons awkward to tap on iPad/Mobile — solved via `min-h-[44px]` touch targets.
- Modal dialogs exceeding mobile screen height — solved via `max-h-[90vh] overflow-y-auto` and bottom-sheet responsive border radius.

---

### Task 1: Universal Mobile Bottom Navigation Component

**Files:**
- Create: `components/MobileBottomNav.js`
- Test: `components/__tests__/MobileBottomNav.test.js` (or Playwright viewport navigation)

**Interfaces:**
- Produces: `export default function MobileBottomNav({ role, activeTab, onSelectTab, pendingCount })`

- [ ] **Step 1: Implement `components/MobileBottomNav.js`**
  Support roles: `'student'`, `'teacher'`, `'admin'`.
  Include safe-area bottom padding, active highlight in BUU purple, and notification badge indicator.
- [ ] **Step 2: Verify component renders cleanly on mobile `< md` and hides on `md:hidden`**
- [ ] **Step 3: Commit**
  ```bash
  git add components/MobileBottomNav.js
  git commit -m "feat(nav): add universal mobile bottom navigation component"
  ```

---

### Task 2: Integrate Bottom Nav & Adaptive Spacing across Portals

**Files:**
- Modify: `app/student/student-homepage-view.js`
- Modify: `app/teacher/teacher-dashboard.js`
- Modify: `app/teacher/requests/teacher-requests-view.js`
- Modify: `app/teacher/history/teacher-history-view.js`
- Modify: `app/teacher/schedule/teacher-schedule-view.js`
- Modify: `app/teacher/stats/wireframe-stats-view.js`
- Modify: `app/admin/admin-dashboard.js`

- [ ] **Step 1: Mount `MobileBottomNav` in Student Homepage View with `pb-24 md:pb-8`**
- [ ] **Step 2: Mount `MobileBottomNav` across all 5 Teacher views with `pb-24 md:pb-8`**
- [ ] **Step 3: Mount `MobileBottomNav` in Admin Dashboard with `pb-24 md:pb-8`**
- [ ] **Step 4: Verify navigation switches tabs smoothly without layout shifting**
- [ ] **Step 5: Commit**
  ```bash
  git add app/student/ app/teacher/ app/admin/
  git commit -m "feat(layout): mount mobile bottom nav and adjust container bottom padding"
  ```

---

### Task 3: Student Experience - Mobile Day-by-Day Schedule Tabs

**Files:**
- Modify: `components/StudentScheduleGrid.js`

- [ ] **Step 1: Add mobile day tabs (`จันทร์` ถึง `อาทิตย์`) with auto-selection of today's day**
- [ ] **Step 2: Render schedule cards for the selected day with course code, room, teacher, and "+ ยื่นใบลา" button**
- [ ] **Step 3: Keep full 7-day time grid active on `hidden md:block` for iPad and Desktop**
- [ ] **Step 4: Verify schedule grid displays cleanly on both mobile (390px) and desktop (1280px)**
- [ ] **Step 5: Commit**
  ```bash
  git add components/StudentScheduleGrid.js
  git commit -m "feat(student): add mobile daily schedule tab view"
  ```

---

### Task 4: Student Experience - Dual-Mode History & Responsive Leave Form

**Files:**
- Modify: `app/student/history/history-view.js`
- Modify: `app/student/leave/leave-form.js`

- [ ] **Step 1: Add Card List view for mobile `< md` in `history-view.js`**
  Each card shows status pill, course, date range, reason, and detail button.
- [ ] **Step 2: Preserve Table view for `>= md` on iPad and Desktop**
- [ ] **Step 3: Refine `leave-form.js` touch targets and input layout for mobile and tablet**
- [ ] **Step 4: Verify history cards and leave form render without overflow**
- [ ] **Step 5: Commit**
  ```bash
  git add app/student/history/history-view.js app/student/leave/leave-form.js
  git commit -m "feat(student): responsive history card list and touch-optimized leave form"
  ```

---

### Task 5: Teacher Experience - Dual-Mode Requests & History Cards

**Files:**
- Modify: `app/teacher/requests/teacher-requests-view.js`
- Modify: `app/teacher/history/teacher-history-view.js`

- [ ] **Step 1: Add Card List view for pending leave requests on mobile `< md` in `teacher-requests-view.js`**
  Includes student avatar, student code, course acronym, dates, and big side-by-side "อนุมัติ" & "ไม่อนุมัติ" buttons.
- [ ] **Step 2: Add Card List view for teacher history records on mobile `< md` in `teacher-history-view.js`**
- [ ] **Step 3: Keep full workbench tables active on `hidden md:block`**
- [ ] **Step 4: Verify teacher request approvals work seamlessly on mobile cards**
- [ ] **Step 5: Commit**
  ```bash
  git add app/teacher/requests/teacher-requests-view.js app/teacher/history/teacher-history-view.js
  git commit -m "feat(teacher): dual-mode card lists for requests and history"
  ```

---

### Task 6: Teacher Stats & Schedule Tablet/Mobile Optimization

**Files:**
- Modify: `app/teacher/stats/wireframe-stats-view.js`
- Modify: `app/teacher/schedule/teacher-schedule-view.js`

- [ ] **Step 1: Add quick horizontal course selector tabs on mobile/tablet for `wireframe-stats-view.js`**
- [ ] **Step 2: Ensure Chart.js container maintains responsive aspect ratio without canvas overflow**
- [ ] **Step 3: Optimize `teacher-schedule-view.js` timetable and action buttons for tablet/mobile touch**
- [ ] **Step 4: Verify statistics view renders cleanly across all 3 viewports**
- [ ] **Step 5: Commit**
  ```bash
  git add app/teacher/stats/wireframe-stats-view.js app/teacher/schedule/teacher-schedule-view.js
  git commit -m "feat(teacher): optimize stats chart and schedule for tablet and mobile"
  ```

---

### Task 7: Admin Experience - Dual-Mode Tables & Overview Scaling

**Files:**
- Modify: `app/admin/admin-dashboard.js`

- [ ] **Step 1: In `leaves` tab: Add mobile Card List view for leave audits**
- [ ] **Step 2: In `courses` tab: Add mobile Card List view for course offerings**
- [ ] **Step 3: In `tickets` tab: Add mobile Card List view for support tickets with quick reply trigger**
- [ ] **Step 4: Verify admin dashboard operates cleanly on mobile, iPad, and desktop**
- [ ] **Step 5: Commit**
  ```bash
  git add app/admin/admin-dashboard.js
  git commit -m "feat(admin): dual-mode cards for leaves, courses, and tickets"
  ```

---

### Task 8: End-to-End Responsive Verification & Playwright Viewport Tests

**Files:**
- Modify: `e2e/take-a-leave.spec.js`

- [ ] **Step 1: Add Playwright responsive viewport tests for Mobile (390x844) and iPad (820x1180)**
- [ ] **Step 2: Run `npm run test:e2e` to verify full suite passes**
- [ ] **Step 3: Run `npm run build` to verify zero Turbopack compilation errors**
- [ ] **Step 4: Commit**
  ```bash
  git add e2e/take-a-leave.spec.js
  git commit -m "test(e2e): add cross-device responsive viewport test coverage"
  ```
