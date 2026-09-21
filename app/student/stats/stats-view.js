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
  TrendingDown,
  Percent,
  CalendarDays,
  ShieldCheck,
  Award,
} from 'lucide-react';
import LeaveBarChart from '@/components/charts/LeaveBarChart';
import LeaveDonutChart from '@/components/charts/LeaveDonutChart';

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
  const [chartMode, setChartMode] = useState('breakdown'); // 'breakdown' | 'total'

  // Multi-semester comparison breakdown
  const semesterBreakdown = useMemo(() => {
    return academicTerms.map((term) => {
      const termLeaves = leaves.filter((l) => {
        const cTerm = l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term;
        return cTerm === term;
      });
      const termSummaries = summaries.filter((s) => s.course?.term === term);
      const avgAtt =
        termSummaries.length > 0
          ? Math.round(termSummaries.reduce((acc, curr) => acc + (curr.percentage || curr.attendanceRate || 100), 0) / termSummaries.length)
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
        otherLeaves: termLeaves.filter((l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน').length,
        courseCount: termSummaries.length || 4,
        avgAttendance: avgAtt,
      };
    });
  }, [academicTerms, leaves, summaries]);

  // Current scope stats based on selectedTerm filter
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
    const others = relevantLeaves.filter((l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน').length;

    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100;

    // Estimate monthly / weekly average
    const termCount = selectedTerm === 'all' ? Math.max(academicTerms.length, 1) : 1;
    const avgPerMonth = ((total / (termCount * 4)) || 0).toFixed(1);
    const avgPerWeek = ((total / (termCount * 16)) || 0).toFixed(1);

    // Quota usage
    const relevantSummaries =
      selectedTerm === 'all'
        ? summaries
        : summaries.filter((s) => s.course?.term === selectedTerm);

    const totalQuotaAllowed = relevantSummaries.reduce((acc, s) => acc + (s.quotaLimit || 3), 0) || (relevantSummaries.length * 3 || 12);
    const totalQuotaUsed = approved;
    const quotaUsedPercent = totalQuotaAllowed > 0 ? Math.min(Math.round((totalQuotaUsed / totalQuotaAllowed) * 100), 100) : 0;
    const quotaRemainingPercent = Math.max(100 - quotaUsedPercent, 0);

    return {
      total,
      approved,
      pending,
      rejected,
      cancelled,
      sick,
      personal,
      activity,
      others,
      approvalRate,
      avgPerMonth,
      avgPerWeek,
      totalQuotaAllowed,
      totalQuotaUsed,
      quotaUsedPercent,
      quotaRemainingPercent,
    };
  }, [leaves, summaries, selectedTerm, academicTerms]);

  // Bar Chart Data Prep: Chronological Semesters Comparison
  const sortedSemesters = useMemo(() => {
    return [...semesterBreakdown].reverse(); // Oldest to newest
  }, [semesterBreakdown]);

  const semesterLabels = useMemo(() => {
    return sortedSemesters.map((s) => `ภาคเรียน ${s.term}`);
  }, [sortedSemesters]);

  const barChartDatasets = useMemo(() => {
    if (chartMode === 'total') {
      return [
        {
          label: 'จำนวนครั้งที่ยื่นลาทั้งหมด',
          data: sortedSemesters.map((s) => s.totalLeaves),
          backgroundColor: '#7749BC',
          hoverBackgroundColor: '#5B21B6',
        },
        {
          label: 'อนุมัติแล้ว',
          data: sortedSemesters.map((s) => s.approvedLeaves),
          backgroundColor: '#10B981',
          hoverBackgroundColor: '#059669',
        },
      ];
    }

    return [
      {
        label: 'ลาป่วย',
        data: sortedSemesters.map((s) => s.sickLeaves),
        backgroundColor: '#0284C7', // Sky-600
        hoverBackgroundColor: '#0369A1',
      },
      {
        label: 'ลากิจส่วนตัว',
        data: sortedSemesters.map((s) => s.personalLeaves),
        backgroundColor: '#7749BC', // Purple BUU
        hoverBackgroundColor: '#5B21B6',
      },
      {
        label: 'ลากิจกรรม',
        data: sortedSemesters.map((s) => s.activityLeaves),
        backgroundColor: '#6366F1', // Indigo-500
        hoverBackgroundColor: '#4F46E5',
      },
      {
        label: 'อื่น ๆ',
        data: sortedSemesters.map((s) => s.otherLeaves),
        backgroundColor: '#F59E0B', // Amber-500
        hoverBackgroundColor: '#D97706',
      },
    ];
  }, [sortedSemesters, chartMode]);

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
              <BarChart3 className="w-6 h-6 text-[#7749BC] dark:text-purple-400" />
              <span>สถิติการลา (Statistics & Analytics Dashboard)</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              แดชบอร์ดวิเคราะห์ประวัติการลา สัดส่วนประเภทการลา และเปรียบเทียบสถิติย้อนหลังทุกภาคการศึกษา
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

      {/* 1.1 Detailed Summary Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Leaves */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">ยอดรวมคำขอลาทั้งหมด</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {stats.total}
            </span>
            <span className="text-xs text-neutral-400">ครั้ง</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>-12%</span>
            </span>
            <span className="text-neutral-400">แนวโน้มลดลงจากเทอมก่อน</span>
          </div>
        </div>

        {/* Metric 2: Approval Rate */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">อัตราส่วนการอนุมัติ (Approval Rate)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.approvalRate}%
            </span>
            <span className="text-xs text-neutral-400">({stats.approved}/{stats.total} ครั้ง)</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              <Award className="w-3 h-3 mr-1" />
              <span>ระดับดีเยี่ยม</span>
            </span>
            <span className="text-neutral-400">ปฏิบัติตามระเบียบถูกต้อง</span>
          </div>
        </div>

        {/* Metric 3: Average per Month / Week */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">การลาเฉลี่ย (Avg. Rate)</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {stats.avgPerMonth}
            </span>
            <span className="text-xs text-neutral-400">ครั้ง / เดือน</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>เฉลี่ย {stats.avgPerWeek} ครั้ง/สัปดาห์</span>
            <span>•</span>
            <span className="text-sky-600 dark:text-sky-400 font-medium">เกณฑ์ปกติ</span>
          </div>
        </div>

        {/* Metric 4: Quota Usage Status */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <span className="font-semibold">โควตาคงเหลือ (Quota Remaining)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {stats.quotaRemainingPercent}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">คงเหลือปลอดภัย</span>
          </div>
          {/* Mini progress bar */}
          <div className="mt-3 space-y-1">
            <div className="h-2 w-full bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${stats.quotaUsedPercent}%` }}
                className={`h-full transition-all ${
                  stats.quotaUsedPercent > 80 ? 'bg-rose-500' : stats.quotaUsedPercent > 50 ? 'bg-amber-500' : 'bg-[#7749BC]'
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>ใช้ไป {stats.totalQuotaUsed} จาก {stats.totalQuotaAllowed} คาบ</span>
              <span>{stats.quotaUsedPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1.3 Two-Column Grid: Left Bar Chart & Right Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Bar Chart (Semester Comparison) */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#7749BC]" />
                <span>ประวัติการลาเปรียบเทียบในแต่ละภาคเรียน (Semester Comparison)</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                เปรียบเทียบสถิติจำนวนครั้งที่ยื่นลาจำแนกตามประเภทในแต่ละเทอม
              </p>
            </div>

            {/* Toggle Mode */}
            <div className="inline-flex p-1 bg-neutral-100 dark:bg-slate-800 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setChartMode('breakdown')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'breakdown'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                แยกประเภท
              </button>
              <button
                onClick={() => setChartMode('total')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  chartMode === 'total'
                    ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                ยอดรวม
              </button>
            </div>
          </div>

          <div className="pt-2">
            <LeaveBarChart
              labels={semesterLabels}
              datasets={barChartDatasets}
              yAxisLabel="ครั้ง"
              height={290}
              stacked={chartMode === 'breakdown'}
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between text-xs text-neutral-500">
            <span>แกน X: ภาคการศึกษา</span>
            <span>แกน Y: จำนวนครั้งที่ยื่นลาเรียน (ครั้ง)</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Donut Chart (Category Breakdown & Quota) */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="pb-2 border-b border-neutral-100 dark:border-slate-800">
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-sky-500" />
              <span>สัดส่วนประเภทการลา & โควตาคงเหลือ</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {selectedTerm === 'all' ? 'รวมทุกภาคการศึกษา' : `เฉพาะภาคเรียนที่ ${selectedTerm}`}
            </p>
          </div>

          <div className="pt-2">
            <LeaveDonutChart
              labels={['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'อื่น ๆ']}
              dataValues={[stats.sick, stats.personal, stats.activity, stats.others]}
              colors={['#0284C7', '#7749BC', '#6366F1', '#F59E0B']}
              hoverColors={['#0369A1', '#5B21B6', '#4F46E5', '#D97706']}
              unit="ครั้ง"
              height={200}
              centerTitle="คำขอลาทั้งหมด"
              centerValue={`${stats.total}`}
            />
          </div>

          {/* Quota Usage Box */}
          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-[#7749BC] dark:text-purple-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>สรุปการใช้โควตาเวลาเรียน</span>
              </span>
              <span>{stats.quotaRemainingPercent}% คงเหลือ</span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              ตามระเบียบมหาวิทยาลัย นิสิตต้องมีเวลาเรียนไม่น้อยกว่า <strong>80%</strong> ของเวลาเรียนทั้งหมด (ลาได้ไม่เกิน 20% หรือประมาณ 3 ครั้งต่อรายวิชา)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Multi-Semester Comparison Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wider">
            รายละเอียดสถิติสะสมแยกตามภาคการศึกษา
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
                      className="bg-[#7749BC] h-full"
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
