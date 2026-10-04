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
} from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';
import TeacherTopBar from '@/components/TeacherTopBar';
import TeacherScheduleGrid from '@/components/TeacherScheduleGrid';

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
        mode="menu"
        activeTab="home"
        pendingCount={totalPendingCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 lg:pl-64 sm:lg:pl-68 flex flex-col min-w-0">
        <TeacherTopBar
          user={user}
          semester={selectedTerm}
          onSemesterChange={(t) => setSelectedTerm(t)}
          availableSemesters={academicTerms}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* 4 Connected Horizontal Boxes (Strictly matching wireframe S__3366938_0.jpg & Screenshot 3) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-2 border-neutral-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {/* Box 1: คำร้องขอลาทั้งหมด */}
            <Link
              href="/teacher/requests?tab=all"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-purple-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูรายการคำร้องขอลาทั้งหมด"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors">
                คำร้องขอลาทั้งหมด
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1">: {leaves.length}</p>
            </Link>

            {/* Box 2: อนุมัติ */}
            <Link
              href="/teacher/history?status=อนุมัติ"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูประวัติการอนุมัติคำขอลา"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                อนุมัติ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                : {totalApprovedCount}
              </p>
            </Link>

            {/* Box 3: รออนุมัติ */}
            <Link
              href="/teacher/requests?tab=pending"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-amber-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูคำร้องขอลาที่รออนุมัติ"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                รออนุมัติ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
                : {totalPendingCount}
              </p>
            </Link>

            {/* Box 4: ไม่อนุมัติ */}
            <Link
              href="/teacher/history?status=ไม่อนุมัติ"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-rose-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูรายการที่ไม่อนุมัติ"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                ไม่อนุมัติ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">
                : {totalRejectedCount}
              </p>
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
    </div>
  );
}
