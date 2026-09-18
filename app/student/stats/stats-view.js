'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Clock,
  HeartPulse,
  User,
  Users,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

export default function StudentStatsView({ summaries = [], leaves = [] }) {
  // Extract unique academic terms
  const academicTerms = useMemo(() => {
    const terms = new Set();
    summaries.forEach((s) => {
      if (s.course?.term) terms.add(s.course.term);
    });
    leaves.forEach((l) => {
      if (l.courseTerm && l.courseTerm !== '-') terms.add(l.courseTerm);
    });
    if (terms.size === 0) terms.add('1/2569');
    return Array.from(terms).sort().reverse();
  }, [summaries, leaves]);

  const [selectedTerm, setSelectedTerm] = useState('all');

  // Multi-semester comparison data
  const semesterBreakdown = useMemo(() => {
    return academicTerms.map((term) => {
      const termLeaves = leaves.filter((l) => {
        const cTerm = l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term;
        return cTerm === term;
      });
      const termSummaries = summaries.filter((s) => s.course?.term === term);
      const avgAtt =
        termSummaries.length > 0
          ? Math.round(termSummaries.reduce((acc, curr) => acc + (curr.attendanceRate || 100), 0) / termSummaries.length)
          : 100;

      return {
        term,
        totalLeaves: termLeaves.length,
        approvedLeaves: termLeaves.filter((l) => l.status === 'อนุมัติ').length,
        pendingLeaves: termLeaves.filter((l) => l.status === 'รออนุมัติ').length,
        rejectedLeaves: termLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length,
        sickLeaves: termLeaves.filter((l) => l.type === 'ลาป่วย').length,
        personalLeaves: termLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length,
        activityLeaves: termLeaves.filter((l) => l.type === 'ลากิจกรรม').length,
        otherLeaves: termLeaves.filter((l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ').length,
        courseCount: termSummaries.length,
        avgAttendance: avgAtt,
      };
    });
  }, [academicTerms, leaves, summaries]);

  // Current scope stats
  const stats = useMemo(() => {
    const relevantLeaves =
      selectedTerm === 'all'
        ? leaves
        : leaves.filter((l) => (l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term) === selectedTerm);

    const total = relevantLeaves.length;
    const approved = relevantLeaves.filter((l) => l.status === 'อนุมัติ').length;
    const pending = relevantLeaves.filter((l) => l.status === 'รออนุมัติ').length;
    const rejected = relevantLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
    const cancelled = relevantLeaves.filter((l) => l.status === 'ยกเลิก').length;

    const sick = relevantLeaves.filter((l) => l.type === 'ลาป่วย').length;
    const personal = relevantLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
    const activity = relevantLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
    const others = relevantLeaves.filter((l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ').length;

    return { total, approved, pending, rejected, cancelled, sick, personal, activity, others };
  }, [leaves, summaries, selectedTerm]);

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
              <BarChart3 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>สถิติการลาเรียน (Leave Statistics & Analytics)</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              วิเคราะห์สถิติการลาแต่ละประเภท อัตราการอนุมัติ และเปรียบเทียบย้อนหลังทุกภาคการศึกษา
            </p>
          </div>
        </div>

        {/* Term Dropdown Selector */}
        <div className="relative self-start sm:self-auto min-w-[220px]">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-10 shadow-xs cursor-pointer"
          >
            <option value="all">ทุกภาคการศึกษา (All Semesters)</option>
            {academicTerms.map((t) => (
              <option key={t} value={t}>
                เฉพาะภาคเรียนที่ {t}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 1. Status Overview KPI Cards */}
      <div>
        <h2 className="text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wider mb-3">
          1. สรุปสถานะการพิจารณาคำขอ (Status Breakdown)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-1.5">
              <span>คำขอทั้งหมด</span>
              <BarChart3 className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {stats.total} <span className="text-xs font-normal text-neutral-400">ครั้ง</span>
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">ยื่นในระบบทั้งหมด</p>
          </div>

          <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs mb-1.5">
              <span>อนุมัติแล้ว</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {stats.approved} <span className="text-xs font-normal opacity-80">ครั้ง</span>
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              คิดเป็น {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% ของคำขอ
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 shadow-xs">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs mb-1.5">
              <span>รอการพิจารณา</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">
              {stats.pending} <span className="text-xs font-normal opacity-80">ครั้ง</span>
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">รออาจารย์ตรวจสอบ</p>
          </div>

          <div className="p-5 rounded-3xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 shadow-xs">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs mb-1.5">
              <span>ไม่อนุมัติ / ยกเลิก</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-rose-700 dark:text-rose-300">
              {stats.rejected + stats.cancelled} <span className="text-xs font-normal opacity-80">ครั้ง</span>
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
              (ไม่อนุมัติ {stats.rejected} • ยกเลิก {stats.cancelled})
            </p>
          </div>
        </div>
      </div>

      {/* 2. Leave Category Distribution */}
      <div>
        <h2 className="text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wider mb-3">
          2. สถิติแยกตามประเภทการลา (Leave Categories)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                <HeartPulse className="w-4 h-4 text-sky-500" />
                <span>ลาป่วย</span>
              </div>
              <p className="text-xl font-bold text-sky-800 dark:text-sky-200">{stats.sick} ครั้ง</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900 text-sky-700 dark:text-sky-300">
              {stats.total > 0 ? Math.round((stats.sick / stats.total) * 100) : 0}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7749BC] dark:text-purple-300">
                <User className="w-4 h-4 text-[#7749BC]" />
                <span>ลากิจส่วนตัว</span>
              </div>
              <p className="text-xl font-bold text-[#7749BC] dark:text-purple-200">{stats.personal} ครั้ง</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900 text-[#7749BC] dark:text-purple-300">
              {stats.total > 0 ? Math.round((stats.personal / stats.total) * 100) : 0}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>ลากิจกรรม</span>
              </div>
              <p className="text-xl font-bold text-indigo-800 dark:text-indigo-200">{stats.activity} ครั้ง</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900 text-indigo-700 dark:text-indigo-300">
              {stats.total > 0 ? Math.round((stats.activity / stats.total) * 100) : 0}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>อื่น ๆ</span>
              </div>
              <p className="text-xl font-bold text-amber-800 dark:text-amber-200">{stats.others} ครั้ง</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900 text-amber-700 dark:text-amber-300">
              {stats.total > 0 ? Math.round((stats.others / stats.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Multi-Semester Comparison */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wider">
            3. สถิติเปรียบเทียบแต่ละภาคการศึกษา (Multi-Semester Comparison)
          </h2>
          <span className="text-xs text-neutral-400">คลิกที่การ์ดเพื่อสลับตัวกรอง</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {semesterBreakdown.map((sb) => {
            const isSelected = selectedTerm === sb.term;
            return (
              <div
                key={sb.term}
                onClick={() => setSelectedTerm(sb.term)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-4 ${
                  isSelected
                    ? 'bg-purple-50/80 dark:bg-purple-950/50 border-[#7749BC] ring-2 ring-[#7749BC]/25 shadow-md'
                    : 'bg-white/80 dark:bg-slate-900/80 border-neutral-200/80 dark:border-slate-800 hover:border-[#7749BC]/40 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      ภาคเรียนที่ {sb.term}
                    </h3>
                  </div>
                  {isSelected ? (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#7749BC] text-white">
                      เลือกอยู่
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#7749BC] dark:text-purple-300 font-semibold hover:underline">
                      เลือกดู →
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-200/50 dark:border-slate-800/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">เวลาเรียนเฉลี่ย:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{sb.avgAttendance}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">ยื่นใบลาทั้งหมด:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">{sb.totalLeaves} ครั้ง</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">อนุมัติแล้ว:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{sb.approvedLeaves} ครั้ง</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">วิชาที่ลงทะเบียน:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">{sb.courseCount} วิชา</strong>
                  </div>
                </div>

                {/* Mini Breakdown Bar */}
                <div className="pt-2">
                  <div className="h-2 w-full bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${sb.totalLeaves > 0 ? (sb.sickLeaves / sb.totalLeaves) * 100 : 0}%` }}
                      className="bg-sky-500 h-full"
                      title={`ป่วย ${sb.sickLeaves}`}
                    />
                    <div
                      style={{ width: `${sb.totalLeaves > 0 ? (sb.personalLeaves / sb.totalLeaves) * 100 : 0}%` }}
                      className="bg-purple-500 h-full"
                      title={`กิจ ${sb.personalLeaves}`}
                    />
                    <div
                      style={{ width: `${sb.totalLeaves > 0 ? (sb.activityLeaves / sb.totalLeaves) * 100 : 0}%` }}
                      className="bg-indigo-500 h-full"
                      title={`กิจกรรม ${sb.activityLeaves}`}
                    />
                    <div
                      style={{ width: `${sb.totalLeaves > 0 ? (sb.otherLeaves / sb.totalLeaves) * 100 : 0}%` }}
                      className="bg-amber-500 h-full"
                      title={`อื่น ๆ ${sb.otherLeaves}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
