'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Calendar,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  X,
  RotateCcw,
  Plus,
  Search,
  ChevronDown,
  Layers,
  HeartPulse,
  User,
  Users,
  HelpCircle,
  ArrowLeft,
  Filter,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from 'lucide-react';
import { STATUS_DETAILS, LEAVE_TYPE_DETAILS, LEAVE_TYPE_DEFAULT, formatThaiDate, formatThaiDateTime, sortAcademicTerms, formatTeacherFullName } from '@/lib/ui';
import AttachmentPreview from '@/components/AttachmentPreview';
import CancelLeaveButton from '@/components/CancelLeaveButton';
import { calculateLeaveStats, formatLeaveClassTime } from '@/lib/leave-stats';

const LEAVE_CATEGORIES = [
  { key: 'all', label: 'ทุกประเภท', icon: Layers },
  { key: 'ลาป่วย', label: 'ลาป่วย', icon: HeartPulse },
  { key: 'ลากิจส่วนตัว', label: 'ลากิจส่วนตัว', icon: User },
  { key: 'ลากิจกรรม', label: 'ลากิจกรรม', icon: Users },
  { key: 'อื่น ๆ', label: 'อื่น ๆ', icon: HelpCircle },
];

export default function StudentHistoryView({ leaves: initialLeaves = [], summaries = [], initialStatus = 'all' }) {
  const [leaves, setLeaves] = useState(initialLeaves);

  useEffect(() => {
    setLeaves(initialLeaves);
  }, [initialLeaves]);

  // Handle URL params and notification auto-open
  useEffect(() => {
    function handleParams(searchStr) {
      if (!searchStr) return;
      const sp = new URLSearchParams(searchStr);
      const q = sp.get('search') || '';
      const leaveId = sp.get('id') || sp.get('leaveId') || '';
      const autoOpen = sp.get('autoOpen') === '1' || !!q || !!leaveId;

      if (q) setSearchQuery(q);

      if (autoOpen && leaves.length > 0) {
        const found = leaves.find((l) => {
          if (leaveId && String(l.id) === String(leaveId)) return true;
          if (q) {
            const query = q.toLowerCase();
            return (l.courseName || '').toLowerCase().includes(query) || (l.courseCode || '').toLowerCase().includes(query);
          }
          return false;
        });
        if (found) {
          setSelectedStatus('all');
          setDetailModal({ isOpen: true, leave: found });
        }
      }
    }

    if (typeof window !== 'undefined') {
      handleParams(window.location.search);

      function handleNotificationEvent(e) {
        const n = e.detail?.notification;
        if (!n) return;
        const msg = n.message || n.title || '';
        const match = msg.match(/คำร้องลา\s+"([^"]+)"(?:\s*\(([^)]+)\))?/);
        const courseName = match ? match[1].trim() : '';

        const found = leaves.find((l) => {
          if (courseName && (l.courseName || '').includes(courseName)) return true;
          return false;
        });

        if (found) {
          setSelectedStatus('all');
          if (courseName) setSearchQuery(courseName);
          setDetailModal({ isOpen: true, leave: found });
        } else if (courseName) {
          setSearchQuery(courseName);
        }
      }

      window.addEventListener('buu:open-notification', handleNotificationEvent);
      return () => {
        window.removeEventListener('buu:open-notification', handleNotificationEvent);
      };
    }
  }, [leaves]);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [historyTimeFilter, setHistoryTimeFilter] = useState('all'); // 'all' | 'past' | 'latest'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (ล่าสุดก่อน) | 'asc' (เก่าสุดก่อน)
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModal, setDetailModal] = useState({ isOpen: false, leave: null });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Extract unique academic terms sorted chronologically
  const academicTerms = useMemo(() => {
    const terms = new Set();
    summaries.forEach((s) => {
      if (s.course?.term) terms.add(s.course.term);
    });
    leaves.forEach((l) => {
      if (l.courseTerm && l.courseTerm !== '-') terms.add(l.courseTerm);
    });
    if (terms.size === 0) terms.add('1/2569');
    return sortAcademicTerms(Array.from(terms), false);
  }, [summaries, leaves]);

  // Filter leaves according to term, status, type, and search query
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // 1. Term filter
      if (selectedTerm !== 'all') {
        const leaveTerm = l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term;
        if (leaveTerm && leaveTerm !== selectedTerm) return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'all') {
        if (l.status !== selectedStatus) return false;
      }

      // 3. Type filter
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

      // 5. Recency filter: 'การลาที่ผ่านมาแล้ว' vs 'การลาล่าสุด'
      if (historyTimeFilter === 'latest') {
        const leaveTerm = l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term;
        const isCurrentTerm = leaveTerm === '1/2569' || !leaveTerm;
        const leaveTime = new Date(l.startDate || l.createdAt || 0).getTime();
        const isRecentDate = leaveTime >= new Date('2026-08-01').getTime();
        if (!isCurrentTerm && !isRecentDate) return false;
      } else if (historyTimeFilter === 'past') {
        const leaveTerm = l.courseTerm || summaries.find((s) => s.course?.id === l.courseId)?.course?.term;
        const isPastTerm = leaveTerm && leaveTerm !== '1/2569';
        const leaveEnd = new Date(l.endDate || l.startDate || l.createdAt || 0).getTime();
        const isPastDate = leaveEnd < new Date('2026-08-01').getTime() || l.status === 'อนุมัติ' || l.status === 'ไม่อนุมัติ' || l.status === 'ยกเลิก';
        if (!isPastTerm && !isPastDate) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.startDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.startDate || 0).getTime();
      if (sortOrder === 'asc') {
        if (timeA !== timeB) return timeA - timeB;
        return Number(a.id || 0) - Number(b.id || 0);
      }
      if (timeB !== timeA) return timeB - timeA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [leaves, selectedTerm, selectedStatus, selectedType, searchQuery, historyTimeFilter, sortOrder, summaries]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / pageSize) || 1;
  const paginatedLeaves = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeaves.slice(start, start + pageSize);
  }, [filteredLeaves, currentPage, pageSize]);

  const stats = useMemo(() => {
    return calculateLeaveStats(leaves, selectedTerm, summaries);
  }, [leaves, selectedTerm, summaries]);

  return (
    <div className="space-y-6">
      {/* Quick Summary Pill Bar (Interactive filter cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Box 1: คำขอทั้งหมด */}
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            selectedStatus === 'all'
              ? 'bg-purple-50 dark:bg-purple-950/60 border-[#7749BC] ring-2 ring-[#7749BC]/30 shadow-md'
              : 'bg-white/80 dark:bg-slate-900/80 border-neutral-200/80 dark:border-slate-800 hover:border-purple-300'
          }`}
          title="คลิกเพื่อแสดงคำขอทั้งหมด"
        >
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">คำร้องขอลาทั้งหมด</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{stats.total} รายการ</p>
          {stats.hasCancelled && (
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-medium">
              รวมยกเลิก {stats.cancelled}
            </p>
          )}
        </button>

        {/* Box 2: อนุมัติแล้ว */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'อนุมัติ' ? 'all' : 'อนุมัติ')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            selectedStatus === 'อนุมัติ'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400'
          }`}
          title="คลิกเพื่อกรองเฉพาะที่อนุมัติแล้ว"
        >
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">อนุมัติ</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.approved} รายการ</p>
        </button>

        {/* Box 3: รออนุมัติ */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'รออนุมัติ' ? 'all' : 'รออนุมัติ')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            selectedStatus === 'รออนุมัติ'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 hover:border-amber-400'
          }`}
          title="คลิกเพื่อกรองเฉพาะที่รออนุมัติ"
        >
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">รออนุมัติ</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{stats.pending} รายการ</p>
        </button>

        {/* Box 4: ไม่อนุมัติ */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'ไม่อนุมัติ' ? 'all' : 'ไม่อนุมัติ')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            selectedStatus === 'ไม่อนุมัติ'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/30 shadow-md'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 hover:border-rose-400'
          }`}
          title="คลิกเพื่อกรองเฉพาะที่ไม่อนุมัติ"
        >
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">ไม่อนุมัติ</p>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">{stats.rejected} รายการ</p>
        </button>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Semester Selector */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
              ภาคการศึกษา (Semester)
            </label>
            <div className="relative">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-8 cursor-pointer"
              >
                <option value="all">ทุกภาคการศึกษา (All Semesters)</option>
                {academicTerms.map((t) => (
                  <option key={t} value={t}>
                    ภาคเรียนที่ {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Input with trailing sort button: ล่าสุดก่อน */}
          <div className="sm:col-span-8">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                ค้นหาข้อมูล (Search Course, Reason, Teacher)
              </label>
            </div>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อวิชา, รหัสวิชา, เหตุผลการลา หรืออาจารย์..."
                className="w-full pl-9 pr-28 sm:pr-32 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 shadow-xs"
              />
              {/* ปุ่มสลับลำดับการแสดงผล (Sort button: ล่าสุดก่อน) */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-slate-600 flex items-center gap-1.5 shadow-2xs"
                  title={sortOrder === 'desc' ? 'เรียงจากล่าสุดก่อน (คลิกเพื่อเรียงจากเก่าสุด)' : 'เรียงจากเก่าสุดก่อน (คลิกเพื่อเรียงจากล่าสุด)'}
                >
                  {sortOrder === 'desc' ? (
                    <ArrowDownWideNarrow className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                  ) : (
                    <ArrowUpNarrowWide className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                  )}
                  <span>{sortOrder === 'desc' ? 'ล่าสุดก่อน' : 'เก่าสุดก่อน'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>สถานะ:</span>
            </span>
            {['all', 'รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'ยกเลิก'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-[#7749BC] text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {st === 'all' ? 'ทุกสถานะ' : st}
              </button>
            ))}
          </div>

          {/* Type Pills */}
          <div className="flex flex-wrap items-center gap-1">
            {LEAVE_CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedType === key
                    ? 'bg-[#7749BC] text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Requests Cards List */}
      {filteredLeaves.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
          <FileText className="w-10 h-10 text-neutral-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">ไม่พบประวัติการลาตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-neutral-400 mt-1">ลองเปลี่ยนตัวกรองภาคเรียน สถานะ หรือคำค้นหา</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {paginatedLeaves.map((leave) => {
            const status = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
            const typeCls = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;
            return (
              <div
                key={leave.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-[#7749BC]/40 transition-all space-y-3"
              >
                {/* Header of each Card */}
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
                    onClick={() => setDetailModal({ isOpen: true, leave })}
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

                {/* Teacher Feedback */}
                {leave.teacherComment && (
                  <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/70 text-xs flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">ความเห็นอาจารย์: </span>
                      <span className="text-neutral-600 dark:text-neutral-300">{leave.teacherComment}</span>
                    </div>
                  </div>
                )}

                {/* Footer of Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                      <span>
                        {formatThaiDate(leave.startDate)}
                        {leave.endDate && leave.endDate !== leave.startDate ? ` - ${formatThaiDate(leave.endDate)}` : ''}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1 tabular-nums font-medium text-neutral-600 dark:text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0" />
                      <span>{formatLeaveClassTime(leave)}</span>
                    </span>
                    {leave.attachment && (
                      <AttachmentPreview src={`/api/leaves/attachment/${leave.attachment}`} label="ดูหลักฐานแนบ" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {leave.status === 'รออนุมัติ' && <CancelLeaveButton leaveId={leave.id} />}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-neutral-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                <span className="px-3 py-1 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {currentPage}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>

              <div>
                แสดง {filteredLeaves.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
                {Math.min(currentPage * pageSize, filteredLeaves.length)} จาก {filteredLeaves.length} รายการ
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
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
                    <span className="font-semibold text-[#7749BC] dark:text-purple-300">{formatTeacherFullName(detailModal.leave.teacherName)}</span>
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
                    <span>ประเภท & เวลาเรียน</span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{detailModal.leave.type}</p>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 tabular-nums font-medium">{formatLeaveClassTime(detailModal.leave)}</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">เหตุผลในการลา</p>
                <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-slate-700">
                  {detailModal.leave.reason}
                </p>
              </div>

              {/* Attachment Preview */}
              {detailModal.leave.attachment && (
                <div>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">หลักฐานที่แนบ</p>
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/80 border border-neutral-200/60 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono truncate max-w-[200px]">
                      {detailModal.leave.attachment}
                    </span>
                    <AttachmentPreview src={`/api/leaves/attachment/${detailModal.leave.attachment}`} label="เปิดดูเอกสาร" />
                  </div>
                </div>
              )}

              {/* Teacher Comment */}
              {detailModal.leave.teacherComment && (
                <div>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">ข้อความจากอาจารย์ผู้สอน</p>
                  <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-neutral-800 dark:text-neutral-200 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0 mt-0.5" />
                    <span>{detailModal.leave.teacherComment}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setDetailModal({ isOpen: false, leave: null })}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
