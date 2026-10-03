'use client';
/* Hallmark · macrostructure: Workbench · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

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

  // Batch selection state
  const [selectedLeaveIds, setSelectedLeaveIds] = useState(new Set());
  const [batchModal, setBatchModal] = useState({ isOpen: false, type: 'approve', comment: '', isSubmitting: false });

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

  // Batch Selection Handlers
  const allPendingSelected = useMemo(() => {
    if (pendingFilteredLeaves.length === 0) return false;
    return pendingFilteredLeaves.every((l) => selectedLeaveIds.has(l.id));
  }, [pendingFilteredLeaves, selectedLeaveIds]);

  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelectedLeaveIds(new Set());
    } else {
      setSelectedLeaveIds(new Set(pendingFilteredLeaves.map((l) => l.id)));
    }
  }

  function toggleSelectLeave(id) {
    setSelectedLeaveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openBatchModal(type) {
    setBatchModal({
      isOpen: true,
      type,
      comment:
        type === 'approve'
          ? 'อนุมัติการลาตามระเบียบเรียบร้อย (อนุมัติเป็นกลุ่ม)'
          : 'ไม่อนุมัติคำขอการลา (ไม่อนุมัติเป็นกลุ่ม)',
      isSubmitting: false,
    });
  }

  async function decideBatchLeaves(ids, status, comment) {
    if (!ids || ids.length === 0) return;
    const previousLeaves = [...leaves];
    const idSet = new Set(ids);

    setLeaves((prev) =>
      prev.map((l) => (idSet.has(l.id) ? { ...l, status, teacherComment: comment || null } : l))
    );
    setSelectedLeaveIds(new Set());

    setToast({
      message:
        status === 'อนุมัติ'
          ? `อนุมัติคำขอที่เลือก ${ids.length} รายการ เรียบร้อยแล้ว (ย้ายไปที่ประวัติการอนุมัติ)`
          : `ไม่อนุมัติคำขอที่เลือก ${ids.length} รายการ (ย้ายไปที่ประวัติการอนุมัติ)`,
      type: status === 'อนุมัติ' ? 'success' : 'danger',
    });
    setTimeout(() => setToast(null), 5000);

    const nonMockIds = ids.filter((id) => !String(id).startsWith('mock-'));
    if (nonMockIds.length === 0) return true;

    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: nonMockIds, status, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLeaves(previousLeaves);
        setToast({ message: data.error || 'ดำเนินการเป็นกลุ่มไม่สำเร็จ', type: 'danger' });
        router.refresh();
        return false;
      }
      return true;
    } catch (err) {
      setLeaves(previousLeaves);
      setToast({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย', type: 'danger' });
      return false;
    }
  }

  async function handleBatchSubmit() {
    if (selectedLeaveIds.size === 0) return;
    setBatchModal((prev) => ({ ...prev, isSubmitting: true }));
    const ids = Array.from(selectedLeaveIds);
    const targetStatus = batchModal.type === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ';
    await decideBatchLeaves(ids, targetStatus, batchModal.comment);
    setBatchModal({ isOpen: false, type: 'approve', comment: '', isSubmitting: false });
  }

  const selectedLeavesList = useMemo(() => {
    return leaves.filter((l) => selectedLeaveIds.has(l.id));
  }, [leaves, selectedLeaveIds]);

  const atRiskLeaves = useMemo(() => {
    return selectedLeavesList.filter((l) => {
      const rosterStudent = allStudentsRoster.find(
        (s) => s.studentCode === l.studentCode || s.name === l.studentName
      );
      if (rosterStudent) {
        return rosterStudent.attendanceRate < 80 || rosterStudent.approvedLeaves >= 3;
      }
      return false;
    });
  }, [selectedLeavesList, allStudentsRoster]);

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

      {/* PENDING REQUESTS SECTION HEADER WITH ACTIONS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <span>รายการคำขอลาเรียน (รอพิจารณาอนุมัติ)</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {pendingFilteredLeaves.length} คำร้องรอการตรวจ
              </span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              แสดงเฉพาะคำร้องที่มีสถานะ &quot;รออนุมัติ&quot; — เมื่อกดอนุมัติหรือไม่อนุมัติ รายการจะถูกย้ายไปยัง{' '}
              <Link href="/teacher/history" className="text-[#7749BC] dark:text-purple-300 underline font-semibold">
                ประวัติการอนุมัติ
              </Link>{' '}
              ทันที
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isTodayOnly && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>คำขอวันนี้ ({todayLeavesCount})</span>
              </span>
            )}
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
                      <th className="py-3.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={allPendingSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded text-[#7749BC] focus:ring-[#7749BC] cursor-pointer accent-[#7749BC]"
                          title="เลือกทั้งหมด / ยกเลิกทั้งหมด"
                        />
                      </th>
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
                          className={`hover:bg-neutral-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                            selectedLeaveIds.has(leave.id) ? 'bg-purple-50/60 dark:bg-purple-950/30' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedLeaveIds.has(leave.id)}
                              onChange={() => toggleSelectLeave(leave.id)}
                              className="w-4 h-4 rounded text-[#7749BC] focus:ring-[#7749BC] cursor-pointer accent-[#7749BC]"
                            />
                          </td>
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
                          <input
                            type="checkbox"
                            checked={selectedLeaveIds.has(leave.id)}
                            onChange={() => toggleSelectLeave(leave.id)}
                            className="w-4 h-4 rounded text-[#7749BC] focus:ring-[#7749BC] cursor-pointer accent-[#7749BC] mr-1"
                          />
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

      {/* Floating Batch Action Bar */}
      {selectedLeaveIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-neutral-900/95 dark:bg-slate-800/95 text-white backdrop-blur-xl px-5 py-3.5 rounded-2xl shadow-2xl border border-neutral-700/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7749BC] animate-pulse" />
            <span className="text-xs sm:text-sm font-bold">
              เลือกแล้ว {selectedLeaveIds.size} รายการ
            </span>
            <button
              type="button"
              onClick={() => setSelectedLeaveIds(new Set())}
              className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer ml-1"
            >
              ล้างการเลือก
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => openBatchModal('reject')}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>ไม่อนุมัติที่เลือก</span>
            </button>
            <button
              type="button"
              onClick={() => openBatchModal('approve')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>อนุมัติที่เลือก</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Batch Action Modal */}
      {batchModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {batchModal.type === 'approve' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                )}
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {batchModal.type === 'approve'
                    ? `ยืนยันการอนุมัติแบบกลุ่ม (${selectedLeaveIds.size} รายการ)`
                    : `ยืนยันการไม่อนุมัติแบบกลุ่ม (${selectedLeaveIds.size} รายการ)`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchModal({ isOpen: false, type: 'approve', comment: '', isSubmitting: false })}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* OVERQUOTA WARNING BANNER */}
            {batchModal.type === 'approve' && atRiskLeaves.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>แจ้งเตือน: มีนิสิต {atRiskLeaves.length} ท่านที่เสี่ยงขาดเรียนเกิน 20% (หมดสิทธิ์สอบ)</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                  นิสิตกลุ่มนี้มีสถิติการลาเดิมใกล้เต็มหรือเกินโควต้า 20% หากอนุมัติเพิ่มจะส่งผลกระทบต่อสิทธิ์การสอบ
                </p>
                <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
                  {atRiskLeaves.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-[11px] bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg border border-amber-200/60">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{l.studentName} ({l.studentCode})</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">เสี่ยงหมดสิทธิ์สอบ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LIST OF SELECTED LEAVES */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                รายการคำขอที่เลือก ({selectedLeaveIds.size} รายการ):
              </label>
              <div className="max-h-40 overflow-y-auto divide-y divide-neutral-100 dark:divide-slate-800 border border-neutral-200 dark:border-slate-800 rounded-2xl p-2 bg-neutral-50/70 dark:bg-slate-800/40 text-xs">
                {selectedLeavesList.map((l) => (
                  <div key={l.id} className="py-1.5 px-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {l.studentName} <span className="text-neutral-400 font-mono text-[11px]">({l.studentCode})</span>
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {l.courseCode} · {l.type} ({formatThaiDate(l.startDate)})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSelectLeave(l.id)}
                      className="text-[11px] text-neutral-400 hover:text-rose-500 cursor-pointer"
                      title="นำรายการนี้ออกจากการเลือก"
                    >
                      เอาออก
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* COMMENT BOX */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                หมายเหตุหรือข้อความถึงนิสิตทั้งหมด (ไม่บังคับ)
              </label>
              <textarea
                rows={2}
                value={batchModal.comment}
                onChange={(e) => setBatchModal({ ...batchModal, comment: e.target.value })}
                placeholder="ระบุคำแนะนำหรือเหตุผล..."
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/20 focus:border-[#7749BC] shadow-xs"
              />
            </div>

            {/* FOOTER BUTTONS */}
            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setBatchModal({ isOpen: false, type: 'approve', comment: '', isSubmitting: false })}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium cursor-pointer"
                disabled={batchModal.isSubmitting}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleBatchSubmit}
                disabled={batchModal.isSubmitting || selectedLeaveIds.size === 0}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  batchModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {batchModal.isSubmitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>
                  {batchModal.isSubmitting
                    ? 'กำลังบันทึก...'
                    : `ยืนยัน${batchModal.type === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'} (${selectedLeaveIds.size})`}
                </span>
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
