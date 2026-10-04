'use client';
/* Hallmark · macrostructure: Workbench · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  FileEdit,
  CalendarDays,
  History,
  BarChart3,
  Clock,
  ArrowRight,
  ChevronRight,
  BookOpen,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  LayoutDashboard,
  Sparkles,
  GraduationCap,
  Download,
  ArrowLeft,
  X,
} from 'lucide-react';
import StudentSidebar from '@/components/StudentSidebar';
import StudentTopBar from '@/components/StudentTopBar';
import StudentScheduleGrid from '@/components/StudentScheduleGrid';
import LeaveForm from './leave/leave-form';
import StudentStatsView from './stats/stats-view';
import StudentHistoryView from './history/history-view';
import StudentScheduleView from './schedule/schedule-view';

export default function StudentHomepageView({
  user,
  summaries = [],
  leaves = [],
  courses = [],
  initialTab = 'home',
  initialCourseId = '',
  initialCourseCode = '',
  initialStatus = 'all',
  resubmitId = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'home');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetCourseForLeave, setTargetCourseForLeave] = useState(initialCourseId);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const tabParam = sp.get('tab');
      if (tabParam && ['home', 'leave', 'stats', 'history', 'schedule'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      const cId = sp.get('courseId');
      if (cId) setTargetCourseForLeave(cId);

      // Handle popstate for browser back/forward buttons
      const handlePopState = () => {
        const currentSp = new URLSearchParams(window.location.search);
        const t = currentSp.get('tab') || 'home';
        setActiveTab(t);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  function handleSwitchTab(newTab, extraParams = {}) {
    setActiveTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newTab === 'home') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', newTab);
      }
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v) url.searchParams.set(k, v);
        else url.searchParams.delete(k);
      });
      window.history.pushState(null, '', url.toString());
    }
  }

  // Extract unique academic semesters from summaries and leaves
  const semesters = useMemo(() => {
    const set = new Set();
    summaries.forEach((s) => {
      const term = s.course?.term || s.term;
      if (term) set.add(term);
    });
    leaves.forEach((l) => {
      if (l.courseTerm && l.courseTerm !== '-') set.add(l.courseTerm);
    });
    if (set.size === 0) {
      set.add('1/2569');
      set.add('2/2568');
      set.add('1/2568');
    }
    return Array.from(set).sort().reverse();
  }, [summaries, leaves]);

  const [selectedTerm, setSelectedTerm] = useState('1/2569');

  useEffect(() => {
    if (semesters.length > 0 && !semesters.includes(selectedTerm)) {
      setSelectedTerm(semesters[0]);
    }
  }, [semesters, selectedTerm]);

  // Statistics calculation for the 4 overview boxes (Student's own leaves)
  const stats = useMemo(() => {
    const total = leaves.length;
    const approved = leaves.filter((l) => l.status === 'อนุมัติ').length;
    const pending = leaves.filter((l) => l.status === 'รออนุมัติ').length;
    const rejected = leaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
    return { total, approved, pending, rejected };
  }, [leaves]);

  // Filter summaries for the selected semester
  const currentSummaries = useMemo(() => {
    return summaries.filter((s) => {
      const term = s.course?.term || s.term;
      return !term || term === selectedTerm;
    });
  }, [summaries, selectedTerm]);

  // Available courses list for LeaveForm
  const availableCourses = useMemo(() => {
    if (courses && courses.length > 0) return courses;
    return summaries.map((s) => s.course).filter(Boolean);
  }, [courses, summaries]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-neutral-800 dark:text-neutral-100">
      {/* 1. Left Fixed Sidebar (StudentSidebar) with in-place session tab switching */}
      <StudentSidebar
        activeTab={activeTab}
        onSelectTab={(tabKey) => handleSwitchTab(tabKey)}
        pendingCount={stats.pending}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 lg:pl-64 sm:lg:pl-68 flex flex-col min-w-0">
        <StudentTopBar
          user={user}
          semester={selectedTerm}
          onSemesterChange={(t) => setSelectedTerm(t)}
          availableSemesters={semesters}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="ค้นหารหัสวิชา, ชื่อวิชา, หรือห้องเรียน..."
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* ================= SESSION 1: HOME (หน้าหลัก) ================= */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 4 Connected Horizontal Summary Boxes (Strictly matching wireframe) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-2 border-neutral-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
                {/* Box 1: คำร้องขอลาทั้งหมด */}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('history', { status: 'all' })}
                  className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-purple-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
                  title="ดูประวัติการลาทั้งหมด"
                >
                  <p className="text-xs sm:text-sm font-bold truncate group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors">
                    คำร้องขอลาทั้งหมด
                  </p>
                  <p className="text-lg sm:text-2xl font-black font-mono mt-1">: {stats.total}</p>
                </button>

                {/* Box 2: อนุมัติ */}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('history', { status: 'อนุมัติ' })}
                  className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
                  title="ดูคำขอที่อนุมัติแล้ว"
                >
                  <p className="text-xs sm:text-sm font-bold truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                    อนุมัติ
                  </p>
                  <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                    : {stats.approved}
                  </p>
                </button>

                {/* Box 3: รออนุมัติ */}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('history', { status: 'รออนุมัติ' })}
                  className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-amber-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
                  title="ดูคำขอที่รออนุมัติ"
                >
                  <p className="text-xs sm:text-sm font-bold truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    รออนุมัติ
                  </p>
                  <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
                    : {stats.pending}
                  </p>
                </button>

                {/* Box 4: ไม่อนุมัติ */}
                <button
                  type="button"
                  onClick={() => handleSwitchTab('history', { status: 'ไม่อนุมัติ' })}
                  className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-rose-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
                  title="ดูคำขอที่ไม่อนุมัติ"
                >
                  <p className="text-xs sm:text-sm font-bold truncate group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                    ไม่อนุมัติ
                  </p>
                  <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">
                    : {stats.rejected}
                  </p>
                </button>
              </div>

              {/* Timetable Section (ตารางเรียนประจำสัปดาห์ - no overlapping text, with Lesson prep modal) */}
              <section id="schedule-section">
                <StudentScheduleGrid
                  summaries={currentSummaries}
                  semester={selectedTerm}
                  searchQuery={searchQuery}
                  onSelectCourseForLeave={(cId, cCode) => {
                    setTargetCourseForLeave(cId);
                    handleSwitchTab('leave', { courseId: cId, code: cCode });
                  }}
                />
              </section>

              {/* Student Action / Alert Banner */}
              {stats.pending > 0 ? (
                <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        มีคำขอลาเรียนรออาจารย์พิจารณา {stats.pending} รายการ
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        คุณสามารถตรวจสอบสถานะการอนุมัติหรือผลการพิจารณาได้ที่หน้าประวัติการลา
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('leave')}
                      className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-[#7749BC]" />
                      <span>ยื่นใบลาใหม่</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('history', { status: 'รออนุมัติ' })}
                      className="px-4 py-2 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>ดูประวัติการลา</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-3xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileEdit className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                        ต้องการยื่นคำขอลาเรียน (ลากิจ / ลาป่วย)?
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                        กรอกข้อมูลคำขอและแนบเอกสารหลักฐานทางการแพทย์เพื่อให้ระบบแจ้งเตือนอาจารย์ผู้สอนทันที
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('leave')}
                    className="px-4 py-2.5 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>ยื่นคำขอลาเรียน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Attendance Health Overview (สรุปเวลาเรียนรายวิชา - FIXED BACKGROUND COLORS) */}
              {currentSummaries.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shadow-2xs">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                          สรุปเวลาเรียนรายวิชา (Attendance Health)
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          สถิติการเข้าเรียนและเกณฑ์สิทธิ์สอบประจำภาคเรียนที่ {selectedTerm}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchTab('stats')}
                      className="text-xs font-bold text-[#7749BC] dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>ดูสถิติทั้งหมด</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Clean, high-contrast dark mode cards without muddy gray */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {currentSummaries.map((s, idx) => {
                      const c = s.course || s;
                      const percent = s.percent !== undefined ? s.percent : 100;
                      const isRisk = percent < 80;

                      return (
                        <div
                          key={c.id || idx}
                          className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-xs font-bold text-[#7749BC] dark:text-purple-300">
                                {c.code}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100/90 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                                กลุ่ม {c.group || '1'}
                              </span>
                            </div>
                            <h4
                              className="font-bold text-sm text-neutral-900 dark:text-white mt-1.5 truncate"
                              title={c.name}
                            >
                              {c.name}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              {c.teacherName || c.teacher?.name || 'อาจารย์ผู้สอน'}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                                เวลาเรียนสะสม
                              </span>
                              <span
                                className={`font-mono font-black text-sm ${
                                  isRisk
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {percent}%
                              </span>
                            </div>
                            {/* High contrast Progress Bar */}
                            <div className="w-full h-2 bg-neutral-200 dark:bg-slate-700/90 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isRisk ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-0.5 font-medium">
                              <span>
                                เข้าเรียน {s.attended || 15}/{s.total || 15} คาบ
                              </span>
                              <span>ลา {s.leaves || 0} ครั้ง</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= SESSION 2: LEAVE FORM (ยื่นคำขอลาเรียน) ================= */}
          {activeTab === 'leave' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('home')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-neutral-300 hover:text-[#7749BC] transition-colors cursor-pointer"
                    title="กลับไปหน้าหลัก"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      ยื่นคำขอลาเรียน (Leave Application)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      กรอกรายละเอียดคำขอลาเรียน แนบหลักฐาน ระบบจะส่งแจ้งเตือนอาจารย์ผู้สอนทันที
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
                <LeaveForm
                  courses={availableCourses}
                  initialCourseId={targetCourseForLeave || availableCourses[0]?.id || ''}
                  lockCourse={Boolean(targetCourseForLeave)}
                  resubmitId={resubmitId}
                  onSuccess={() => handleSwitchTab('history')}
                />
              </div>
            </div>
          )}

          {/* ================= SESSION 3: STATS (สถิติเวลาเรียน) ================= */}
          {activeTab === 'stats' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('home')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-neutral-300 hover:text-[#7749BC] transition-colors cursor-pointer"
                    title="กลับไปหน้าหลัก"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      สถิติเวลาเรียนและการลา (Attendance Statistics)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      ภาพรวมเวลาเรียน โควต้าการลา และการวิเคราะห์ความเสี่ยงรายวิชา
                    </p>
                  </div>
                </div>
              </div>

              <StudentStatsView summaries={summaries} leaves={leaves} />
            </div>
          )}

          {/* ================= SESSION 4: HISTORY (ประวัติการลา) ================= */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('home')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-neutral-300 hover:text-[#7749BC] transition-colors cursor-pointer"
                    title="กลับไปหน้าหลัก"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      ประวัติการลาเรียน (Leave History)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      ตรวจสอบสถานะคำขอลา ผลการอนุมัติ และประวัติคำขอย้อนหลัง
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSwitchTab('leave')}
                  className="px-3.5 py-2 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>ยื่นใบลาใหม่</span>
                </button>
              </div>

              <StudentHistoryView leaves={leaves} summaries={summaries} initialStatus={initialStatus} />
            </div>
          )}

          {/* ================= SESSION 5: SCHEDULE (ตารางเรียน & แผนการเรียน) ================= */}
          {activeTab === 'schedule' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('home')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-neutral-300 hover:text-[#7749BC] transition-colors cursor-pointer"
                    title="กลับไปหน้าหลัก"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                      ตารางเรียน & การเตรียมตัวก่อนเรียน (Class Schedule & Prep)
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      ตารางเรียนรายสัปดาห์ หัวข้อการเรียนประจำสัปดาห์ และแนวข้อสอบสำหรับนิสิต
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Grid with pre-class prep and exam topics */}
              <StudentScheduleGrid
                summaries={currentSummaries}
                semester={selectedTerm}
                searchQuery={searchQuery}
                onSelectCourseForLeave={(cId, cCode) => {
                  setTargetCourseForLeave(cId);
                  handleSwitchTab('leave', { courseId: cId, code: cCode });
                }}
              />

              {/* Full Detailed Course Outline Cards */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                      แนวข้อสอบ & ข้อมูลเตรียมตัวก่อนเรียนประจำรายวิชา (Syllabus & Exam Outline)
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      สรุปเนื้อหาสำคัญที่ต้องเตรียมตัวก่อนเข้าห้องเรียน และประเด็นสำคัญสำหรับสอบ
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {currentSummaries.map((s, idx) => {
                    const c = s.course || s;
                    return (
                      <div
                        key={c.id || idx}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-[#7749BC] dark:text-purple-300">
                              {c.code} • กลุ่ม {c.group || '1'}
                            </span>
                            <h4 className="font-bold text-sm text-neutral-900 dark:text-white mt-0.5">
                              {c.name}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {c.teacherName || c.teacher?.name} • ห้อง {c.room} ({c.time})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetCourseForLeave(c.id);
                              handleSwitchTab('leave', { courseId: c.id, code: c.code });
                            }}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <FileEdit className="w-3 h-3" />
                            <span>ยื่นใบลา</span>
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 inline-block">
                            สัปดาห์นี้
                          </span>
                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            การเตรียมตัว: ทบทวนเนื้อหาบทเรียนก่อนหน้า และเตรียมความพร้อมสำหรับคาบเรียนถัดไป
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
