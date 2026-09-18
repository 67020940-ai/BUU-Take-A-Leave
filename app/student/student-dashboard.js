'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CheckCircle2,
  BookOpen,
  CalendarClock,
  UserRound,
  MapPin,
  History,
  ChevronRight,
  Plus,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  AlertCircle,
  X,
  RotateCcw,
  Calendar,
  Layers,
  HeartPulse,
  User,
  Users,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  Search,
} from 'lucide-react';
import { STATUS_DETAILS, LEAVE_TYPE_DETAILS, LEAVE_TYPE_DEFAULT, DAY_LABEL_TH, formatThaiDate, formatThaiDateTime } from '@/lib/ui';
import AttachmentPreview from '@/components/AttachmentPreview';
import CancelLeaveButton from '@/components/CancelLeaveButton';

const LEAVE_CATEGORIES = [
  { key: 'all', label: 'ทุกประเภท', icon: Layers },
  { key: 'ลาป่วย', label: 'ลาป่วย', icon: HeartPulse },
  { key: 'ลากิจส่วนตัว', label: 'ลากิจส่วนตัว', icon: User },
  { key: 'ลากิจกรรม', label: 'ลากิจกรรม', icon: Users },
  { key: 'อื่น ๆ', label: 'อื่น ๆ', icon: HelpCircle },
];

