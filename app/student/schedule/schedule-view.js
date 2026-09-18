'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  UserRound,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { DAY_LABEL_TH } from '@/lib/ui';

export default function StudentScheduleView({ summaries = [] }) {
  // Extract unique academic terms
  const academicTerms = useMemo(() => {
    const terms = new Set();
    summaries.forEach((s) => {
      if (s.course?.term) terms.add(s.course.term);
    });
    if (terms.size === 0) terms.add('1/2569');
    return Array.from(terms).sort().reverse();
  }, [summaries]);

  const [selectedTerm, setSelectedTerm] = useState(academicTerms[0] || '1/2569');

  // Filter summaries for current selected term
  const termSummaries = useMemo(() => {
    return summaries.filter((s) => s.course?.term === selectedTerm);
  }, [summaries, selectedTerm]);

  // Calculations
  const stats = useMemo(() => {
    if (termSummaries.length === 0) return { avgAttendance: 100, atRiskCount: 0, totalLeaves: 0 };
    const avg = Math.round(
      termSummaries.reduce((sum, s) => sum + (s.attendanceRate || 100), 0) / termSummaries.length
    );
    const atRisk = termSummaries.filter((s) => (s.attendanceRate || 100) < 80).length;
    const leaves = termSummaries.reduce((sum, s) => sum + (s.approvedLeaves || 0), 0);
    return { avgAttendance: avg, atRiskCount: atRisk, totalLeaves: leaves };
  }, [termSummaries]);

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-neutral-200/80 dark:border-slate-700 text-neutral-600 hover:text-[#7749BC] dark:text-neutral-300 dark:hover:text-purple-400 transition-colors shadow-xs"
            title="กลับไปหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              <span>ตารางเรียนและโควต้าเวลาเรียน (Schedule & Attendance)</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              ตรวจสอบเวลาเรียน ห้องเรียน ผู้สอน และติดตามโควต้าการลาไม่เกินเกณฑ์ 80%
            </p>
          </div>
        </div>

        {/* Term Dropdown Selector */}
        <div className="relative self-start sm:self-auto min-w-[200px]">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-10 shadow-xs cursor-pointer"
          >
            {academicTerms.map((t) => (
              <option key={t} value={t}>
                ภาคเรียนที่ {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400">วิชาที่ลงทะเบียนในภาคเรียนนี้</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {termSummaries.length} <span className="text-xs font-normal text-neutral-400">รายวิชา</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400">เวลาเรียนเฉลี่ยรวม</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.avgAttendance}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400">สถานะโควต้าการเข้าเรียน</p>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 flex items-center gap-1.5">
              {stats.atRiskCount === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">ผ่านเกณฑ์ทุกวิชา (≥ 80%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400">เสี่ยงหมดสิทธิ์สอบ {stats.atRiskCount} วิชา</span>
                </>
              )}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 flex items-center justify-center">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            รายวิชาที่ลงทะเบียนในภาคเรียนที่ {selectedTerm} ({termSummaries.length} วิชา)
          </h2>
          <span className="text-xs text-neutral-400 font-medium">เกณฑ์เวลาเรียนขั้นต่ำ 80% ตามข้อบังคับ ม.บูรพา</span>
        </div>

        {termSummaries.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
            <BookOpen className="w-10 h-10 text-neutral-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">ไม่พบรายวิชาในภาคเรียนที่ {selectedTerm}</h3>
            <p className="text-xs text-neutral-400 mt-1">ลองสลับไปดูภาคเรียนอื่นจากตัวเลือกด้านบน</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {termSummaries.map((s) => {
              const course = s.course || {};
              const rate = s.attendanceRate ?? 100;
              const isAtRisk = rate < 80;
              const remainingLeaves = s.remainingLeavesQuota ?? Math.max(0, 3 - (s.approvedLeaves || 0));

              return (
                <div
                  key={s.id || course.id}
                  className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Top: Code & Group Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block font-mono text-xs font-bold text-[#7749BC] dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800 mb-1">
                          {course.code}
                        </span>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                          {course.name}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300 shrink-0">
                        กลุ่ม {course.group || '01'}
                      </span>
                    </div>

                    {/* Schedule info: Day, Time, Room, Teacher */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                        <Clock className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0" />
                        <span className="font-semibold">
                          วัน{DAY_LABEL_TH[course.day] || course.day || 'ตามตาราง'}:
                        </span>
                        <span>{course.time || '13:00 - 15:50'} น.</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span>ห้องเรียน: {course.room || 'IF-3M210'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UserRound className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{course.teacherName || course.teacher?.name || 'อาจารย์ผู้สอน'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Quota Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <span>สถิติเวลาเรียน:</span>
                          <span className={`font-bold ${isAtRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {rate}%
                          </span>
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {isAtRisk ? 'ต่ำกว่าเกณฑ์ 80%' : `ลาได้อีก ${remainingLeaves} ครั้ง`}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="h-2.5 w-full bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        {/* Minimum 80% mark line */}
                        <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-neutral-300 dark:bg-slate-600 z-10" title="เกณฑ์ 80%" />
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAtRisk ? 'bg-rose-500' : rate >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Action Button */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      ลาที่อนุมัติแล้ว: <strong className="text-neutral-800 dark:text-neutral-200">{s.approvedLeaves || 0} ครั้ง</strong>
                    </span>

                    <Link
                      href={`/student/leave?courseId=${course.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <span>ยื่นลาวิชานี้</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
