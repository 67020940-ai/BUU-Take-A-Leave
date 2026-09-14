'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { LEAVE_TYPE_DETAILS, LEAVE_TYPE_DEFAULT, formatThaiDate, formatThaiDateTime } from '@/lib/ui';
import AttachmentPreview from '@/components/AttachmentPreview';

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

export default function TeacherDashboard({ courses, initialLeaves, rosterByCourse, usingMock = false }) {
  const router = useRouter();
  const [leaves, setLeaves] = useState(initialLeaves);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [rosterSearch, setRosterSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'over_quota'
  const [actionModal, setActionModal] = useState({ isOpen: false, type: 'approve', leave: null, comment: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, leave: null, comment: '' });
  const [errors, setErrors] = useState({});

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const pendingLeaves = leaves.filter((l) => l.status === 'รออนุมัติ');
  const currentRoster = selectedCourse ? rosterByCourse[selectedCourse.id] || [] : [];

  const filteredRoster = currentRoster.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(rosterSearch.toLowerCase()) || s.studentCode.includes(rosterSearch);
    const matchesRisk = riskFilter === 'all' || s.overQuota;
    return matchesSearch && matchesRisk;
  });

  function openActionModal(leave, type) {
    setErrors((prev) => ({ ...prev, [leave.id]: '' }));
    setActionModal({
      isOpen: true,
      type,
      leave,
      comment:
        type === 'approve'
          ? 'อนุมัติการลาตามระเบียบเรียบร้อย'
          : 'ไม่อนุมัติเนื่องจากข้อมูลหรือเอกสารประกอบไม่ครบถ้วนตามเกณฑ์',
    });
  }

  function openDetailModal(leave) {
    setErrors((prev) => ({ ...prev, [leave.id]: '' }));
    setDetailModal({ isOpen: true, leave, comment: '' });
  }

  async function decideLeave(leave, status, comment) {
    // ใบลาตัวอย่าง (mock) ไม่มีอยู่จริงใน DB จึงอัปเดตสถานะแค่ในหน้าจอ ไม่ยิง API จริง
    if (String(leave.id).startsWith('mock-')) {
      setLeaves((prev) => prev.map((l) => (l.id === leave.id ? { ...l, status } : l)));
      return true;
    }

    const res = await fetch('/api/leaves', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: leave.id, status, comment }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors((prev) => ({ ...prev, [leave.id]: data.error || 'ดำเนินการไม่สำเร็จ' }));
      router.refresh();
      return false;
    }
    setLeaves((prev) => prev.map((l) => (l.id === leave.id ? { ...l, status: data.leave.status } : l)));
    return true;
  }

  async function handleConfirmAction() {
    const { leave, type, comment } = actionModal;
    if (!leave) return;
    setActionModal({ isOpen: false, type: 'approve', leave: null, comment: '' });
    await decideLeave(leave, type === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ', comment);
  }

  async function handleDetailDecision(type) {
    const { leave, comment } = detailModal;
    if (!leave) return;
    setDetailModal({ isOpen: false, leave: null, comment: '' });
    await decideLeave(leave, type === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ', comment);
  }

  return (
    <div className="space-y-8">
      {usingMock && (
        <div className="flex items-start sm:items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            กำลังแสดง<strong>ข้อมูลตัวอย่าง (Mock)</strong> — ยังไม่มีรายวิชาที่ผูกกับบัญชีอาจารย์นี้จริงในระบบ
            เมื่อเชื่อมข้อมูลจริงแล้วหน้านี้จะเปลี่ยนไปแสดงข้อมูลจริงโดยอัตโนมัติ
          </span>
        </div>
      )}

      {/* SECTION 1: Pending Leave Requests Queue */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              คำร้องขอลาเรียนรอการอนุมัติ
            </h2>
            {pendingLeaves.length > 0 && (
              <span className="text-xs bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                {pendingLeaves.length} คำขอ
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            ตรวจสอบเอกสารและสถิติเวลาเรียนของนิสิตก่อนตัดสินใจอนุมัติ
          </p>
        </div>

        {pendingLeaves.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-8 text-center shadow-xs">
            <UserCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">ไม่มีคำขอลาเรียนค้างพิจารณา</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              คำร้องทั้งหมดได้รับการตรวจสอบและบันทึกผลเรียบร้อยแล้ว
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLeaves.map((leave) => {
              const typeCls = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;
              return (
                <div
                  key={leave.id}
                  className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden hover:bg-white dark:hover:bg-slate-900 transition-all"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#7749BC]" />

                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-sm border border-purple-200 dark:border-purple-800 shrink-0">
                          {initials(leave.studentName)}
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {leave.studentName}
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{leave.studentCode}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border shrink-0 ${typeCls}`}>
                        {leave.type}
                      </span>
                    </div>

                    <div className="mt-3.5 p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-1 text-xs">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {leave.courseCode} {leave.courseName}
                        {leave.section ? ` (กลุ่ม ${leave.section})` : ''}
                      </div>
                      <div className="flex items-center space-x-3 text-neutral-600 dark:text-neutral-400 text-[11px]">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-[#7749BC] dark:text-purple-400" />
                          <span>
                            {formatThaiDate(leave.startDate)}
                            {leave.endDate && leave.endDate !== leave.startDate ? ` - ${formatThaiDate(leave.endDate)}` : ''}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{leave.period}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-neutral-700 dark:text-neutral-300">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 block mb-0.5">เหตุผลการลา:</span>
                      <p className="leading-relaxed bg-neutral-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-neutral-200/60 dark:border-slate-700">
                        {leave.reason}
                      </p>
                    </div>

                    {leave.attachment && (
                      <div className="mt-2 text-xs">
                        <AttachmentPreview src={`/api/leaves/attachment/${leave.attachment}`} label="ตรวจเอกสารแนบ" />
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => openDetailModal(leave)}
                        className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-colors flex items-center space-x-1 border border-neutral-200/60 dark:border-slate-700 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูรายละเอียด</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openActionModal(leave, 'reject')}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ไม่อนุมัติ</span>
                        </button>
                        <button
                          onClick={() => openActionModal(leave, 'approve')}
                          className="px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1 ring-1 ring-white/30 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>อนุมัติ</span>
                        </button>
                      </div>
                    </div>
                    {errors[leave.id] && <p className="text-[11px] text-rose-600 dark:text-rose-400">{errors[leave.id]}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Course Attendance & Student Roster */}
      <section className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              สถิติเวลาเรียนและโควต้าการลารายวิชา
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              ตรวจสอบเปอร์เซ็นต์เวลาเรียน คัดกรองนิสิตที่เกินโควต้าการลา และส่งออกข้อมูล
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href="/api/export"
              className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-white/80 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ส่งออก Excel (CSV)</span>
            </a>
            <a
              href="/teacher/print"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center space-x-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-slate-800 hover:bg-white border border-neutral-200/80 dark:border-slate-700 px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ / PDF</span>
            </a>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-8 text-center shadow-xs">
            <p className="text-sm text-neutral-500">ยังไม่มีรายวิชาที่รับผิดชอบ</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseId(course.id)}
                  className={`w-full sm:w-auto sm:max-w-full px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer text-left ${
                    selectedCourse?.id === course.id
                      ? 'bg-purple-100/80 dark:bg-purple-950/80 text-[#7749BC] dark:text-purple-200 border-purple-300 dark:border-purple-700 ring-2 ring-[#7749BC]/20 shadow-xs'
                      : 'bg-white/80 dark:bg-slate-900/80 text-neutral-600 dark:text-neutral-400 border-neutral-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 shadow-xs'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0" />
                  <span className="min-w-0 break-words">
                    {course.code} {course.name} ({course.term}
                    {course.group ? ` / กลุ่ม ${course.group}` : ''})
                  </span>
                </button>
              ))}
            </div>

            {selectedCourse && (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      placeholder="ค้นหารหัสนิสิต หรือ ชื่อ..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/20 focus:border-[#7749BC] shadow-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                    <button
                      onClick={() => setRiskFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        riskFilter === 'all'
                          ? 'bg-[#7749BC] text-white'
                          : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-700 border border-neutral-200 dark:border-slate-700'
                      }`}
                    >
                      นิสิตทั้งหมด ({currentRoster.length})
                    </button>
                    <button
                      onClick={() => setRiskFilter('over_quota')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1 cursor-pointer ${
                        riskFilter === 'over_quota'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>เกินโควต้าการลา ({currentRoster.filter((r) => r.overQuota).length})</span>
                    </button>
                  </div>
                </div>

                {/* จอกว้าง (md+): ตารางแบบเต็ม */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100/70 dark:bg-slate-800/80 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200/60 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">รหัสนิสิต</th>
                        <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                        <th className="py-3 px-4 text-center">เข้าเรียนสะสม</th>
                        <th className="py-3 px-4 text-center">ลาที่อนุมัติ / โควต้า</th>
                        <th className="py-3 px-4 text-center">เวลาเรียน (%)</th>
                        <th className="py-3 px-4 text-center">สถานะโควต้า</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
                      {filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-neutral-500">
                            ไม่พบนิสิตที่ตรงกับเงื่อนไข
                          </td>
                        </tr>
                      ) : (
                        filteredRoster.map((s) => (
                          <tr
                            key={s.studentId}
                            className={s.overQuota ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors'}
                          >
                            <td className="py-3 px-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                              {s.studentCode}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-neutral-900 dark:text-neutral-100">{s.studentName}</p>
                              <p className="text-[10px] text-neutral-400 font-mono">{s.email}</p>
                            </td>
                            <td className="py-3 px-4 text-center font-medium text-neutral-800 dark:text-neutral-200">
                              {s.attended} / {s.totalSessions} คาบ
                            </td>
                            <td className="py-3 px-4 text-center font-semibold text-[#7749BC] dark:text-purple-400">
                              {s.approvedLeaves} / {s.quotaLimit} ครั้ง
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-bold ${s.overQuota ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {s.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {s.overQuota ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>เกินโควต้า</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <UserCheck className="w-3 h-3" />
                                  <span>ปกติ</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* จอแคบ (มือถือ): การ์ดแสดงข้อมูลครบทุกฟิลด์ ไม่ต้องปัดแนวนอน */}
                <div className="md:hidden divide-y divide-neutral-100 dark:divide-slate-800">
                  {filteredRoster.length === 0 ? (
                    <p className="py-8 text-center text-xs text-neutral-500">ไม่พบนิสิตที่ตรงกับเงื่อนไข</p>
                  ) : (
                    filteredRoster.map((s) => (
                      <div
                        key={s.studentId}
                        className={`p-4 space-y-2.5 ${s.overQuota ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm truncate">{s.studentName}</p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{s.studentCode}</p>
                            <p className="text-[10px] text-neutral-400 font-mono truncate">{s.email}</p>
                          </div>
                          {s.overQuota ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>เกินโควต้า</span>
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <UserCheck className="w-3 h-3" />
                              <span>ปกติ</span>
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 py-2">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">เข้าเรียน</p>
                            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                              {s.attended}/{s.totalSessions}
                            </p>
                          </div>
                          <div className="rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 py-2">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">ลา/โควต้า</p>
                            <p className="text-xs font-semibold text-[#7749BC] dark:text-purple-400">
                              {s.approvedLeaves}/{s.quotaLimit}
                            </p>
                          </div>
                          <div className="rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 py-2">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">เวลาเรียน</p>
                            <p className={`text-xs font-bold ${s.overQuota ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {s.percentage}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>
                    แสดงผล {filteredRoster.length} จาก {currentRoster.length} รายชื่อ
                  </span>
                  <span>คำนวณตามเกณฑ์ระเบียบการศึกษา มหาวิทยาลัยบูรพา</span>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Leave detail popup */}
      {detailModal.isOpen && detailModal.leave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {detailModal.leave.courseCode}
                    {detailModal.leave.section ? ` กลุ่ม ${detailModal.leave.section}` : ''}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
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

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-sm border border-purple-200 dark:border-purple-800 shrink-0">
                  {initials(detailModal.leave.studentName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {detailModal.leave.studentName}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                    รหัสนิสิต: {detailModal.leave.studentCode}
                    {detailModal.leave.studentEmail ? ` • ${detailModal.leave.studentEmail}` : ''}
                  </p>
                </div>
              </div>

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
                    <span>ช่วงเวลาและประเภทการลา</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100">{detailModal.leave.period}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${LEAVE_TYPE_DETAILS[detailModal.leave.type] || LEAVE_TYPE_DEFAULT}`}>
                    {detailModal.leave.type}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">สาเหตุและรายละเอียด</p>
                <p className="text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-neutral-200/60 dark:border-slate-700">
                  {detailModal.leave.reason}
                </p>
              </div>

              {detailModal.leave.attachment && (
                <div>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">เอกสารหลักฐานประกอบ</p>
                  <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800">
                    <span className="flex items-center gap-2 text-xs text-neutral-800 dark:text-neutral-200 min-w-0">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate">{detailModal.leave.attachment}</span>
                    </span>
                    <AttachmentPreview
                      src={`/api/leaves/attachment/${detailModal.leave.attachment}`}
                      label="ดูเอกสาร"
                      thumbClassName="hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                  <span>ระบุหมายเหตุหรือข้อเสนอแนะในการพิจารณา (ไม่บังคับ)</span>
                </label>
                <textarea
                  rows={3}
                  value={detailModal.comment}
                  onChange={(e) => setDetailModal({ ...detailModal, comment: e.target.value })}
                  placeholder="เช่น อนุมัติการลาตามระเบียบ หรือ ขอเอกสารใบรับรองแพทย์ฉบับจริงเพิ่มเติม..."
                  className="w-full p-3 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/20 focus:border-[#7749BC] shadow-xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-neutral-400">
                <span>ยื่นคำร้องเมื่อ: {formatThaiDateTime(detailModal.leave.createdAt)}</span>
                <span>รหัสคำร้อง: #{detailModal.leave.id}</span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-neutral-100 dark:border-slate-800 p-4 flex items-center justify-end gap-2 rounded-b-3xl">
              <button
                onClick={() => handleDetailDecision('reject')}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>ไม่อนุมัติ (Reject)</span>
              </button>
              <button
                onClick={() => handleDetailDecision('approve')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 ring-1 ring-white/30 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>อนุมัติคำขอ (Approve)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject confirmation modal */}
      {actionModal.isOpen && actionModal.leave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {actionModal.type === 'approve' ? (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                )}
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {actionModal.type === 'approve' ? 'ยืนยันการอนุมัติการลา' : 'ยืนยันการไม่อนุมัติการลา'}
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
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700 text-xs text-neutral-600 dark:text-neutral-300 font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors ring-1 ring-white/30 cursor-pointer ${
                  actionModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionModal.type === 'approve' ? 'บันทึกอนุมัติ' : 'บันทึกไม่อนุมัติ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