export default function StudentDashboard({ summaries = [], leaves: initialLeaves = [] }) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Detail Modal
  const [detailModal, setDetailModal] = useState({ isOpen: false, leave: null });

  // Extract unique academic terms from summaries and leaves
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

  // Filter summaries according to term
  const filteredSummaries = useMemo(() => {
    if (selectedTerm === 'all') return summaries;
    return summaries.filter((s) => s.course?.term === selectedTerm);
  }, [summaries, selectedTerm]);

  // Filter leaves according to term, status, type, and search query
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // 1. Term filter
      if (selectedTerm !== 'all') {
        const leaveTerm = l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term;
        if (leaveTerm && leaveTerm !== selectedTerm) return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'all' && l.status !== selectedStatus) return false;

      // 3. Type filter (รองรับทั้ง อื่น ๆ และ อื่นๆ)
      if (selectedType !== 'all') {
        if (selectedType === 'อื่น ๆ' || selectedType === 'อื่นๆ') {
          if (l.type !== 'อื่น ๆ' && l.type !== 'อื่นๆ' && l.type !== 'เหตุฉุกเฉิน') return false;
        } else if (l.type !== selectedType) {
          return false;
        }
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCourse = (l.courseName || '').toLowerCase().includes(q) || (l.courseCode || '').includes(q);
        const matchReason = (l.reason || '').toLowerCase().includes(q);
        const matchTeacher = (l.teacherName || '').toLowerCase().includes(q);
        if (!matchCourse && !matchReason && !matchTeacher) return false;
      }

      return true;
    });
  }, [leaves, selectedTerm, selectedStatus, selectedType, searchQuery, summaries]);

  // Stats for the currently selected term
  const stats = useMemo(() => {
    const relevantLeaves = selectedTerm === 'all'
      ? leaves
      : leaves.filter((l) => (l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term) === selectedTerm);

    const totalRequests = relevantLeaves.length;
    const approved = relevantLeaves.filter((l) => l.status === 'อนุมัติ').length;
    const pending = relevantLeaves.filter((l) => l.status === 'รออนุมัติ').length;
    const rejected = relevantLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
    const cancelled = relevantLeaves.filter((l) => l.status === 'ยกเลิก').length;

    const sick = relevantLeaves.filter((l) => l.type === 'ลาป่วย').length;
    const personal = relevantLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
    const activity = relevantLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
    const others = relevantLeaves.filter((l) => l.type === 'อื่น ๆ' || l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน').length;

    const avgAttendance = filteredSummaries.length
      ? Math.round(filteredSummaries.reduce((acc, s) => acc + s.percentage, 0) / filteredSummaries.length)
      : 100;

    return {
      totalRequests,
      approved,
      pending,
      rejected,
      cancelled,
      sick,
      personal,
      activity,
      others,
      avgAttendance,
      courseCount: filteredSummaries.length,
    };
  }, [leaves, filteredSummaries, selectedTerm, summaries]);

  // สถิติการลาของนิสิตแยกตามแต่ละภาคเรียน (เพื่อให้นิสิตดูสถิติในภาคเรียนอื่นได้สะดวก)
  const semesterBreakdown = useMemo(() => {
    return academicTerms.map((term) => {
      const termCourses = summaries.filter((s) => s.course?.term === term);
      const termLeaves = leaves.filter((l) => {
        const leaveTerm = l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term;
        return leaveTerm === term;
      });
      const avgAtt = termCourses.length
        ? Math.round(termCourses.reduce((acc, s) => acc + s.percentage, 0) / termCourses.length)
        : 100;
      const approvedCount = termLeaves.filter((l) => l.status === 'อนุมัติ').length;
      const pendingCount = termLeaves.filter((l) => l.status === 'รออนุมัติ').length;
      return {
        term,
        courseCount: termCourses.length,
        totalLeaves: termLeaves.length,
        approvedLeaves: approvedCount,
        pendingLeaves: pendingCount,
        avgAttendance: avgAtt,
      };
    });
  }, [academicTerms, summaries, leaves]);

  function handleCategoryClick(type) {
    const nextType = selectedType === type ? 'all' : type;
    setSelectedType(nextType);
    setTimeout(() => {
      const el = document.getElementById('leave-history-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  }

  function openDetailModal(leave) {
    setDetailModal({ isOpen: true, leave });
  }

  return (
    <div className="space-y-8">
      {/* 1. Academic Year & Semester Selector & Search Controls */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                เลือกดูสถิติและประวัติตามปีการศึกษา/ภาคเรียน
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                สืบค้นสถิติการเข้าเรียนและคำขอลาแยกตามเทอม
              </p>
            </div>
          </div>

          {/* Academic Term Selector */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/40 text-xs font-bold text-[#7749BC] dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/20 appearance-none pr-9 cursor-pointer"
            >
              <option value="all">ทุกภาคการศึกษา (All Semesters)</option>
              {academicTerms.map((term) => (
                <option key={term} value={term}>
                  ภาคเรียนที่ {term}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#7749BC] dark:text-purple-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อวิชา, รหัสวิชา, เหตุผลการลา หรือชื่ออาจารย์ผู้สอน..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-[#7749BC] text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {st === 'all' ? 'ทุกสถานะ' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Dynamic Statistics Overview Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <span>สถิติการลาและการเข้าเรียน</span>
            {selectedTerm !== 'all' ? (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300">
                ภาคเรียนที่ {selectedTerm}
              </span>
            ) : (
              <span className="text-xs font-normal text-neutral-400">(รวมทุกภาคเรียน)</span>
            )}
          </h3>
        </div>

        {/* Main 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>เวลาเรียนเฉลี่ย</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.avgAttendance}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">เกณฑ์ ≥ 80%</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">ใน {stats.courseCount} รายวิชาที่ลงทะเบียน</p>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>ลาที่ได้รับอนุมัติ</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.approved}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">ครั้ง</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">จากที่ยื่นทั้งหมด {stats.totalRequests} คำขอ</p>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>รอการพิจารณา</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.pending}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">รายการ</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">รออาจารย์ประจำวิชาอนุมัติ</p>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>วิชาที่ลงทะเบียน</span>
              <BookOpen className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.courseCount}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">รายวิชา</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">ภาคการศึกษาปัจจุบัน/ที่เลือก</p>
          </div>
        </div>

        {/* Categorized Leave Counts Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div
            onClick={() => handleCategoryClick('ลาป่วย')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'ลาป่วย'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
                : 'bg-white/70 dark:bg-slate-900/70 border-neutral-200/80 dark:border-slate-800 hover:border-sky-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">ลาป่วย (Sick)</span>
            </div>
            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{stats.sick} ครั้ง</span>
          </div>

          <div
            onClick={() => handleCategoryClick('ลากิจส่วนตัว')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'ลากิจส่วนตัว'
                ? 'bg-purple-50 dark:bg-purple-950/40 border-[#7749BC] ring-2 ring-[#7749BC]/20'
                : 'bg-white/70 dark:bg-slate-900/70 border-neutral-200/80 dark:border-slate-800 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#7749BC]" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">ลากิจส่วนตัว</span>
            </div>
            <span className="text-sm font-bold text-[#7749BC] dark:text-purple-300">{stats.personal} ครั้ง</span>
          </div>

          <div
            onClick={() => handleCategoryClick('ลากิจกรรม')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'ลากิจกรรม'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-white/70 dark:bg-slate-900/70 border-neutral-200/80 dark:border-slate-800 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">ลากิจกรรม</span>
            </div>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{stats.activity} ครั้ง</span>
          </div>

          <div
            onClick={() => handleCategoryClick('อื่น ๆ')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'อื่น ๆ' || selectedType === 'อื่นๆ'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-white/70 dark:bg-slate-900/70 border-neutral-200/80 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">อื่น ๆ</span>
            </div>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{stats.others} ครั้ง</span>
          </div>
        </div>

        {/* สถิติการลาของนิสิตในภาคเรียนอื่น (Multi-Semester Comparison) */}
        <div className="pt-3 border-t border-neutral-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5">
            <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>สถิติการลาของนิสิตในภาคเรียนอื่น (All Academic Semesters)</span>
            </h4>
            <span className="text-[11px] text-neutral-400">คลิกที่การ์ดภาคเรียนเพื่อสลับดูรายละเอียด</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {semesterBreakdown.map((sb) => {
              const isCurrent = selectedTerm === sb.term;
              return (
                <div
                  key={sb.term}
                  onClick={() => setSelectedTerm(sb.term)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-[#7749BC] ring-2 ring-[#7749BC]/20'
                      : 'bg-white/70 dark:bg-slate-900/70 border-neutral-200/80 dark:border-slate-800 hover:border-[#7749BC]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      ภาคเรียนที่ {sb.term}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7749BC] text-white">
                        กำลังแสดง
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#7749BC] dark:text-purple-300 font-semibold hover:underline">
                        เลือกดู →
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-neutral-600 dark:text-neutral-400 mt-2">
                    <span>เวลาเรียนเฉลี่ย:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{sb.avgAttendance}%</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    <span>คำขอลา:</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{sb.totalLeaves} ครั้ง (อนุมัติ {sb.approvedLeaves})</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[11px] text-neutral-400 mt-1">
                    <span>วิชาที่ลงทะเบียน:</span>
                    <span>{sb.courseCount} วิชา</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Courses in Selected Term */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            เวลาเรียนรายวิชา ({filteredSummaries.length} วิชา)
          </h2>
        </div>

        {filteredSummaries.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-8 text-center shadow-xs">
            <BookOpen className="w-8 h-8 text-neutral-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">ไม่พบรายวิชาในภาคการศึกษาที่เลือก</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">ลองเลือกภาคการศึกษาอื่น หรือเลือก &quot;ทุกภาคการศึกษา&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSummaries.map((s) => {
              const teacherName = s.course?.teacher?.name || s.course?.teacherName || null;
              const dayTime = s.course?.day ? `${DAY_LABEL_TH[s.course.day] || s.course.day} ${s.course.time || ''} น.` : null;
              const room = s.course?.room || null;
              const hasInfoBox = dayTime || room || teacherName;
              return (
                <div
                  key={s.course?.id}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-[#7749BC]/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-slate-700">
                        {s.course?.code}
                        {s.course?.group && <span className="text-neutral-400"> • กลุ่ม {s.course.group}</span>}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                          s.overQuota
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        {s.percentage}%
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{s.course?.name}</h3>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3">ภาคเรียน {s.course?.term}</p>

                    {hasInfoBox && (
                      <div className="rounded-2xl bg-neutral-50 dark:bg-slate-800/60 p-3 space-y-1.5 mb-3">
                        {dayTime && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <CalendarClock className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0" />
                            <span>{dayTime}</span>
                          </div>
                        )}
                        {room && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>ห้องเรียน {room}</span>
                          </div>
                        )}
                        {teacherName && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <UserRound className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>ผู้สอน: {teacherName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-slate-800">
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      ลาแล้ว: {s.approvedLeaves} ครั้ง
                    </span>
                    <Link
                      href={`/student/leave?courseId=${s.course?.id}`}
                      className="text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
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
      </section>

      {/* 4. Leave History with Details Button & Details Modal */}
      <section id="leave-history-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2 flex-wrap">
              <History className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
              <span>ประวัติและรายละเอียดการลา</span>
              {selectedType !== 'all' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center gap-1.5">
                  <span>กำลังแสดงเฉพาะ: {selectedType}</span>
                  <button
                    onClick={() => setSelectedType('all')}
                    className="hover:text-rose-500 font-bold ml-1 cursor-pointer text-sm leading-none"
                    title="ล้างตัวกรองเพื่อดูทุกประเภท"
                  >
                    ×
                  </button>
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {selectedType !== 'all'
                ? `แสดงเฉพาะคำขอลาประเภท "${selectedType}" จำนวน ${filteredLeaves.length} รายการ`
                : `แสดง ${filteredLeaves.length} รายการ (คลิก "ดูรายละเอียด" เพื่อดูข้อความตอบกลับจากอาจารย์และหลักฐานแนบ)`}
            </p>
          </div>

          <Link
            href="/student/leave"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ยื่นคำร้องลาใหม่</span>
          </Link>
        </div>

        {filteredLeaves.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
            <FileText className="w-10 h-10 text-neutral-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">ยังไม่มีข้อมูลการลาในเงื่อนไขที่เลือก</p>
            <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนตัวกรองภาคเรียน สถานะ หรือคำค้นหา</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeaves.map((leave) => {
              const status = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
              const typeCls = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;
              return (
                <div
                  key={leave.id}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-[#7749BC]/40 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span>{status.label}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${typeCls}`}>{leave.type}</span>
                      <span className="text-xs text-neutral-400 font-mono">#{leave.id}</span>
                      {leave.courseTerm && (
                        <span className="text-xs text-neutral-500 font-medium px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-slate-800">
                          ภาคเรียน {leave.courseTerm}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => openDetailModal(leave)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-[#7749BC] text-[#7749BC] hover:text-white dark:bg-purple-950/60 dark:hover:bg-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูรายละเอียด</span>
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{leave.courseName}</h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                      <strong>เหตุผล:</strong> {leave.reason}
                    </p>
                  </div>

                  {/* Teacher Feedback Bubble if exists */}
                  {leave.teacherComment && (
                    <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/70 text-xs flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">ความเห็นอาจารย์: </span>
                        <span className="text-neutral-600 dark:text-neutral-300">{leave.teacherComment}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                        <span>
                          {formatThaiDate(leave.startDate)}
                          {leave.endDate && leave.endDate !== leave.startDate ? ` - ${formatThaiDate(leave.endDate)}` : ''}
                        </span>
                      </span>
                      {leave.period && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{leave.period}</span>
                        </span>
                      )}
                      {leave.attachment && (
                        <AttachmentPreview src={`/api/leaves/attachment/${leave.attachment}`} label="ดูหลักฐานแนบ" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {leave.status === 'รออนุมัติ' && (
                        <CancelLeaveButton leaveId={leave.id} />
                      )}
                      {leave.status === 'ยกเลิก' && (
                        <Link
                          href={`/student/leave?resubmit=${leave.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>ส่งใบลาอีกครั้ง</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Student Leave Detail Modal */}
      {detailModal.isOpen && detailModal.leave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 mb-1">
                    คำร้องขอลาเรียน #{detailModal.leave.id}
                  </span>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {detailModal.leave.courseName}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailModal({ isOpen: false, leave: null })}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              {(() => {
                const status = STATUS_DETAILS[detailModal.leave.status] || STATUS_DETAILS['รออนุมัติ'];
                return (
                  <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${status.badge}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                      <span className="font-bold text-xs">สถานะ: {status.label}</span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80">
                      ยื่นเมื่อ: {formatThaiDateTime(detailModal.leave.createdAt)}
                    </span>
                  </div>
                );
              })()}

              {/* Course & Teacher Details */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">รหัสและชื่อวิชา:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">{detailModal.leave.courseName}</span>
                </div>
                {detailModal.leave.courseTerm && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">ภาคการศึกษา:</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{detailModal.leave.courseTerm}</span>
                  </div>
                )}
                {detailModal.leave.teacherName && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">อาจารย์ผู้สอน:</span>
                    <span className="font-semibold text-[#7749BC] dark:text-purple-300">{detailModal.leave.teacherName}</span>
                  </div>
                )}
              </div>

              {/* Leave Period & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                    <span>วันที่ลา</span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatThaiDate(detailModal.leave.startDate)}
                    {detailModal.leave.endDate && detailModal.leave.endDate !== detailModal.leave.startDate
                      ? ` - ${formatThaiDate(detailModal.leave.endDate)}`
                      : ''}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                    <span>ประเภท & ช่วงเวลา</span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{detailModal.leave.type}</p>
                  <p className="text-[11px] text-neutral-500">{detailModal.leave.period}</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">เหตุผลในการลา</p>
                <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-slate-700">
                  {detailModal.leave.reason}
                </p>
              </div>

              {/* Teacher Comment */}
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                  <span>ความเห็น / หมายเหตุจากอาจารย์</span>
                </p>
                {detailModal.leave.teacherComment ? (
                  <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 bg-purple-50/70 dark:bg-purple-950/40 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800 font-medium">
                    {detailModal.leave.teacherComment}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 bg-neutral-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-neutral-200/60 dark:border-slate-700 italic">
                    ยังไม่มีข้อความเพิ่มเติมจากอาจารย์
                  </p>
                )}
              </div>

              {/* Attachment */}
              {detailModal.leave.attachment && (
                <div>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">เอกสารแนบประกอบการลา</p>
                  <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800">
                    <span className="flex items-center gap-2 text-xs text-neutral-800 dark:text-neutral-200 min-w-0">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">{detailModal.leave.attachment}</span>
                    </span>
                    <AttachmentPreview
                      src={`/api/leaves/attachment/${detailModal.leave.attachment}`}
                      label="ดูเอกสารฉบับเต็ม"
                      thumbClassName="w-12 h-12 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-neutral-100 dark:border-slate-800 p-4 flex items-center justify-end gap-2 rounded-b-3xl">
              <button
                onClick={() => setDetailModal({ isOpen: false, leave: null })}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
              {detailModal.leave.status === 'ยกเลิก' && (
                <Link
                  href={`/student/leave?resubmit=${detailModal.leave.id}`}
                  className="px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ส่งใบลาอีกครั้ง</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
