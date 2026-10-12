'use client';
/* Hallmark · macrostructure: Workbench · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ArrowRight,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';
import TeacherTopBar from '@/components/TeacherTopBar';
import TeacherScheduleGrid from '@/components/TeacherScheduleGrid';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function TeacherDashboard({
  user,
  courses = [],
  initialLeaves = [],
  rosterByCourse = {},
  usingMock = false,
}) {
  const router = useRouter();
  const [leaves] = useState(initialLeaves);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('1/2569');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique academic terms from courses and leaves
  const academicTerms = useMemo(() => {
    const terms = new Set();
    courses.forEach((c) => {
      if (c.term) terms.add(c.term);
    });
    leaves.forEach((l) => {
      if (l.courseTerm && l.courseTerm !== '-') terms.add(l.courseTerm);
    });
    if (terms.size === 0) terms.add('1/2569');
    return Array.from(terms).sort().reverse();
  }, [courses, leaves]);

  // Total counts across all statuses
  const totalPendingCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'รออนุมัติ').length;
  }, [leaves]);

  const totalApprovedCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'อนุมัติ').length;
  }, [leaves]);

  const totalRejectedCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
  }, [leaves]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* 1. Left Sidebar (mode="menu", activeTab="home") */}
      <TeacherSidebar
        user={user}
        mode="menu"
        activeTab="home"
        pendingCount={totalPendingCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        <TeacherTopBar
          user={user}
          semester={selectedTerm}
          onSemesterChange={(t) => setSelectedTerm(t)}
          availableSemesters={academicTerms}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* 4 Connected Horizontal Summary Boxes (Matching Student View & Screenshot 3) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Box 1: คำร้องขอลาทั้งหมด */}
            <Link
              href="/teacher/requests?tab=all"
              className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-[#7749BC] dark:hover:border-purple-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
              title="ดูรายการคำร้องขอลาทั้งหมด"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold truncate group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors">
                  คำร้องขอลาทั้งหมด
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#7749BC] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 dark:text-neutral-100">
                  {leaves.length}
                </span>
                <span className="text-[11px] text-neutral-400 group-hover:text-[#7749BC] transition-colors">
                  รายการ
                </span>
              </div>
            </Link>

            {/* Box 2: อนุมัติ */}
            <Link
              href="/teacher/history?status=อนุมัติ"
              className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
              title="ดูประวัติการอนุมัติคำขอลา"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  อนุมัติ
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {totalApprovedCount}
                </span>
                <span className="text-[11px] text-neutral-400 group-hover:text-emerald-600 transition-colors">
                  รายการ
                </span>
              </div>
            </Link>

            {/* Box 3: รออนุมัติ */}
            <Link
              href="/teacher/requests?tab=pending"
              className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
              title="ดูคำร้องขอลาที่รออนุมัติ"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  รออนุมัติ
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {totalPendingCount}
                </span>
                <span className="text-[11px] text-neutral-400 group-hover:text-amber-600 transition-colors">
                  รายการ
                </span>
              </div>
            </Link>

            {/* Box 4: ไม่อนุมัติ */}
            <Link
              href="/teacher/history?status=ไม่อนุมัติ"
              className="p-4 sm:p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border-2 border-neutral-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-md transition-all cursor-pointer text-neutral-800 dark:text-neutral-200 block group shadow-2xs relative"
              title="ดูรายการที่ไม่อนุมัติ"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold truncate group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  ไม่อนุมัติ
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                  {totalRejectedCount}
                </span>
                <span className="text-[11px] text-neutral-400 group-hover:text-rose-600 transition-colors">
                  รายการ
                </span>
              </div>
            </Link>
          </div>

          {/* Timetable (ตารางสอน - Strictly matching wireframe S__3366938_0.jpg & Screenshot 3) */}
          <section id="schedule-section">
            <TeacherScheduleGrid courses={courses} />
          </section>

          {/* Quick Action Banner to Requests if any pending */}
          {totalPendingCount > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    มีคำขอลาเรียนรอการพิจารณา {totalPendingCount} รายการ
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    คลิกเพื่อเข้าสู่หน้าคำขอร้องลาเรียนและพิจารณาคำขอของนิสิต
                  </p>
                </div>
              </div>
              <Link
                href="/teacher/requests"
                className="px-4 py-2 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>ไปยังหน้าคำขอร้องลาเรียน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <MobileBottomNav
        role="teacher"
        activeTab="home"
        pendingCount={totalPendingCount}
        onOpenDrawer={() => setMobileSidebarOpen(true)}
      />
    </div>
  );
}
