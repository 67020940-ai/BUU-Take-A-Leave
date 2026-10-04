'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  Filter,
  Check,
  X,
  Clock,
  Eye,
  CalendarDays,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  UserCheck,
  HeartPulse,
  User,
  Users,
  HelpCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';
import TeacherTopBar from '@/components/TeacherTopBar';
import AttachmentPreview from '@/components/AttachmentPreview';
import {
  STATUS_DETAILS,
  LEAVE_TYPE_DETAILS,
  LEAVE_TYPE_DEFAULT,
  formatThaiDate,
  formatThaiDateTime,
} from '@/lib/ui';

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const LEAVE_CATEGORIES = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'ลาป่วย', label: 'ลาป่วย' },
  { key: 'ลากิจส่วนตัว', label: 'ลากิจส่วนตัว' },
  { key: 'ลากิจกรรม', label: 'ลากิจกรรม' },
  { key: 'อื่น ๆ', label: 'อื่น ๆ' },
];

export default function TeacherRequestsView({
  user,
  courses = [],
  initialLeaves = [],
  rosterByCourse = {},
  usingMock = false,
}) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('รออนุมัติ'); // 'รออนุมัติ' | 'all'

  // Filter states
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isTodayOnly, setIsTodayOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [actionModal, setActionModal] = useState({ isOpen: false, type: 'approve', leave: null, comment: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, leave: null, comment: '' });
  const [selectedLeaveIds, setSelectedLeaveIds] = useState(new Set());
  const [batchModal, setBatchModal] = useState({ isOpen: false, type: 'approve', comment: '', isSubmitting: false });
  const [toast, setToast] = useState(null);

  const todayStr = useMemo(() => getTodayStr(), []);

  // Academic terms
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

  const totalPendingCount = useMemo(() => leaves.filter((l) => l.status === 'รออนุมัติ').length, [leaves]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (activeTab === 'รออนุมัติ' && leave.status !== 'รออนุมัติ') return false;

      if (selectedTerm !== 'all') {
        const c = courses.find((course) => course.id === leave.courseId);
        const term = leave.courseTerm || c?.term;
        if (term !== selectedTerm) return false;
      }

      if (selectedCourseId !== 'all' && leave.courseId !== selectedCourseId) return false;

      if (typeFilter !== 'all') {
        if (typeFilter === 'อื่น ๆ') {
          if (['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจ', 'ลากิจกรรม'].includes(leave.type)) return false;
        } else if (leave.type !== typeFilter) {
          return false;
        }
      }

      if (isTodayOnly) {
        const start = leave.startDate;
        const end = leave.endDate || leave.startDate;
        if (!(todayStr >= start && todayStr <= end)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = (leave.studentName || '').toLowerCase().includes(q);
        const matchCode = (leave.studentCode || '').includes(q);
        const matchCourse = (leave.courseName || '').toLowerCase().includes(q) || (leave.courseCode || '').includes(q);
        const matchReason = (leave.reason || '').toLowerCase().includes(q);
        if (!matchStudent && !matchCode && !matchCourse && !matchReason) return false;
      }

      return true;
    });
  }, [leaves, activeTab, selectedTerm, selectedCourseId, typeFilter, isTodayOnly, searchQuery, todayStr, courses]);

  // Check quota risk
  function isStudentAtRisk(studentCode, courseId) {
    const roster = rosterByCourse[courseId] || [];
    const student = roster.find((s) => s.studentCode === studentCode);
    if (!student) return false;
    return student.overQuota || student.approvedLeaves >= 3 || (student.percentage && student.percentage < 80);
  }

  async function handleDecide(leave, status, comment) {
    const previousLeaves = [...leaves];
    setLeaves((prev) =>
      prev.map((l) => (l.id === leave.id ? { ...l, status, teacherComment: comment || null } : l))
    );

    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leave.id, status, comment: comment || undefined }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setToast({
        type: 'success',
        message: status === 'อนุมัติ' ? 'อนุมัติคำขอลาเรียบร้อยแล้ว' : 'บันทึกไม่อนุมัติคำขอลาแล้ว',
      });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setLeaves(previousLeaves);
      setToast({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง' });
      setTimeout(() => setToast(null), 3500);
    }
  }

  async function handleBatchAction(actionType, comment) {
    const ids = Array.from(selectedLeaveIds);
    if (ids.length === 0) return;

    setBatchModal((prev) => ({ ...prev, isSubmitting: true }));
    const status = actionType === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ';
    const previousLeaves = [...leaves];

    setLeaves((prev) =>
      prev.map((l) => (ids.includes(l.id) ? { ...l, status, teacherComment: comment || null } : l))
    );

    try {
      await Promise.all(
        ids.map((id) =>
          fetch('/api/leaves', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status, comment: comment || undefined }),
          })
        )
      );

      setSelectedLeaveIds(new Set());
      setBatchModal({ isOpen: false, type: 'approve', comment: '', isSubmitting: false });
      setToast({
        type: 'success',
        message: `${status === 'อนุมัติ' ? 'อนุมัติ' : 'ไม่อนุมัติ'}คำขอลา ${ids.length} รายการเรียบร้อยแล้ว`,
      });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setLeaves(previousLeaves);
      setBatchModal((prev) => ({ ...prev, isSubmitting: false }));
      setToast({ type: 'error', message: 'เกิดข้อผิดพลาดในการทำรายการกลุ่ม' });
      setTimeout(() => setToast(null), 3500);
    }
  }

  function toggleSelectAll() {
    if (selectedLeaveIds.size === filteredLeaves.length) {
      setSelectedLeaveIds(new Set());
    } else {
      setSelectedLeaveIds(new Set(filteredLeaves.map((l) => l.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedLeaveIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeaveIds(next);
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row">
      <TeacherSidebar
        mode="menu"
        activeTab="requests"
        pendingCount={totalPendingCount}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-64 sm:lg:pl-68 flex flex-col min-w-0">
        <TeacherTopBar
          user={user}
          semester={selectedTerm === 'all' ? '1/2569' : selectedTerm}
          onSemesterChange={(t) => setSelectedTerm(t)}
          availableSemesters={academicTerms}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="ค้นหาคำร้อง, นิสิต, หรือวิชา..."
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Banner */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shadow-xs">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                  คำขอร้องลาเรียน (Leave Requests)
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  ตรวจสอบและพิจารณาอนุมัติคำขอลาเรียนของนิสิตในรายวิชาที่รับผิดชอบ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/export"
                className="flex items-center space-x-1.5 text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-white dark:bg-purple-950/60 hover:bg-purple-50 border border-purple-200 dark:border-purple-800 px-3.5 py-2 rounded-2xl shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>ส่งออก CSV</span>
              </a>
              <a
                href="/teacher/print"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white dark:bg-slate-800 hover:bg-neutral-100 border border-neutral-200/80 dark:border-slate-700 px-3.5 py-2 rounded-2xl shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์รายงาน</span>
              </a>
            </div>
          </div>

          {/* Submenu Tabs: รออนุมัติ vs ทั้งหมด */}
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('รออนุมัติ');
                  setSelectedLeaveIds(new Set());
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'รออนุมัติ'
                    ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                    : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200/80 dark:border-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>รออนุมัติ ({totalPendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSelectedLeaveIds(new Set());
                }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'all'
                    ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                    : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200/80 dark:border-slate-700'
                }`}
              >
                <span>คำร้องทั้งหมด ({leaves.length})</span>
              </button>
            </div>

            <div className="text-xs text-neutral-500 font-medium">
              แสดง {filteredLeaves.length} รายการ
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  ปีการศึกษา / ภาคเรียน
                </label>
                <div className="relative">
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all">ทุกภาคการศึกษา</option>
                    {academicTerms.map((t) => (
                      <option key={t} value={t}>
                        ภาคเรียนที่ {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  เลือกรายวิชา
                </label>
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-8 cursor-pointer"
                  >
                    <option value="all">ทุกรายวิชา ({courses.length} วิชา)</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} {c.name} {c.group ? `(กลุ่ม ${c.group})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  ค้นหาข้อมูล
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อนิสิต, รหัสนิสิต, หรือเหตุผลการลา..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Type Filter Pills */}
            <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTodayOnly(!isTodayOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isTodayOnly
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>เฉพาะคำขอลาวันนี้</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {LEAVE_CATEGORIES.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTypeFilter(key)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      typeFilter === key
                        ? 'bg-[#7749BC] text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Batch Actions Toolbar */}
          {selectedLeaveIds.size > 0 && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#7749BC] text-white text-xs font-bold flex items-center justify-center">
                  {selectedLeaveIds.size}
                </span>
                <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                  เลือกอยู่ {selectedLeaveIds.size} รายการ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBatchModal({ isOpen: true, type: 'approve', comment: '', isSubmitting: false })}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>อนุมัติที่เลือก</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBatchModal({ isOpen: true, type: 'reject', comment: '', isSubmitting: false })}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>ไม่อนุมัติที่เลือก</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLeaveIds(new Set())}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold border border-neutral-200 dark:border-slate-700 cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Leaves List */}
          {filteredLeaves.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-neutral-200/80 dark:border-slate-800 space-y-3">
              <ClipboardCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                ไม่พบรายการคำขอลาเรียน
              </h3>
              <p className="text-xs text-neutral-400">
                ไม่มีคำขอลาที่ตรงกับเงื่อนไขการค้นหาในขณะนี้
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select all header */}
              <div className="px-3 flex items-center justify-between text-xs text-neutral-500">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={selectedLeaveIds.size > 0 && selectedLeaveIds.size === filteredLeaves.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-[#7749BC] focus:ring-[#7749BC] accent-[#7749BC]"
                  />
                  <span>เลือกทั้งหมด ({filteredLeaves.length})</span>
                </label>
              </div>

              {filteredLeaves.map((leave) => {
                const atRisk = isStudentAtRisk(leave.studentCode, leave.courseId);
                const isSelected = selectedLeaveIds.has(leave.id);
                const statusInfo = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
                const typeBadge = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;

                return (
                  <div
                    key={leave.id}
                    className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border transition-all shadow-xs ${
                      isSelected
                        ? 'border-[#7749BC] ring-2 ring-purple-300/40'
                        : 'border-neutral-200/80 dark:border-slate-800 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Checkbox + Avatar + Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(leave.id)}
                          className="mt-1 w-4 h-4 rounded text-[#7749BC] focus:ring-[#7749BC] accent-[#7749BC] cursor-pointer"
                        />
                        <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {initials(leave.studentName)}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                              {leave.studentName}
                            </span>
                            <span className="font-mono text-xs text-neutral-400">
                              {leave.studentCode}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge}`}>
                              {leave.type}
                            </span>
                            {atRisk && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                เสี่ยงหมดสิทธิ์สอบ
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-neutral-600 dark:text-neutral-300 flex flex-wrap items-center gap-2">
                            <span className="font-medium">
                              วิชา: {leave.courseCode} {leave.courseName}
                            </span>
                            <span>•</span>
                            <span>
                              วันที่ลา: {formatThaiDate(leave.startDate)}
                              {leave.endDate && leave.endDate !== leave.startDate
                                ? ` - ${formatThaiDate(leave.endDate)}`
                                : ''}{' '}
                              ({leave.period})
                            </span>
                          </div>

                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                            <strong>เหตุผล:</strong> {leave.reason || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => setDetailModal({ isOpen: true, leave, comment: '' })}
                          className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                        >
                          ดูข้อมูล
                        </button>

                        {leave.status === 'รออนุมัติ' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setActionModal({ isOpen: true, type: 'reject', leave, comment: '' })}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                            >
                              ไม่อนุมัติ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDecide(leave, 'อนุมัติ')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                            >
                              อนุมัติ
                            </button>
                          </>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            <span>{statusInfo.label || leave.status}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* DETAIL MODAL */}
      {detailModal.isOpen && detailModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  รายละเอียดคำขอลาเรียน
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {detailModal.leave.studentCode} • {detailModal.leave.studentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, leave: null, comment: '' })}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-2 text-xs">
              <p><strong>วิชา:</strong> {detailModal.leave.courseCode} {detailModal.leave.courseName}</p>
              <p><strong>ประเภทการลา:</strong> {detailModal.leave.type}</p>
              <p><strong>ช่วงเวลา:</strong> {formatThaiDate(detailModal.leave.startDate)} ({detailModal.leave.period})</p>
              <p><strong>เหตุผล:</strong> {detailModal.leave.reason || '-'}</p>
              <p><strong>ยื่นเมื่อ:</strong> {formatThaiDateTime(detailModal.leave.createdAt)}</p>
            </div>

            {/* Slip Attachment */}
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                เอกสารแนบ / ใบรับรองแพทย์
              </p>
              <AttachmentPreview
                attachment={detailModal.leave.attachment}
                leaveId={detailModal.leave.id}
                title="หลักฐานประกอบการลา"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, leave: null, comment: '' })}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200"
              >
                ปิดหน้าต่าง
              </button>
              {detailModal.leave.status === 'รออนุมัติ' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const l = detailModal.leave;
                      setDetailModal({ isOpen: false, leave: null, comment: '' });
                      setActionModal({ isOpen: true, type: 'reject', leave: l, comment: '' });
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                  >
                    ไม่อนุมัติ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDecide(detailModal.leave, 'อนุมัติ');
                      setDetailModal({ isOpen: false, leave: null, comment: '' });
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                  >
                    อนุมัติคำขอ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL (Reject with Comment) */}
      {actionModal.isOpen && actionModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              ยืนยันการไม่อนุมัติคำขอลา
            </h3>
            <p className="text-xs text-neutral-500">
              นิสิต: {actionModal.leave.studentName} ({actionModal.leave.studentCode})
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                เหตุผลหรือข้อเสนอแนะถึงนิสิต (ไม่บังคับ)
              </label>
              <textarea
                value={actionModal.comment}
                onChange={(e) => setActionModal((p) => ({ ...p, comment: e.target.value }))}
                placeholder="ระบุเหตุผล เช่น เอกสารไม่ชัดเจน, ลาเกินกำหนด..."
                rows={3}
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: 'approve', leave: null, comment: '' })}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDecide(actionModal.leave, 'ไม่อนุมัติ', actionModal.comment);
                  setActionModal({ isOpen: false, type: 'approve', leave: null, comment: '' });
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH MODAL */}
      {batchModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {batchModal.type === 'approve' ? 'ยืนยันการอนุมัติแบบกลุ่ม' : 'ยืนยันการไม่อนุมัติแบบกลุ่ม'}
            </h3>
            <p className="text-xs text-neutral-500">
              คุณกำลังจะดำเนินการกับคำขอลาจำนวน {selectedLeaveIds.size} รายการ
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                ความคิดเห็นเพิ่มเติม
              </label>
              <textarea
                value={batchModal.comment}
                onChange={(e) => setBatchModal((p) => ({ ...p, comment: e.target.value }))}
                placeholder="ระบุข้อความประกอบการทำรายการ..."
                rows={2}
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchModal({ isOpen: false, type: 'approve', comment: '', isSubmitting: false })}
                className="px-4 py-2 rounded-xl bg-neutral-100 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={batchModal.isSubmitting}
                onClick={() => handleBatchAction(batchModal.type, batchModal.comment)}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold ${
                  batchModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {batchModal.isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-150 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
