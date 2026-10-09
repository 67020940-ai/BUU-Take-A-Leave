'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Eye,
  Clock,
  HeartPulse,
  User,
  Users,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import TeacherSidebar from '@/components/TeacherSidebar';
import TeacherTopBar from '@/components/TeacherTopBar';
import AttachmentPreview from '@/components/AttachmentPreview';
import MobileBottomNav from '@/components/MobileBottomNav';
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

export default function TeacherHistoryView({
  user,
  courses = [],
  initialLeaves = [],
  rosterByCourse = {},
  usingMock = false,
}) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'อนุมัติ' | 'ไม่อนุมัติ' | 'เพิกถอน'
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailModal, setDetailModal] = useState({ isOpen: false, leave: null });
  const [reconsiderModal, setReconsiderModal] = useState({ isOpen: false, leave: null, type: 'reconsider', comment: '' });
  const [toast, setToast] = useState(null);

  // Sync status filter from query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const st = sp.get('status') || sp.get('tab');
      if (st) {
        if (st.includes('อนุมัติ') && !st.includes('ไม่อนุมัติ') && !st.includes('เพิกถอน')) setStatusFilter('อนุมัติ');
        else if (st.includes('ไม่อนุมัติ')) setStatusFilter('ไม่อนุมัติ');
        else if (st.includes('เพิกถอน')) setStatusFilter('เพิกถอน');
        else if (st === 'all') setStatusFilter('all');
      }
    }
  }, []);

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

  // History leaves (items that have been acted upon, or all)
  const historyLeaves = useMemo(() => {
    return leaves.filter((l) => l.status !== 'รออนุมัติ');
  }, [leaves]);

  const approvedCount = useMemo(() => leaves.filter((l) => l.status === 'อนุมัติ').length, [leaves]);
  const rejectedCount = useMemo(() => leaves.filter((l) => l.status === 'ไม่อนุมัติ').length, [leaves]);
  const revokedCount = useMemo(() => leaves.filter((l) => l.status === 'เพิกถอนการอนุมัติ' || l.status === 'เพิกถอน').length, [leaves]);
  const totalPendingCount = useMemo(() => leaves.filter((l) => l.status === 'รออนุมัติ').length, [leaves]);

  // Filtered
  const filteredLeaves = useMemo(() => {
    return historyLeaves.filter((leave) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'เพิกถอน') {
          if (leave.status !== 'เพิกถอนการอนุมัติ' && leave.status !== 'เพิกถอน') return false;
        } else if (leave.status !== statusFilter) {
          return false;
        }
      }

      if (selectedTerm !== 'all') {
        const c = courses.find((course) => course.id === leave.courseId);
        const term = leave.courseTerm || c?.term;
        if (term !== selectedTerm) return false;
      }

      if (selectedCourseId !== 'all' && leave.courseId !== selectedCourseId) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStudent = (leave.studentName || '').toLowerCase().includes(q);
        const matchCode = (leave.studentCode || '').includes(q);
        const matchCourse = (leave.courseName || '').toLowerCase().includes(q) || (leave.courseCode || '').includes(q);
        const matchReason = (leave.reason || '').toLowerCase().includes(q);
        if (!matchStudent && !matchCode && !matchCourse && !matchReason) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.approvedAt || a.createdAt || a.startDate || 0).getTime();
      const timeB = new Date(b.approvedAt || b.createdAt || b.startDate || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
    });
  }, [historyLeaves, statusFilter, selectedTerm, selectedCourseId, searchQuery, courses]);

  async function handleAction(leave, targetStatus, comment) {
    const previous = [...leaves];
    setLeaves((prev) =>
      prev.map((l) => (l.id === leave.id ? { ...l, status: targetStatus, teacherComment: comment || l.teacherComment } : l))
    );

    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leave.id, status: targetStatus, comment }),
      });
      if (!res.ok) throw new Error('Action failed');

      setToast({ type: 'success', message: 'บันทึกการเปลี่ยนแปลงสถานะเรียบร้อยแล้ว' });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setLeaves(previous);
      setToast({ type: 'error', message: 'เกิดข้อผิดพลาดในการบันทึก' });
      setTimeout(() => setToast(null), 3500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 flex flex-col lg:flex-row">
      <TeacherSidebar
        user={user}
        mode="menu"
        activeTab="history"
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
          searchPlaceholder="ค้นหาประวัติการอนุมัติ, รหัสนิสิต..."
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Banner */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shadow-xs">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                  ประวัติการอนุมัติ (Approval History)
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  ตรวจสอบและสืบค้นบันทึกการพิจารณาคำขอลาเรียนย้อนหลัง
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

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-slate-800 pb-3">
            {[
              { key: 'all', label: 'ทั้งหมด', count: historyLeaves.length },
              { key: 'อนุมัติ', label: 'อนุมัติแล้ว', count: approvedCount },
              { key: 'ไม่อนุมัติ', label: 'ไม่อนุมัติ', count: rejectedCount },
              { key: 'เพิกถอน', label: 'เพิกถอนแล้ว', count: revokedCount },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                      : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 border border-neutral-200/80 dark:border-slate-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  ภาคเรียน
                </label>
                <div className="relative">
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none cursor-pointer"
                  >
                    <option value="all">ทุกภาคการศึกษา</option>
                    {academicTerms.map((t) => (
                      <option key={t} value={t}>
                        ภาคเรียนที่ {t}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  รายวิชา
                </label>
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none cursor-pointer"
                  >
                    <option value="all">ทุกรายวิชา</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} {c.name} {c.group ? `(กลุ่ม ${c.group})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  ค้นหาประวัติ
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อนิสิต, รหัส หรือวิชา..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* History Records List */}
          {filteredLeaves.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-neutral-200/80 dark:border-slate-800 space-y-3">
              <History className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                ไม่พบประวัติการอนุมัติ
              </h3>
              <p className="text-xs text-neutral-400">
                ยังไม่มีรายการที่ได้รับการพิจารณาหรือตรงตามเงื่อนไขที่เลือก
              </p>
            </div>
          ) : (
            <>
              {/* 1. Mobile Card List (< md) */}
              <div className="block md:hidden space-y-3">
                {filteredLeaves.map((leave) => {
                  const statusInfo = STATUS_DETAILS[leave.status] || STATUS_DETAILS['อนุมัติ'];
                  const typeBadge = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;

                  return (
                    <div
                      key={leave.id}
                      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials(leave.studentName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-neutral-900 dark:text-neutral-100 truncate">{leave.studentName}</p>
                            <p className="font-mono text-[10px] text-neutral-400">{leave.studentCode}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${statusInfo.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          <span>{statusInfo.label || leave.status}</span>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#7749BC] dark:text-purple-400">{leave.courseCode}</span>
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge}`}>
                            {leave.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">{leave.courseName}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          วันที่ลา: {formatThaiDate(leave.startDate)}
                          {leave.endDate && leave.endDate !== leave.startDate ? ` - ${formatThaiDate(leave.endDate)}` : ''}
                        </p>
                      </div>

                      {leave.teacherComment && (
                        <p className="text-[11px] text-neutral-500 italic bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-xl">
                          ความเห็น: {leave.teacherComment}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setDetailModal({ isOpen: true, leave })}
                          className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูข้อมูล</span>
                        </button>

                        {leave.status === 'อนุมัติ' ? (
                          <button
                            type="button"
                            onClick={() => setReconsiderModal({ isOpen: true, leave, type: 'revoke', comment: '' })}
                            className="min-h-[44px] py-2 px-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>เพิกถอน</span>
                          </button>
                        ) : leave.status === 'ไม่อนุมัติ' || leave.status === 'เพิกถอนการอนุมัติ' ? (
                          <button
                            type="button"
                            onClick={() => setReconsiderModal({ isOpen: true, leave, type: 'reconsider', comment: '' })}
                            className="min-h-[44px] py-2 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7749BC] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>พิจารณาใหม่</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. Tablet & Desktop Full Data Table (>= md) */}
              <div className="hidden md:block bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50/80 dark:bg-slate-800/80 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200/80 dark:border-slate-700">
                      <tr>
                        <th className="p-3.5 pl-5">นิสิต</th>
                        <th className="p-3.5">รายวิชา</th>
                        <th className="p-3.5">ประเภทการลา</th>
                        <th className="p-3.5">วันที่ลา</th>
                        <th className="p-3.5">สถานะ</th>
                        <th className="p-3.5">ข้อคิดเห็นอาจารย์</th>
                        <th className="p-3.5 pr-5 text-right">การกระทำ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                      {filteredLeaves.map((leave) => {
                        const statusInfo = STATUS_DETAILS[leave.status] || STATUS_DETAILS['อนุมัติ'];
                        const typeBadge = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;

                        return (
                          <tr key={leave.id} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5 pl-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-bold text-[11px] flex items-center justify-center shrink-0">
                                  {initials(leave.studentName)}
                                </div>
                                <div>
                                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{leave.studentName}</p>
                                  <p className="font-mono text-[10px] text-neutral-400">{leave.studentCode}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 text-neutral-700 dark:text-neutral-300">
                              <span className="font-mono font-bold text-[#7749BC] dark:text-purple-400">{leave.courseCode}</span>
                              <span className="block text-[11px] text-neutral-500 truncate max-w-[140px]">{leave.courseName}</span>
                            </td>

                            <td className="p-3.5">
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeBadge}`}>
                                {leave.type}
                              </span>
                            </td>

                            <td className="p-3.5 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                              {formatThaiDate(leave.startDate)}
                            </td>

                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                <span>{statusInfo.label || leave.status}</span>
                              </span>
                            </td>

                            <td className="p-3.5 text-neutral-500 text-[11px] max-w-[160px] truncate">
                              {leave.teacherComment || '-'}
                            </td>

                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDetailModal({ isOpen: true, leave })}
                                  className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                                  title="ดูรายละเอียด"
                                >
                                  ดูข้อมูล
                                </button>

                                {leave.status === 'อนุมัติ' ? (
                                  <button
                                    type="button"
                                    onClick={() => setReconsiderModal({ isOpen: true, leave, type: 'revoke', comment: '' })}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
                                    title="เพิกถอนการอนุมัติ"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>เพิกถอน</span>
                                  </button>
                                ) : leave.status === 'ไม่อนุมัติ' || leave.status === 'เพิกถอนการอนุมัติ' ? (
                                  <button
                                    type="button"
                                    onClick={() => setReconsiderModal({ isOpen: true, leave, type: 'reconsider', comment: '' })}
                                    className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#7749BC] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 text-xs font-semibold cursor-pointer flex items-center gap-1"
                                    title="พิจารณาใหม่"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>พิจารณาใหม่</span>
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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
                  ประวัติคำขอลาเรียน
                </h3>
                <p className="text-xs text-neutral-500 font-mono">
                  {detailModal.leave.studentCode} • {detailModal.leave.studentName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, leave: null })}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 space-y-2 text-xs">
              <p><strong>วิชา:</strong> {detailModal.leave.courseCode} {detailModal.leave.courseName}</p>
              <p><strong>ประเภทการลา:</strong> {detailModal.leave.type}</p>
              <p><strong>ช่วงเวลา:</strong> {formatThaiDate(detailModal.leave.startDate)} ({detailModal.leave.period})</p>
              <p><strong>เหตุผลนิสิต:</strong> {detailModal.leave.reason || '-'}</p>
              <p><strong>สถานะปัจจุบัน:</strong> {detailModal.leave.status}</p>
              <p><strong>ความเห็นอาจารย์:</strong> {detailModal.leave.teacherComment || 'ไม่มี'}</p>
            </div>

            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                เอกสารแนบ / หลักฐาน
              </p>
              <AttachmentPreview
                attachment={detailModal.leave.attachment}
                leaveId={detailModal.leave.id}
                title="หลักฐานประกอบการลา"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, leave: null })}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECONSIDER / REVOKE MODAL */}
      {reconsiderModal.isOpen && reconsiderModal.leave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {reconsiderModal.type === 'revoke' ? 'เพิกถอนการอนุมัติ' : 'พิจารณาคำขอลาใหม่'}
            </h3>
            <p className="text-xs text-neutral-500">
              นิสิต: {reconsiderModal.leave.studentName} ({reconsiderModal.leave.studentCode})
            </p>

            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                หมายเหตุประกอบการดำเนินการ
              </label>
              <textarea
                value={reconsiderModal.comment}
                onChange={(e) => setReconsiderModal((p) => ({ ...p, comment: e.target.value }))}
                placeholder="ระบุเหตุผล เช่น เอกสารไม่ถูกต้อง, ปรับเปลี่ยนสถานะ..."
                rows={3}
                className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReconsiderModal({ isOpen: false, leave: null, type: 'reconsider', comment: '' })}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetStatus = reconsiderModal.type === 'revoke' ? 'เพิกถอนการอนุมัติ' : 'อนุมัติ';
                  handleAction(reconsiderModal.leave, targetStatus, reconsiderModal.comment);
                  setReconsiderModal({ isOpen: false, leave: null, type: 'reconsider', comment: '' });
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold ${
                  reconsiderModal.type === 'revoke' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#7749BC] hover:bg-[#683ca8]'
                }`}
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
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

      {/* Mobile Bottom Navigation Bar (< md) */}
      <MobileBottomNav
        role="teacher"
        activeTab="history"
        pendingCount={totalPendingCount}
        onOpenDrawer={() => setMobileSidebarOpen(true)}
      />
    </div>
  );
}
