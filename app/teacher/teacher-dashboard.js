'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  UserCheck,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Filter,
  Users,
  RotateCcw,
  Sparkles,
  ChevronRight,
  HeartPulse,
  User,
  History,
  GraduationCap,
  CalendarDays,
  ChevronDown,
  Layers,
  BarChart3,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { LEAVE_TYPE_DETAILS, LEAVE_TYPE_DEFAULT, STATUS_DETAILS, formatThaiDate, formatThaiDateTime } from '@/lib/ui';
import AttachmentPreview from '@/components/AttachmentPreview';
import TeacherStatsView from './stats/teacher-stats-view';

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
  { key: 'all', label: 'ทั้งหมด', icon: Layers },
  { key: 'ลาป่วย', label: 'ลาป่วย', icon: HeartPulse },
  { key: 'ลากิจส่วนตัว', label: 'ลากิจส่วนตัว', icon: User },
  { key: 'ลากิจกรรม', label: 'ลากิจกรรม', icon: Users },
  { key: 'อื่น ๆ', label: 'อื่น ๆ', icon: HelpCircle },
];

export default function TeacherDashboard({ courses, initialLeaves, rosterByCourse, usingMock = false }) {
  const router = useRouter();
  const [leaves, setLeaves] = useState(initialLeaves);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'analytics' | 'roster' | 'archive'

  // Filters
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isTodayOnly, setIsTodayOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Notification for state transition feedback
  const [toast, setToast] = useState(null);

  // Modals
  const [actionModal, setActionModal] = useState({ isOpen: false, type: 'approve', leave: null, comment: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, leave: null, comment: '' });
  const [studentHistoryModal, setStudentHistoryModal] = useState({ isOpen: false, student: null });
  const [errors, setErrors] = useState({});

  const todayStr = useMemo(() => getTodayStr(), []);

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

  // Total pending leaves count across entire system
  const totalPendingCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'รออนุมัติ').length;
  }, [leaves]);

  const totalApprovedCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'อนุมัติ').length;
  }, [leaves]);

  const totalRejectedCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
  }, [leaves]);

  // PENDING ONLY LEAVES for the Pending Requests Tab (Requirement 2.1)
  const pendingFilteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      // 1. STRICT REQUIREMENT: Only Pending requests in this tab
      if (leave.status !== 'รออนุมัติ') {
        return false;
      }

      // 2. Term filter
      if (selectedTerm !== 'all') {
        const leaveTerm = leave.courseTerm || courses.find((c) => c.id === leave.courseId)?.term;
        if (leaveTerm && leaveTerm !== selectedTerm) return false;
      }

      // 3. Course filter
      if (selectedCourseId !== 'all' && leave.courseId !== selectedCourseId) {
        return false;
      }

      // 4. Category/Type filter
      if (typeFilter !== 'all') {
        if (typeFilter === 'อื่น ๆ' || typeFilter === 'อื่นๆ') {
          if (leave.type !== 'อื่น ๆ' && leave.type !== 'อื่นๆ' && leave.type !== 'เหตุฉุกเฉิน') return false;
        } else if (leave.type !== typeFilter) {
          return false;
        }
      }

      // 5. Today overview filter
      if (isTodayOnly) {
        const start = leave.startDate;
        const end = leave.endDate || leave.startDate;
        const isCurrentDate = todayStr >= start && todayStr <= end;
        if (!isCurrentDate) return false;
      }

      // 6. Search query
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
  }, [leaves, courses, selectedTerm, selectedCourseId, typeFilter, isTodayOnly, searchQuery, todayStr]);

  // Today's count
  const todayLeavesCount = useMemo(() => {
    return leaves.filter((l) => {
      if (l.status !== 'รออนุมัติ') return false;
      const start = l.startDate;
      const end = l.endDate || l.startDate;
      return todayStr >= start && todayStr <= end;
    }).length;
  }, [leaves, todayStr]);

  // Flat roster of all students across all teacher courses
  const allStudentsRoster = useMemo(() => {
    const studentMap = new Map();
    Object.entries(rosterByCourse).forEach(([cId, students]) => {
      const courseObj = courses.find((c) => c.id === cId);
      students.forEach((s) => {
        if (!studentMap.has(s.studentId)) {
          studentMap.set(s.studentId, {
            ...s,
            courses: [courseObj ? `${courseObj.code} (${courseObj.term})` : cId],
          });
        } else {
          const existing = studentMap.get(s.studentId);
          existing.courses.push(courseObj ? `${courseObj.code} (${courseObj.term})` : cId);
          existing.approvedLeaves += s.approvedLeaves;
        }
      });
    });
    return Array.from(studentMap.values());
  }, [rosterByCourse, courses]);

  // API Call to Update Status & Trigger State Transition
  async function decideLeave(leave, status, comment) {
    const previousLeaves = [...leaves];
    // Optimistically update
    setLeaves((prev) =>
      prev.map((l) => (l.id === leave.id ? { ...l, status, teacherComment: comment || null } : l))
    );

    // Show Toast
    setToast({
      message:
        status === 'อนุมัติ'
          ? `อนุมัติคำขอของ ${leave.studentName} เรียบร้อยแล้ว (ย้ายไปที่ประวัติการอนุมัติ)`
          : status === 'ไม่อนุมัติ'
          ? `ไม่อนุมัติคำขอของ ${leave.studentName} (ย้ายไปที่ประวัติการอนุมัติ)`
          : `นำคำขอของ ${leave.studentName} กลับมารออนุมัติ`,
      type: status === 'อนุมัติ' ? 'success' : status === 'ไม่อนุมัติ' ? 'danger' : 'info',
    });
    setTimeout(() => setToast(null), 5000);

    if (String(leave.id).startsWith('mock-')) {
      return true;
    }

    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leave.id, status, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeaves(previousLeaves);
        setErrors((prev) => ({ ...prev, [leave.id]: data.error || 'ดำเนินการไม่สำเร็จ' }));
        router.refresh();
        return false;
      }
      return true;
    } catch (err) {
      setLeaves(previousLeaves);
      return false;
    }
  }

  function openActionModal(leave, type) {
    setErrors((prev) => ({ ...prev, [leave.id]: '' }));
    setActionModal({
      isOpen: true,
      type,
      leave,
      comment:
        type === 'approve'
          ? 'อนุมัติการลาตามระเบียบเรียบร้อย'
          : type === 'reject'
          ? 'ไม่อนุมัติเนื่องจากข้อมูลหรือเอกสารประกอบไม่ครบถ้วนตามเกณฑ์'
          : 'ยกเลิกการตัดสินใจ นำกลับมาพิจารณาใหม่',
    });
  }

  function openDetailModal(leave) {
    setErrors((prev) => ({ ...prev, [leave.id]: '' }));
    setDetailModal({ isOpen: true, leave, comment: leave.teacherComment || '' });
  }

  function openStudentHistory(student) {
    setStudentHistoryModal({ isOpen: true, student });
  }

  async function handleConfirmAction() {
    const { leave, type, comment } = actionModal;
    if (!leave) return;
    const targetStatus = type === 'approve' ? 'อนุมัติ' : type === 'reject' ? 'ไม่อนุมัติ' : 'รออนุมัติ';
    setActionModal({ isOpen: false, type: 'approve', leave: null, comment: '' });
    await decideLeave(leave, targetStatus, comment);
  }

  async function handleDetailDecision(status) {
    const { leave, comment } = detailModal;
    if (!leave) return;
    setDetailModal({ isOpen: false, leave: null, comment: '' });
    await decideLeave(leave, status, comment);
  }

  return (
    <div className="space-y-6">
      {usingMock && (
        <div className="flex items-start sm:items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            กำลังแสดง<strong>ข้อมูลตัวอย่าง (Mock Data)</strong> สำหรับทดสอบระบบ
          </span>
        </div>
      )}

      {/* Floating Toast Notification for State Transitions */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce sm:animate-none">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : toast.type === 'danger'
                ? 'bg-rose-900/90 text-white border-rose-700'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            ) : toast.type === 'danger' ? (
              <XCircle className="w-4 h-4 text-rose-300 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span>{toast.message}</span>
            <Link
              href="/teacher/history"
              className="ml-2 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] underline flex items-center gap-1 transition-colors"
            >
              <span>ดูประวัติ</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Navigation View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>คำร้องรออนุมัติ</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                totalPendingCount > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutral-200 dark:bg-slate-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {totalPendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#7749BC]" />
            <span>สถิติและการวิเคราะห์</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-500" />
            <span>ประวัตินิสิตรายบุคคล ({allStudentsRoster.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-slate-900 text-[#7749BC] dark:text-purple-300 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-500" />
            <span>คลังสถิติย้อนหลัง (Archive)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/teacher/history"
            className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-slate-800 hover:bg-neutral-100 border border-neutral-200/80 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#7749BC]" />
            <span>ประวัติการอนุมัติ ({totalApprovedCount + totalRejectedCount})</span>
          </Link>
          <a
            href="/api/export"
            className="flex items-center space-x-1.5 text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-white/80 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </a>
          <a
            href="/teacher/print"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-slate-800 hover:bg-white border border-neutral-200/80 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </a>
        </div>
      </div>

      {/* TAB 1: PENDING REQUESTS TAB (Requirement 2.1) */}
      {activeTab === 'requests' && (
        <section className="space-y-4">
          {/* SECTION HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>รายการคำขอลาเรียน (รอพิจารณาอนุมัติ)</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {pendingFilteredLeaves.length} คำร้องรอการตรวจ
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                แสดงเฉพาะคำร้องที่มีสถานะ &quot;รออนุมัติ&quot; — เมื่อกดอนุมัติหรือไม่อนุมัติ รายการจะถูกย้ายไปยัง{' '}
                <Link href="/teacher/history" className="text-[#7749BC] dark:text-purple-300 underline font-semibold">
                  ประวัติการอนุมัติ
                </Link>{' '}
                ทันที
              </p>
            </div>

            {isTodayOnly && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 self-start sm:self-auto">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>คำขอของวันนี้ ({todayLeavesCount} รายการ)</span>
              </span>
            )}
          </div>

          {pendingFilteredLeaves.length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-12 text-center shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                ไม่มีคำร้องรอพิจารณาในขณะนี้
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                คุณได้พิจารณาอนุมัติคำขอลาเรียนของนิสิตครบถ้วนแล้ว หรือไม่มีคำร้องที่ตรงกับตัวกรองที่เลือก
              </p>
              <div className="pt-2">
                <Link
                  href="/teacher/history"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7749BC] text-white text-xs font-semibold shadow-xs hover:bg-[#5B21B6] transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>ดูประวัติคำร้องที่เคยพิจารณาแล้ว ({totalApprovedCount + totalRejectedCount} รายการ)</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              {/* Desktop Responsive Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100/70 dark:bg-slate-800/80 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200/60 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">นิสิตผู้ยื่น</th>
                      <th className="py-3.5 px-4">รายวิชา & กลุ่ม</th>
                      <th className="py-3.5 px-4">ประเภท & วันที่ลา</th>
                      <th className="py-3.5 px-4">เหตุผลการลา</th>
                      <th className="py-3.5 px-4 text-center">สถานะปัจจุบัน</th>
                      <th className="py-3.5 px-4 text-center">จัดการสถานะ (Action Buttons)</th>
                      <th className="py-3.5 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                    {pendingFilteredLeaves.map((leave) => {
                      const typeCls = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;
                      return (
                        <tr
                          key={leave.id}
                          className="hover:bg-neutral-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* Student */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                                {initials(leave.studentName)}
                              </div>
                              <div>
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                  {leave.studentName}
                                </p>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                  {leave.studentCode}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Course */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{leave.courseCode}</p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">
                              {leave.courseName} {leave.section ? `(กลุ่ม ${leave.section})` : ''}
                            </p>
                          </td>

                          {/* Type & Date */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${typeCls}`}
                              >
                                {leave.type}
                              </span>
                              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                                {formatThaiDate(leave.startDate)}
                                {leave.endDate && leave.endDate !== leave.startDate
                                  ? ` - ${formatThaiDate(leave.endDate)}`
                                  : ''}
                              </p>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-3.5 px-4 max-w-[220px]">
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate" title={leave.reason}>
                              {leave.reason}
                            </p>
                            {leave.attachment && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">
                                <FileText className="w-3 h-3" />
                                <span>มีเอกสารแนบ</span>
                              </span>
                            )}
                          </td>

                          {/* Status Badge: Consistent Amber Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>รออนุมัติ</span>
                            </span>
                          </td>

                          {/* Quick Action Buttons (อนุมัติ / ไม่อนุมัติ) */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openActionModal(leave, 'approve')}
                                title="อนุมัติคำขอนี้ทันที"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer ring-1 ring-white/20"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>อนุมัติ</span>
                              </button>
                              <button
                                onClick={() => openActionModal(leave, 'reject')}
                                title="ไม่อนุมัติคำขอนี้"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>ไม่อนุมัติ</span>
                              </button>
                            </div>
                          </td>

                          {/* Detail Modal Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openDetailModal(leave)}
                              className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-purple-100 text-neutral-700 hover:text-[#7749BC] dark:bg-slate-800 dark:hover:bg-purple-950/60 dark:text-neutral-200 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูข้อมูล</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Responsive Cards */}
              <div className="lg:hidden divide-y divide-neutral-100 dark:divide-slate-800">
                {pendingFilteredLeaves.map((leave) => {
                  const typeCls = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;
                  return (
                    <div key={leave.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials(leave.studentName)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                              {leave.studentName}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                              {leave.studentCode}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${typeCls}`}>
                          {leave.type}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {leave.courseCode} {leave.courseName} {leave.section ? `(กลุ่ม ${leave.section})` : ''}
                        </p>
                        <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                          วันที่ลา: {formatThaiDate(leave.startDate)}{' '}
                          {leave.endDate && leave.endDate !== leave.startDate
                            ? ` - ${formatThaiDate(leave.endDate)}`
                            : ''}{' '}
                          ({leave.period})
                        </p>
                        <p className="text-neutral-700 dark:text-neutral-300 pt-1 border-t border-neutral-200/40 dark:border-slate-700/40">
                          <strong>เหตุผล:</strong> {leave.reason}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>รออนุมัติ</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openDetailModal(leave)}
                            className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200"
                          >
                            ดูข้อมูล
                          </button>
                          <button
                            onClick={() => openActionModal(leave, 'reject')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold"
                          >
                            ไม่อนุมัติ
                          </button>
                          <button
                            onClick={() => openActionModal(leave, 'approve')}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs"
                          >
                            อนุมัติ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FILTER CONTROLS BAR */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs mt-6">
            <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-slate-800">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                <span>ตัวกรองและค้นหาคำขอลาเรียนรออนุมัติ (Filters & Search)</span>
              </span>
              <span className="text-[11px] text-neutral-400">
                ผลการกรอง: {pendingFilteredLeaves.length} รายการ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Academic Year & Semester Filter */}
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

              {/* 2. Course Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  เลือกรายวิชา (Course)
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

              {/* 3. Search Query */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  ค้นหาข้อมูล (Search)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อนิสิต, รหัสนิสิต, รหัสวิชา, หรือเหตุผล..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Filter Quick Pills */}
            <div className="pt-2 border-t border-neutral-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Daily Overview Button */}
                <button
                  onClick={() => setIsTodayOnly(!isTodayOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isTodayOnly
                      ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>คำขอลาวันนี้ ({todayLeavesCount})</span>
                </button>
              </div>

              {/* Right: Leave Type Pills */}
              <div className="flex flex-wrap items-center gap-1">
                {LEAVE_CATEGORIES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      typeFilter === key
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
        </section>
      )}

      {/* TAB 2: INSTRUCTOR ANALYTICS & STATISTICS (Requirement 1.2) */}
      {activeTab === 'analytics' && (
        <section className="space-y-4">
          <TeacherStatsView courses={courses} leaves={leaves} rosterByCourse={rosterByCourse} />
        </section>
      )}

      {/* TAB 3: STUDENT ROSTER & HISTORY */}
      {activeTab === 'roster' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                ประวัตินิสิตและสถิติการลารายบุคคล
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                คลิกที่นิสิตเพื่อดูประวัติการยื่นใบลาและเอกสารย้อนหลังทั้งหมดของนิสิตคนนั้น
              </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/70 dark:bg-slate-800/80 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200/60 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">รหัสนิสิต</th>
                    <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                    <th className="py-3.5 px-4 text-center">จำนวนครั้งที่ลา</th>
                    <th className="py-3.5 px-4 text-center">สถานะคำขอ (อนุมัติ/รอ/ไม่)</th>
                    <th className="py-3.5 px-4">ประเภทที่ลา</th>
                    <th className="py-3.5 px-4 text-center">เวลาเรียน (%)</th>
                    <th className="py-3.5 px-4 text-center">โควต้า</th>
                    <th className="py-3.5 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                  {allStudentsRoster
                    .filter((s) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return s.studentName.toLowerCase().includes(q) || s.studentCode.includes(q);
                    })
                    .map((student) => {
                      const studentLeaves = leaves.filter(
                        (l) => l.studentId === student.studentId || l.studentCode === student.studentCode
                      );
                      const sApproved = studentLeaves.filter((l) => l.status === 'อนุมัติ').length;
                      const sPending = studentLeaves.filter((l) => l.status === 'รออนุมัติ').length;
                      const sRejected = studentLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
                      const sSick = studentLeaves.filter((l) => l.type === 'ลาป่วย').length;
                      const sPersonal = studentLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
                      const sActivity = studentLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
                      const sOther = studentLeaves.filter((l) => l.type === 'อื่นๆ' || l.type === 'เหตุฉุกเฉิน').length;

                      return (
                        <tr
                          key={student.studentId}
                          className="hover:bg-neutral-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                            {student.studentCode}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{student.studentName}</p>
                            <p className="text-[11px] text-neutral-400 font-mono">{student.email}</p>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-sm text-[#7749BC] dark:text-purple-300">
                              {studentLeaves.length}
                            </span>
                            <span className="text-[11px] text-neutral-400 block font-normal">ครั้ง</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 text-xs">
                              <span
                                className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800"
                                title="อนุมัติแล้ว"
                              >
                                {sApproved}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800"
                                title="ยังไม่อนุมัติ / รอพิจารณา"
                              >
                                {sPending}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800"
                                title="ไม่อนุมัติ"
                              >
                                {sRejected}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {studentLeaves.length === 0 ? (
                              <span className="text-neutral-400 text-[11px]">-</span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                {sSick > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                    ป่วย {sSick}
                                  </span>
                                )}
                                {sPersonal > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    กิจ {sPersonal}
                                  </span>
                                )}
                                {sActivity > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    กิจกรรม {sActivity}
                                  </span>
                                )}
                                {sOther > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    อื่นๆ {sOther}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`font-bold ${
                                student.overQuota
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {student.percentage}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {student.overQuota ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <AlertTriangle className="w-3 h-3" />
                                <span>เกินโควต้า</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <UserCheck className="w-3 h-3" />
                                <span>ปกติ</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => openStudentHistory(student)}
                              className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-[#7749BC] text-[#7749BC] hover:text-white dark:bg-purple-950/60 dark:hover:bg-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>ดูประวัติ ({studentLeaves.length})</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: ARCHIVE */}
      {activeTab === 'archive' && (
        <section className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white space-y-3">
            <div className="flex items-center gap-2 text-purple-200 text-xs font-semibold uppercase tracking-wider">
              <History className="w-4 h-4" />
              <span>ระบบสืบค้นสถิติย้อนหลัง (Historical Archive)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">คลังข้อมูลการลาและสถิติสะสมตามปีการศึกษา</h3>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              สืบค้นข้อมูลการลาเรียนย้อนหลัง สรุปอัตราส่วนการอนุมัติ เปอร์เซ็นต์การเข้าเรียน และเอกสารหลักฐานของทุกภาคการศึกษา
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {academicTerms.map((term) => {
              const termLeaves = leaves.filter(
                (l) => (l.courseTerm || courses.find((c) => c.id === l.courseId)?.term) === term
              );
              const termApproved = termLeaves.filter((l) => l.status === 'อนุมัติ').length;
              const termSick = termLeaves.filter((l) => l.type === 'ลาป่วย').length;
              const termPersonal = termLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;

              return (
                <div
                  key={term}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold text-xs">
                      ภาคเรียนที่ {term}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">{termLeaves.length} คำร้อง</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>อนุมัติแล้ว:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{termApproved} รายการ</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>ลาป่วย:</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">{termSick} รายการ</span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>ลากิจส่วนตัว:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{termPersonal} รายการ</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTerm(term);
                      setActiveTab('requests');
                    }}
                    className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-[#7749BC] hover:text-white dark:bg-slate-800 dark:hover:bg-[#7749BC] text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>ดูคำร้องรอตรวจในภาคเรียนนี้</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MODAL 1: Detail Modal */}
      {detailModal.isOpen && detailModal.leave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {detailModal.leave.courseCode} {detailModal.leave.section ? ` กลุ่ม ${detailModal.leave.section}` : ''}
                  </span>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {detailModal.leave.courseName}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailModal({ isOpen: false, leave: null, comment: '' })}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student Card */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-base border border-purple-200 dark:border-purple-800 shrink-0">
                  {initials(detailModal.leave.studentName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {detailModal.leave.studentName}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    รหัสนิสิต: {detailModal.leave.studentCode}
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono truncate">{detailModal.leave.studentEmail}</p>
                </div>
              </div>

              {/* Date and Period Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                    <span>วันที่ลา</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
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
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">เหตุผลการลา</p>
                <p className="text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-neutral-200/60 dark:border-slate-700">
                  {detailModal.leave.reason}
                </p>
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

              {/* Teacher Comment */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                  <span>บันทึกข้อความ / หมายเหตุของอาจารย์</span>
                </label>
                <textarea
                  rows={2}
                  value={detailModal.comment}
                  onChange={(e) => setDetailModal({ ...detailModal, comment: e.target.value })}
                  placeholder="เช่น อนุมัติการลาตามระเบียบ หรือ ขอเอกสารฉบับจริงในคาบถัดไป..."
                  className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/20 focus:border-[#7749BC] shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>ยื่นคำร้องเมื่อ: {formatThaiDateTime(detailModal.leave.createdAt)}</span>
                <span>รหัสคำร้อง: #{detailModal.leave.id}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-neutral-100 dark:border-slate-800 p-4 flex items-center justify-end gap-2 rounded-b-3xl">
              <button
                onClick={() => handleDetailDecision('ไม่อนุมัติ')}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>ไม่อนุมัติ</span>
              </button>
              <button
                onClick={() => handleDetailDecision('อนุมัติ')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1 cursor-pointer ring-1 ring-white/30"
              >
                <Check className="w-3.5 h-3.5" />
                <span>อนุมัติคำขอ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Student History Drilldown */}
      {studentHistoryModal.isOpen && studentHistoryModal.student && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center font-bold text-lg">
                    {initials(studentHistoryModal.student.studentName)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {studentHistoryModal.student.studentName}
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono">
                      รหัสนิสิต: {studentHistoryModal.student.studentCode} • {studentHistoryModal.student.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStudentHistoryModal({ isOpen: false, student: null })}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Student Summary Stats */}
              {(() => {
                const sLeaves = leaves.filter(
                  (l) =>
                    l.studentId === studentHistoryModal.student.studentId ||
                    l.studentCode === studentHistoryModal.student.studentCode
                );
                const approvedCount = sLeaves.filter((l) => l.status === 'อนุมัติ').length;
                const sickCount = sLeaves.filter((l) => l.type === 'ลาป่วย').length;
                const personalCount = sLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
                const activityCount = sLeaves.filter((l) => l.type === 'ลากิจกรรม').length;

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                      <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700">
                        <p className="text-[10px] text-neutral-400">ยื่นคำร้องทั้งหมด</p>
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{sLeaves.length} ครั้ง</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">อนุมัติแล้ว</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{approvedCount} ครั้ง</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                        <p className="text-[10px] text-sky-600 dark:text-sky-400">ลาป่วย</p>
                        <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{sickCount} ครั้ง</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                        <p className="text-[10px] text-purple-600 dark:text-purple-400">ลากิจ / กิจกรรม</p>
                        <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                          {personalCount + activityCount} ครั้ง
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                        ประวัติการยื่นใบลาทั้งหมดของนิสิต ({sLeaves.length} รายการ)
                      </h4>
                      {sLeaves.length === 0 ? (
                        <p className="text-xs text-neutral-500 py-6 text-center">ยังไม่มีประวัติการยื่นคำขอลาเรียน</p>
                      ) : (
                        <div className="space-y-2.5">
                          {sLeaves.map((l) => {
                            const statusDetail = STATUS_DETAILS[l.status] || STATUS_DETAILS['รออนุมัติ'];
                            const typeCls = LEAVE_TYPE_DETAILS[l.type] || LEAVE_TYPE_DEFAULT;
                            return (
                              <div
                                key={l.id}
                                className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                                    {l.courseCode} {l.courseName}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusDetail.badge}`}
                                  >
                                    {statusDetail.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                                  <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${typeCls}`}>
                                    {l.type}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {formatThaiDate(l.startDate)} ({l.period})
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-neutral-200/40 dark:border-slate-800">
                                  {l.reason}
                                </p>
                                {l.attachment && (
                                  <div className="text-xs">
                                    <AttachmentPreview
                                      src={`/api/leaves/attachment/${l.attachment}`}
                                      label="ตรวจเอกสารแนบ"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="p-4 border-t border-neutral-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setStudentHistoryModal({ isOpen: false, student: null })}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Action Confirm Modal */}
      {actionModal.isOpen && actionModal.leave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {actionModal.type === 'approve' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                ) : actionModal.type === 'reject' ? (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                )}
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {actionModal.type === 'approve'
                    ? 'ยืนยันการอนุมัติคำขอลา'
                    : actionModal.type === 'reject'
                    ? 'ยืนยันการไม่อนุมัติคำขอลา'
                    : 'นำคำขอกลับมาเป็นสถานะรออนุมัติ'}
                </h3>
              </div>
              <button
                onClick={() => setActionModal({ isOpen: false, type: 'approve', leave: null, comment: '' })}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800 border border-neutral-200/80 dark:border-slate-700 text-xs space-y-1">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {actionModal.leave.studentName} ({actionModal.leave.studentCode})
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                {actionModal.leave.courseCode} {actionModal.leave.courseName}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400">
                วันที่ลา: {formatThaiDate(actionModal.leave.startDate)} ({actionModal.leave.period})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                หมายเหตุหรือข้อความถึงนิสิต (ไม่บังคับ)
              </label>
              <textarea
                rows={3}
                value={actionModal.comment}
                onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value })}
                placeholder="ระบุคำแนะนำหรือเหตุผล..."
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/20 focus:border-[#7749BC] shadow-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setActionModal({ isOpen: false, type: 'approve', leave: null, comment: '' })}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer ${
                  actionModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionModal.type === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
