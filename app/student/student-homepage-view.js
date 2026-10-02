'use client';
/* Hallmark · macrostructure: Workbench · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileEdit,
  CalendarDays,
  History,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  X,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function StudentHomepageView({ user, summaries = [], leaves = [] }) {
  const [semesterIndex, setSemesterIndex] = useState(0);
  const semesters = useMemo(() => {
    const set = new Set();
    summaries.forEach((s) => {
      if (s.course?.term) set.add(s.course.term);
    });
    if (set.size === 0) {
      set.add('1/2569');
      set.add('2/2568');
      set.add('1/2568');
    }
    return Array.from(set);
  }, [summaries]);
  const currentSemester = semesters[semesterIndex] || '1/2569';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'agenda'
  const [selectedDayKey, setSelectedDayKey] = useState('ALL');

  // Statistics calculation for the 4 overview boxes
  const stats = useMemo(() => {
    const total = leaves.length;
    const approved = leaves.filter((l) => l.status === 'อนุมัติ').length;
    const pending = leaves.filter((l) => l.status === 'รออนุมัติ').length;
    const rejected = leaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
    return { total, approved, pending, rejected };
  }, [leaves]);

  // Dynamic Weekly Timetable Data calculated from student's registered courses
  const timetableSchedule = useMemo(() => {
    const DAYS = [
      { key: 'MO', dayEn: 'Monday', dayTh: 'จันทร์', dayColor: 'border-l-4 border-l-amber-400' },
      { key: 'TU', dayEn: 'Tuesday', dayTh: 'อังคาร', dayColor: 'border-l-4 border-l-pink-400' },
      { key: 'WE', dayEn: 'Wednesday', dayTh: 'พุธ', dayColor: 'border-l-4 border-l-emerald-400' },
      { key: 'TH', dayEn: 'Thursday', dayTh: 'พฤหัสบดี', dayColor: 'border-l-4 border-l-orange-400' },
      { key: 'FR', dayEn: 'Friday', dayTh: 'ศุกร์', dayColor: 'border-l-4 border-l-sky-400' },
    ];

    // Filter courses for this semester from summaries
    const courses = summaries
      .map((s) => s.course)
      .filter((c) => c && (c.term === currentSemester || !c.term));

    return DAYS.map(({ key, dayEn, dayTh, dayColor }) => {
      const dayCourses = courses.filter((c) => {
        const d = String(c.day || '').trim().toUpperCase();
        return d === key || d.includes(dayTh) || d.includes(dayEn.substring(0, 3).toUpperCase());
      });

      if (dayCourses.length === 0) {
        return {
          key,
          dayEn,
          dayTh,
          dayColor,
          courses: [],
          slots: [{ isEmpty: true, colSpan: 11, label: 'ไม่มีการเรียนการสอนในวันนี้' }],
        };
      }

      const parsedCourses = dayCourses
        .map((c) => {
          let startCol = 0;
          let endCol = 3;
          if (c.time && c.time.includes('-')) {
            const [startStr, endStr] = c.time.split('-');
            const startH = parseInt(startStr.split(':')[0], 10);
            const endParts = endStr.split(':');
            const endH = parseInt(endParts[0], 10);
            const endM = parseInt(endParts[1] || '0', 10);
            startCol = Math.max(0, Math.min(10, (isNaN(startH) ? 9 : startH) - 9));
            const adjustedEndH = endM > 0 ? endH + 1 : endH;
            endCol = Math.max(startCol + 1, Math.min(11, (isNaN(adjustedEndH) ? 12 : adjustedEndH) - 9));
          }

          const isMatch = !searchQuery || [c.code, c.name, c.room, c.teacherName || c.teacher?.name].some(
            (field) => field && String(field).toLowerCase().includes(searchQuery.toLowerCase())
          );

          return {
            id: c.id,
            fullCode: c.code,
            code: `${c.code}${c.group ? `-${c.group}` : ''}`,
            name: c.name,
            group: c.group || '1',
            room: c.room || 'ไม่ระบุห้อง',
            timeStr: `(${c.time || 'ไม่ระบุเวลา'})`,
            teacher: c.teacherName || c.teacher?.name || 'ไม่ระบุผู้สอน',
            startCol,
            endCol,
            colSpan: endCol - startCol,
            isMatch,
          };
        })
        .sort((a, b) => a.startCol - b.startCol);

      const slots = [];
      let currentCol = 0;

      for (const course of parsedCourses) {
        if (course.startCol > currentCol) {
          if (currentCol <= 3 && course.startCol > 3) {
            if (3 > currentCol) {
              slots.push({ isEmpty: true, colSpan: 3 - currentCol });
            }
            slots.push({ isBreak: true, colSpan: 1 });
            if (course.startCol > 4) {
              slots.push({ isEmpty: true, colSpan: course.startCol - 4 });
            }
          } else {
            slots.push({ isEmpty: true, colSpan: course.startCol - currentCol });
          }
        }

        slots.push(course);
        currentCol = Math.max(currentCol, course.endCol);
      }

      if (currentCol < 11) {
        if (currentCol <= 3) {
          if (3 > currentCol) {
            slots.push({ isEmpty: true, colSpan: 3 - currentCol });
          }
          slots.push({ isBreak: true, colSpan: 1 });
          if (11 > 4) {
            slots.push({ isEmpty: true, colSpan: 11 - 4 });
          }
        } else {
          slots.push({ isEmpty: true, colSpan: 11 - currentCol });
        }
      }

      return { key, dayEn, dayTh, dayColor, courses: parsedCourses, slots };
    });
  }, [summaries, currentSemester, searchQuery]);
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 font-sans text-neutral-800 dark:text-neutral-100">
      {/* ================= TOP NAVBAR ================= */}
      <Header
        user={{
          name: user?.name,
          role: user?.role || 'student',
          email: user?.email,
          faculty: user?.faculty || 'วิทยาการสารสนเทศ',
          major: user?.major || 'เทคโนโลยีสารสนเทศ',
        }}
        semester={currentSemester}
      />

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ================= TOP WORKBENCH CONTROL RIBBON ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Left: Semester Selector & Quick Nav */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ภาคเรียน:</span>
              <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setSemesterIndex((prev) => (prev > 0 ? prev - 1 : semesters.length - 1))}
                  className="p-1 text-slate-500 hover:text-[#7749BC] dark:hover:text-purple-400 transition-colors cursor-pointer rounded-lg hover:bg-white dark:hover:bg-slate-700"
                  title="ภาคเรียนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-xs text-[#7749BC] dark:text-purple-300 px-2 font-mono">
                  {currentSemester}
                </span>
                <button
                  type="button"
                  onClick={() => setSemesterIndex((prev) => (prev < semesters.length - 1 ? prev + 1 : 0))}
                  className="p-1 text-slate-500 hover:text-[#7749BC] dark:hover:text-purple-400 transition-colors cursor-pointer rounded-lg hover:bg-white dark:hover:bg-slate-700"
                  title="ภาคเรียนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Quick Action Navigation Buttons */}
            <div className="flex items-center gap-2">
              <Link
                href="/student/leave"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer active:translate-y-0.5"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>ยื่นใบลาใหม่</span>
              </Link>
              <Link
                href="/student/history"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">ประวัติการลา</span>
              </Link>
              <Link
                href="/student/stats"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">สถิติเวลาเรียน</span>
              </Link>
            </div>
          </div>

          {/* Right: Tactile Academic Search Bar */}
          <div className="w-full lg:w-80 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสวิชา, ชื่อวิชา, หรือห้องเรียน..."
              className="w-full py-2 pl-9.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#7749BC] focus:ring-1 focus:ring-[#7749BC] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                title="ล้างคำค้นหา"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ================= 4 STATUS SUMMARY METRIC CARDS (TACTILE & TABULAR) ================= */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
            {/* Box 1: Total */}
            <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">คำร้องทั้งหมด</span>
                <span className="w-2 h-2 rounded-full bg-[#7749BC]" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-[#7749BC] dark:text-purple-400 tracking-tight">
                  {stats.total}
                </span>
                <span className="text-xs text-slate-400">รายการ</span>
              </div>
            </div>

            {/* Box 2: Approved */}
            <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">อนุมัติแล้ว</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {stats.approved}
                </span>
                <span className="text-xs text-slate-400">รายการ</span>
              </div>
            </div>

            {/* Box 3: Pending */}
            <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">รอการพิจารณา</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400 tracking-tight">
                  {stats.pending}
                </span>
                <span className="text-xs text-slate-400">รายการ</span>
              </div>
            </div>

            {/* Box 4: Rejected */}
            <div className="p-4 sm:p-5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">ไม่อนุมัติ</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                  {stats.rejected}
                </span>
                <span className="text-xs text-slate-400">รายการ</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MAIN WEEKLY TIMETABLE GRID (TACTILE WORKBENCH) ================= */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Timetable Header / Title Bar */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#7749BC]" />
              <h2 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                ตารางเรียนประจำสัปดาห์ (Weekly Schedule)
              </h2>
            </div>

            {/* View Mode Toggle: Grid vs Daily Agenda */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ตารางสัปดาห์</span>
                <span className="sm:hidden">ตาราง</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">รายการรายวัน (มือถือ)</span>
                <span className="sm:hidden">รายวัน</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: Grid Table Container */}
          {viewMode === 'grid' && (
            <div className="overflow-x-auto p-3 sm:p-4">
              <table className="w-full border-collapse min-w-[1050px] text-xs text-center select-none">
                {/* Table Column Headers */}
                <thead>
                  <tr className="bg-slate-800 dark:bg-slate-950 text-slate-200 font-semibold border-b border-slate-700">
                    <th className="py-2.5 px-3 w-28 text-center border-r border-slate-700/80 text-xs font-semibold tracking-wide">
                      Date / Time
                    </th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">9:00-10:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">10:00-11:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">11:00-12:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono bg-slate-900">12:00-13:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">13:00-14:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">14:00-15:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">15:00-16:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">16:00-17:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">17:00-18:00</th>
                    <th className="py-2.5 px-2 border-r border-slate-700/80 text-[11px] font-medium font-mono">18:00-19:00</th>
                    <th className="py-2.5 px-2 text-[11px] font-medium font-mono">19:00-20:00</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {timetableSchedule.map((row) => (
                    <tr key={row.dayEn} className="h-22 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Day Column Header */}
                      <td className={`bg-slate-50 dark:bg-slate-800/60 border-r border-slate-200 dark:border-slate-800 p-2.5 ${row.dayColor || ''}`}>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {row.dayEn}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          วัน{row.dayTh}
                        </div>
                      </td>

                      {/* Slots in Day */}
                      {row.slots.map((slot, sIdx) => {
                        if (slot.isEmpty) {
                          return (
                            <td
                              key={sIdx}
                              colSpan={slot.colSpan}
                              className="border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10 text-slate-300 dark:text-slate-700 text-[10px]"
                            >
                              {slot.label || ''}
                            </td>
                          );
                        }

                        if (slot.isBreak) {
                          return (
                            <td
                              key={sIdx}
                              colSpan={slot.colSpan}
                              className="border-r border-slate-100 dark:border-slate-800/60 bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 text-[11px] font-medium"
                            >
                              พักกลางวัน
                            </td>
                          );
                        }

                        // Active Course Slot Box with Hallmark tactile card styling
                        return (
                          <td
                            key={sIdx}
                            colSpan={slot.colSpan}
                            className="p-1 border-r border-slate-200 dark:border-slate-800 align-middle"
                          >
                            <div
                              onClick={() => setSelectedCourse(slot)}
                              className={`w-full h-full min-h-[72px] rounded-xl bg-purple-50/90 dark:bg-purple-950/40 hover:bg-purple-100/90 dark:hover:bg-purple-900/60 border border-purple-200/90 dark:border-purple-800/80 p-2 flex flex-col items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs transition-all hover:-translate-y-0.5 group relative ${
                                searchQuery && !slot.isMatch ? 'opacity-25' : ''
                              } ${searchQuery && slot.isMatch ? 'ring-2 ring-[#7749BC] ring-offset-1' : ''}`}
                              title="คลิกเพื่อดูรายละเอียดและยื่นใบลาวิชานี้"
                            >
                              <span className="font-semibold text-xs text-[#7749BC] dark:text-purple-300 group-hover:underline underline-offset-2 tracking-tight">
                                {slot.code}
                              </span>
                              <span className="font-medium text-[11px] text-slate-800 dark:text-slate-200 mt-0.5">
                                {slot.room}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                {slot.timeStr}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW 2: Mobile Daily Agenda View */}
          {viewMode === 'agenda' && (
            <div className="p-4 sm:p-5 space-y-4">
              {/* Day Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 mr-1 shrink-0">เลือกวัน:</span>
                {[
                  { key: 'ALL', label: 'ทั้งหมด' },
                  { key: 'MO', label: 'จันทร์' },
                  { key: 'TU', label: 'อังคาร' },
                  { key: 'WE', label: 'พุธ' },
                  { key: 'TH', label: 'พฤหัสบดี' },
                  { key: 'FR', label: 'ศุกร์' },
                ].map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setSelectedDayKey(d.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedDayKey === d.key
                        ? 'bg-[#7749BC] text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Day by Day Course Listing */}
              <div className="space-y-6">
                {timetableSchedule
                  .filter((d) => selectedDayKey === 'ALL' || d.key === selectedDayKey)
                  .map((day) => {
                    const matchedCourses = day.courses.filter((c) => !searchQuery || c.isMatch);

                    return (
                      <div key={day.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              day.key === 'MO' ? 'bg-amber-400' :
                              day.key === 'TU' ? 'bg-pink-400' :
                              day.key === 'WE' ? 'bg-emerald-400' :
                              day.key === 'TH' ? 'bg-orange-400' : 'bg-sky-400'
                            }`} />
                            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                              วัน{day.dayTh} ({day.dayEn})
                            </h3>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {matchedCourses.length} วิชา
                          </span>
                        </div>

                        {matchedCourses.length === 0 ? (
                          <div className="py-6 text-center rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-400">
                            ไม่มีคาบเรียนในวันนี้
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {matchedCourses.map((c) => (
                              <div
                                key={c.code}
                                className={`p-4 rounded-xl border bg-slate-50/90 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between space-y-3 group shadow-2xs ${
                                  searchQuery && c.isMatch ? 'ring-2 ring-[#7749BC] ring-offset-1' : ''
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                                      {c.code}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>{c.room}</span>
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                                    {c.name}
                                  </h4>
                                </div>

                                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                    <Clock className="w-3.5 h-3.5 text-[#7749BC]" />
                                    <span className="font-mono text-[11px]">{c.rawTime || c.timeStr}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="truncate text-[11px]">{c.teacher}</span>
                                  </div>
                                </div>

                                <div className="pt-1 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCourse(c)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                  >
                                    รายละเอียด
                                  </button>
                                  <Link
                                    href={`/student/leave?courseId=${c.id || ''}&courseCode=${c.fullCode}`}
                                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:translate-y-0.5"
                                  >
                                    <FileEdit className="w-3.5 h-3.5" />
                                    <span>ยื่นใบลาวิชานี้</span>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Timetable Footer Note */}
          <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-100 border border-purple-300" />
              <span>ตารางเรียนภาคเรียนที่ {currentSemester} (ระบบลงทะเบียนมหาวิทยาลัยบูรพา)</span>
            </div>
            <Link
              href="/student/leave"
              className="text-[#7749BC] dark:text-purple-300 font-medium hover:underline flex items-center gap-1"
            >
              <span>แบบฟอร์มยื่นใบลา</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ================= MODAL: COURSE DETAIL & DEDICATED LEAVE ACTION ================= */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300">
                  {selectedCourse.fullCode} (กลุ่ม {selectedCourse.group})
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                  {selectedCourse.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <Clock className="w-4 h-4 text-[#7749BC]" />
                <span className="font-semibold">เวลาเรียน:</span>
                <span>{selectedCourse.timeStr}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <MapPin className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold">ห้องเรียน:</span>
                <span>{selectedCourse.room}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold">อาจารย์ผู้สอน:</span>
                <span>{selectedCourse.teacher}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                ปิด
              </button>
              <Link
                href={`/student/leave?courseId=${selectedCourse.id || ''}&courseCode=${selectedCourse.fullCode}`}
                className="px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>ยื่นใบลาวิชานี้ (ตามตารางเรียน)</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer role={user?.role || 'student'} />
    </div>
  );
}
