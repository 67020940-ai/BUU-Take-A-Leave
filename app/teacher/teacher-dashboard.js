'use client';
/* Hallmark · macrostructure: Workbench · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { useState, useMemo, useEffect } from 'react';
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
  Search,
  X,
} from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';
import TeacherTopBar from '@/components/TeacherTopBar';
import TeacherScheduleGrid from '@/components/TeacherScheduleGrid';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useSidebarCollapsed } from '@/lib/useSidebarCollapsed';
import { STATUS_DETAILS } from '@/lib/ui';

export default function TeacherDashboard({
  user,
  courses = [],
  initialLeaves = [],
  rosterByCourse = {},
  usingMock = false,
}) {
  const router = useRouter();
  const [leaves, setLeaves] = useState(initialLeaves);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('1/2569');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLeaves(initialLeaves);
  }, [initialLeaves]);

  // Real-time synchronization
  useEffect(() => {
    let active = true;
    async function syncTeacherLeaves() {
      try {
        const res = await fetch('/api/leaves');
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data.leaves)) {
            setLeaves(data.leaves);
          }
        }
      } catch (err) {}
    }

    const interval = setInterval(syncTeacherLeaves, 4000);
    const handleFocus = () => syncTeacherLeaves();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('buu:leaves_updated', syncTeacherLeaves);

    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('buu:leaves_updated', syncTeacherLeaves);
    };
  }, []);

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

  const [isSidebarCollapsed] = useSidebarCollapsed();

  // Search logic supporting keywords:
  // - ชื่อนิสิต (studentName)
  // - รหัสนิสิต (studentCode)
  // - การลาของนิสิต (all student leaves)
  // - การลาที่อนุมัติแล้ว (approved leaves)
  // - รายการที่รออนุมัติ (pending leaves)
  // - ตารางสอน (schedule / courses)
  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return null;

    const isScheduleMatch =
      trimmed.includes('ตาราง') ||
      trimmed.includes('สอน') ||
      trimmed.includes('เรียน') ||
      trimmed.includes('schedule') ||
      trimmed.includes('คาบ');

    const isPendingMatch =
      trimmed.includes('รอ') ||
      trimmed.includes('รออนุมัติ') ||
      trimmed.includes('พิจารณา') ||
      trimmed.includes('pending');

    const isApprovedMatch =
      trimmed.includes('อนุมัติแล้ว') ||
      (trimmed.includes('อนุมัติ') && !trimmed.includes('รอ') && !trimmed.includes('ไม่')) ||
      trimmed.includes('approved');

    const isRejectedMatch =
      trimmed.includes('ไม่อนุมัติ') ||
      trimmed.includes('ปฏิเสธ') ||
      trimmed.includes('rejected');

    const isGeneralLeaveMatch =
      trimmed.includes('การลา') ||
      trimmed.includes('คำร้อง') ||
      trimmed.includes('ใบลา') ||
      trimmed.includes('ลา');

    const matchedLeaves = leaves.filter((l) => {
      if (isPendingMatch && l.status === 'รออนุมัติ') return true;
      if (isApprovedMatch && l.status === 'อนุมัติ') return true;
      if (isRejectedMatch && l.status === 'ไม่อนุมัติ') return true;
      if (isGeneralLeaveMatch && !isPendingMatch && !isApprovedMatch && !isRejectedMatch) return true;

      const sName = String(l.studentName || '').toLowerCase();
      const sCode = String(l.studentCode || '').toLowerCase();
      const reason = String(l.reason || '').toLowerCase();
      const type = String(l.type || '').toLowerCase();
      const cCode = String(l.courseCode || '').toLowerCase();
      const cName = String(l.courseName || '').toLowerCase();

      return (
        sName.includes(trimmed) ||
        sCode.includes(trimmed) ||
        reason.includes(trimmed) ||
        type.includes(trimmed) ||
        cCode.includes(trimmed) ||
        cName.includes(trimmed)
      );
    });

    const matchedCourses = courses.filter((c) => {
      if (isScheduleMatch) return true;
      const cCode = String(c.code || '').toLowerCase();
      const cName = String(c.name || '').toLowerCase();
      const room = String(c.room || '').toLowerCase();
      const day = String(c.day || '').toLowerCase();
      return (
        cCode.includes(trimmed) ||
        cName.includes(trimmed) ||
        room.includes(trimmed) ||
        day.includes(trimmed)
      );
    });

    return {
      query: searchQuery.trim(),
      leaves: matchedLeaves,
      courses: matchedCourses,
      isScheduleMatch,
      isPendingMatch,
      isApprovedMatch,
    };
  }, [searchQuery, leaves, courses]);

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
      <div className={`flex-1 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} flex flex-col min-w-0 w-full transition-all duration-300`}>
        <TeacherTopBar
          user={user}
          semester={selectedTerm}
          onSemesterChange={(t) => setSelectedTerm(t)}
          availableSemesters={academicTerms}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 space-y-6 ${isSidebarCollapsed ? 'max-w-none' : 'max-w-7xl'} w-full mx-auto transition-all duration-300`}>
          {/* Interactive Search Results Panel (เมื่อมีการค้นหา ชื่อนิสิต, รหัสนิสิต, การลา, ตารางสอน) */}
          {searchResults && (
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#7749BC]/70 dark:border-purple-600 shadow-md space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                      ผลการค้นหา: &ldquo;<span className="text-[#7749BC] dark:text-purple-300">{searchQuery}</span>&rdquo;
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      พบคำร้อง {searchResults.leaves.length} รายการ และตารางสอน {searchResults.courses.length} คาบ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 text-xs font-semibold text-neutral-600 dark:text-neutral-300 cursor-pointer self-start sm:self-auto flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ล้างการค้นหา</span>
                </button>
              </div>

              {/* 1. Matched Leaves */}
              {searchResults.leaves.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      คำร้องขอลาของนิสิต ({searchResults.leaves.length})
                    </h4>
                    <Link
                      href={`/teacher/requests?search=${encodeURIComponent(searchQuery)}`}
                      className="text-xs font-semibold text-[#7749BC] dark:text-purple-300 hover:underline"
                    >
                      ดูคำร้องทั้งหมดในหน้ารายการ →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {searchResults.leaves.slice(0, 6).map((leave) => {
                      const status = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
                      return (
                        <div
                          key={leave.id}
                          className="p-3 rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-neutral-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                {leave.studentName}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400">
                                {leave.studentCode}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                              {leave.courseName || leave.courseCode} • {leave.type}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">
                              เหตุผล: {leave.reason}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badge}`}>
                              {status.label}
                            </span>
                            <Link
                              href="/teacher/requests"
                              className="text-[10px] text-[#7749BC] dark:text-purple-300 font-bold hover:underline"
                            >
                              ตรวจสอบ →
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Matched Schedule / Courses */}
              {searchResults.courses.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    ตารางสอนและรายวิชาที่พบ ({searchResults.courses.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {searchResults.courses.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 text-xs space-y-1"
                      >
                        <span className="font-mono font-bold text-[#7749BC] dark:text-purple-300 block">
                          {c.code} กลุ่ม {c.group || '1'}
                        </span>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {c.day ? `วัน${c.day}` : ''} • ห้อง {c.room || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.leaves.length === 0 && searchResults.courses.length === 0 && (
                <div className="py-6 text-center text-xs text-neutral-400">
                  ไม่พบข้อมูลคำร้องหรือตารางสอนที่ตรงกับ &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          )}

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
