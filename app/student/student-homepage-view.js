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
} from 'lucide-react';
import StudentSidebar from '@/components/StudentSidebar';
import StudentTopBar from '@/components/StudentTopBar';
import StudentScheduleGrid from '@/components/StudentScheduleGrid';

export default function StudentHomepageView({ user, summaries = [], leaves = [] }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row font-sans text-neutral-800 dark:text-neutral-100">
      {/* 1. Left Fixed Sidebar (StudentSidebar) */}
      <StudentSidebar
        activeTab="home"
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
          {/* 4 Connected Horizontal Summary Boxes (Strictly matching wireframe) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border-2 border-neutral-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {/* Box 1: คำร้องขอลาทั้งหมด */}
            <Link
              href="/student/history"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-purple-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูประวัติการลาทั้งหมด"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors">
                คำร้องขอลาทั้งหมด
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1">: {stats.total}</p>
            </Link>

            {/* Box 2: อนุมัติ */}
            <Link
              href="/student/history?status=อนุมัติ"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-emerald-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูคำขอที่อนุมัติแล้ว"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                อนุมัติ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-emerald-600 dark:text-emerald-400">
                : {stats.approved}
              </p>
            </Link>

            {/* Box 3: รออนุมัติ */}
            <Link
              href="/student/history?status=รออนุมัติ"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-amber-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูคำขอที่รออนุมัติ"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                รออนุมัติ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-amber-600 dark:text-amber-400">
                : {stats.pending}
              </p>
            </Link>

            {/* Box 4: ไม่อนุมัติ */}
            <Link
              href="/student/history?status=ไม่อนุมัติ"
              className="p-4 sm:p-5 text-left transition-colors cursor-pointer hover:bg-rose-50/60 dark:hover:bg-slate-800/50 text-neutral-800 dark:text-neutral-200 block group"
              title="ดูคำขอที่ไม่อนุมัติ"
            >
              <p className="text-xs sm:text-sm font-bold truncate group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                ไม่อนุมัติ
              </p>
              <p className="text-lg sm:text-2xl font-black font-mono mt-1 text-rose-600 dark:text-rose-400">
                : {stats.rejected}
              </p>
            </Link>
          </div>

          {/* Timetable Section (ตารางเรียนประจำสัปดาห์) */}
          <section id="schedule-section">
            <StudentScheduleGrid
              summaries={currentSummaries}
              semester={selectedTerm}
              searchQuery={searchQuery}
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
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    มีคำขอลาเรียนรออาจารย์พิจารณา {stats.pending} รายการ
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    คุณสามารถตรวจสอบสถานะการอนุมัติหรือผลการพิจารณาได้ที่หน้าประวัติการลา
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Link
                  href="/student/leave"
                  className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-750 text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <FileEdit className="w-3.5 h-3.5 text-[#7749BC]" />
                  <span>ยื่นใบลาใหม่</span>
                </Link>
                <Link
                  href="/student/history?status=รออนุมัติ"
                  className="px-4 py-2 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>ดูประวัติการลา</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-3xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    ต้องการยื่นคำขอลาเรียน (ลากิจ / ลาป่วย)?
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                    กรอกข้อมูลคำขอและแนบเอกสารหลักฐานทางการแพทย์เพื่อให้ระบบแจ้งเตือนอาจารย์ผู้สอนทันที
                  </p>
                </div>
              </div>
              <Link
                href="/student/leave"
                className="px-4 py-2 rounded-2xl bg-[#7749BC] hover:bg-[#683ca8] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5 shrink-0"
              >
                <span>ยื่นคำขอลาเรียน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Attendance Health Overview (สรุปเวลาเรียนรายวิชาที่ลงทะเบียน) */}
          {currentSummaries.length > 0 && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                      สรุปเวลาเรียนรายวิชา (Attendance Health)
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      สถิติการเข้าเรียนและเกณฑ์สิทธิ์สอบประจำภาคเรียนที่ {selectedTerm}
                    </p>
                  </div>
                </div>
                <Link
                  href="/student/stats"
                  className="text-xs font-bold text-[#7749BC] dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>ดูสถิติทั้งหมด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentSummaries.map((s, idx) => {
                  const c = s.course || s;
                  const percent = s.percent !== undefined ? s.percent : 100;
                  const isRisk = percent < 80;

                  return (
                    <div
                      key={c.id || idx}
                      className="p-3.5 rounded-2xl border border-neutral-100 dark:border-slate-800/80 bg-neutral-50/50 dark:bg-slate-850/50 flex flex-col justify-between space-y-2.5 transition-all hover:bg-white dark:hover:bg-slate-800"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs font-bold text-[#7749BC] dark:text-purple-400">
                            {c.code}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-200/60 dark:bg-slate-700/60 text-neutral-700 dark:text-neutral-300">
                            กลุ่ม {c.group || '1'}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 mt-1 truncate" title={c.name}>
                          {c.name}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {c.teacherName || c.teacher?.name || 'อาจารย์ผู้สอน'}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-1.5 border-t border-neutral-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-neutral-500">เวลาเรียนสะสม</span>
                          <span
                            className={`font-mono font-bold text-xs ${
                              isRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {percent}%
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-neutral-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isRisk ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5">
                          <span>เข้าเรียน {s.attended || 15}/{s.total || 15} คาบ</span>
                          <span>ลา {s.leaves || 0} ครั้ง</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
