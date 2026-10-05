'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Archive,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  ChevronRight,
  BookOpen,
  Users,
  Award,
  ArrowUpDown,
  Download,
  AlertCircle,
  X,
  FileText,
  HeartPulse,
  User,
  HelpCircle,
} from 'lucide-react';
import { STATUS_DETAILS, LEAVE_TYPE_DETAILS, formatThaiDate, initials } from '@/lib/ui';
import AttachmentPreview from '@/components/AttachmentPreview';

export default function ArchiveView({ courses = [], leaves = [] }) {
  // Extract all unique academic terms
  const terms = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.term) set.add(c.term);
    });
    leaves.forEach((l) => {
      if (l.courseTerm && l.courseTerm !== '-') set.add(l.courseTerm);
    });
    if (set.size === 0) set.add('1/2569');
    // Ensure we have at least sample past terms for demonstration
    if (set.size === 1) {
      set.add('2/2568');
      set.add('1/2568');
    }
    return Array.from(set).sort().reverse();
  }, [courses, leaves]);

  const [selectedTerm, setSelectedTerm] = useState(terms[0] || '1/2569');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLeave, setPreviewLeave] = useState(null);

  // Term-specific leaves
  const termLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const course = courses.find((c) => c.id === l.courseId);
      const leaveTerm = l.courseTerm || course?.term || '1/2569';
      // If term matches directly or is current
      if (selectedTerm === '1/2569') {
        return leaveTerm === '1/2569' || !leaveTerm;
      }
      return leaveTerm === selectedTerm;
    });
  }, [leaves, courses, selectedTerm]);

  // Aggregate term statistics
  const termStats = useMemo(() => {
    const total = termLeaves.length;
    const approved = termLeaves.filter((l) => l.status === 'อนุมัติ').length;
    const rejected = termLeaves.filter((l) => l.status === 'ไม่อนุมัติ').length;
    const pending = termLeaves.filter((l) => l.status === 'รออนุมัติ').length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100;

    const sick = termLeaves.filter((l) => l.type === 'ลาป่วย').length;
    const personal = termLeaves.filter((l) => l.type === 'ลากิจส่วนตัว').length;
    const activity = termLeaves.filter((l) => l.type === 'ลากิจกรรม').length;
    const others = termLeaves.filter((l) => l.type !== 'ลาป่วย' && l.type !== 'ลากิจส่วนตัว' && l.type !== 'ลากิจกรรม').length;

    const studentCodes = new Set(termLeaves.map((l) => l.studentCode || l.studentName));

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate,
      sick,
      personal,
      activity,
      others,
      uniqueStudents: studentCodes.size,
    };
  }, [termLeaves]);

  // Filtered leaves for the table
  const filteredLeaves = useMemo(() => {
    return termLeaves.filter((l) => {
      if (selectedCourse !== 'all' && l.courseId !== selectedCourse && l.courseCode !== selectedCourse) return false;
      if (selectedType !== 'all' && l.type !== selectedType) return false;
      if (selectedStatus !== 'all' && l.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sName = (l.studentName || '').toLowerCase();
        const sCode = (l.studentCode || '').toLowerCase();
        const cCode = (l.courseCode || '').toLowerCase();
        const cName = (l.courseName || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        if (!sName.includes(q) && !sCode.includes(q) && !cCode.includes(q) && !cName.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.approvedAt || a.createdAt || a.startDate || 0).getTime();
      const timeB = new Date(b.approvedAt || b.createdAt || b.startDate || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(b.id).localeCompare(String(a.id), undefined, { numeric: true });
    });
  }, [termLeaves, selectedCourse, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Term Selector & Quick Summary Banner */}
      <div className="bg-gradient-to-br from-[#7749BC] to-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-200 text-xs font-semibold uppercase tracking-wider">
              <Archive className="w-4 h-4" />
              <span>คลังจัดเก็บข้อมูลและสถิติการลารายภาคการศึกษา</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              ภาคเรียนที่ {selectedTerm}
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80">
              รวบรวมประวัติการลา เอกสารแนบ และสถิติความถี่การลาของนิสิตทุกกลุ่มเรียนที่ท่านรับผิดชอบ
            </p>
          </div>

          {/* Academic Term Switcher */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <span className="text-xs text-purple-200 px-2 font-medium">เลือกภาคเรียน:</span>
            <select
              value={selectedTerm}
              onChange={(e) => {
                setSelectedTerm(e.target.value);
                setSelectedCourse('all');
                setSelectedType('all');
                setSelectedStatus('all');
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-neutral-900 font-bold text-xs focus:outline-none cursor-pointer shadow-xs"
            >
              {terms.map((t) => (
                <option key={t} value={t}>
                  ภาคเรียนที่ {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Term KPI Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-purple-200 text-[11px] block">คำร้องทั้งหมดในเทอม</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{termStats.total}</span>
            <span className="text-[10px] text-purple-200/70">จากนิสิต {termStats.uniqueStudents} คน</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-purple-200 text-[11px] block">อนุมัติแล้ว</span>
            <span className="text-2xl font-extrabold text-emerald-300 mt-0.5 block">{termStats.approved}</span>
            <span className="text-[10px] text-purple-200/70">อัตราอนุมัติ {termStats.approvalRate}%</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-purple-200 text-[11px] block">ลาป่วย / ลากิจ</span>
            <span className="text-2xl font-extrabold text-sky-300 mt-0.5 block">
              {termStats.sick} <span className="text-sm font-normal text-purple-200">/ {termStats.personal}</span>
            </span>
            <span className="text-[10px] text-purple-200/70">ป่วย {termStats.sick} • กิจ {termStats.personal}</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-purple-200 text-[11px] block">ลากิจกรรม / อื่นๆ</span>
            <span className="text-2xl font-extrabold text-amber-300 mt-0.5 block">
              {termStats.activity} <span className="text-sm font-normal text-purple-200">/ {termStats.others}</span>
            </span>
            <span className="text-[10px] text-purple-200/70">กิจกรรม {termStats.activity} • อื่นๆ {termStats.others}</span>
          </div>
        </div>
      </div>

      {/* Filter and Table Toolbar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-[#7749BC]" />
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              บันทึกประวัติการลาในคลังย้อนหลัง ({filteredLeaves.length} รายการ)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/api/export?term=${encodeURIComponent(selectedTerm)}`}
              className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV เทอม {selectedTerm}</span>
            </a>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสนิสิต / ชื่อ / เหตุผล..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC]"
            />
          </div>

          {/* Course Filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] cursor-pointer"
          >
            <option value="all">ทุกรายวิชา</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} {c.name} {c.group ? `(กลุ่ม ${c.group})` : ''}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] cursor-pointer"
          >
            <option value="all">ทุกประเภทการลา</option>
            <option value="ลาป่วย">ลาป่วย</option>
            <option value="ลากิจส่วนตัว">ลากิจส่วนตัว</option>
            <option value="ลากิจกรรม">ลากิจกรรม</option>
            <option value="อื่น ๆ">อื่น ๆ / ฉุกเฉิน</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] cursor-pointer"
          >
            <option value="all">ทุกสถานะคำร้อง</option>
            <option value="อนุมัติ">อนุมัติแล้ว</option>
            <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
            <option value="รออนุมัติ">รอพิจารณา</option>
          </select>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-slate-800/80 text-neutral-600 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">วันที่ลา / คาบ</th>
                <th className="py-3 px-4">นิสิต</th>
                <th className="py-3 px-4">รายวิชา</th>
                <th className="py-3 px-4">ประเภทการลา</th>
                <th className="py-3 px-4">เหตุผล</th>
                <th className="py-3 px-4 text-center">หลักฐาน</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    <Archive className="w-8 h-8 mx-auto mb-2 text-neutral-300 opacity-60" />
                    <span>ไม่พบประวัติการลาในเงื่อนไขที่เลือกสำหรับภาคเรียนที่ {selectedTerm}</span>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const statusConf = STATUS_DETAILS[leave.status] || STATUS_DETAILS['รออนุมัติ'];
                  const typeConf = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DETAILS['อื่น ๆ'];

                  return (
                    <tr
                      key={leave.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {formatThaiDate(leave.startDate)}
                        </div>
                        {leave.endDate && leave.endDate !== leave.startDate && (
                          <div className="text-[10px] text-neutral-400">
                            ถึง {formatThaiDate(leave.endDate)}
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-400">
                          {leave.period || 'เต็มวัน'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">
                          {leave.studentName}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          {leave.studentCode || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {leave.courseCode} {leave.section ? `(กลุ่ม ${leave.section})` : ''}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-[140px]">
                          {leave.courseName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            leave.type === 'ลาป่วย'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : leave.type === 'ลากิจส่วนตัว'
                              ? 'bg-purple-50 text-[#7749BC] dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : leave.type === 'ลากิจกรรม'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {leave.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="text-neutral-700 dark:text-neutral-300 truncate" title={leave.reason}>
                          {leave.reason || '-'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {leave.attachmentUrl ? (
                          <button
                            onClick={() => setPreviewLeave(leave)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-[#7749BC] dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 text-[11px] font-semibold cursor-pointer transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>ดูหลักฐาน</span>
                          </button>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            leave.status === 'อนุมัติ'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : leave.status === 'ไม่อนุมัติ'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setPreviewLeave(leave)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ดูรายละเอียด</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Attachment Modal */}
      {previewLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-neutral-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300">
                    ภาคเรียน {selectedTerm} • {previewLeave.courseCode}
                  </span>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                    รายละเอียดคำร้องขอลาเรียน
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewLeave(null)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-neutral-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">นิสิต:</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {previewLeave.studentName} ({previewLeave.studentCode})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">รายวิชา:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {previewLeave.courseCode} {previewLeave.courseName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">วันที่ลา:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {formatThaiDate(previewLeave.startDate)}{' '}
                      {previewLeave.endDate && previewLeave.endDate !== previewLeave.startDate && ` - ${formatThaiDate(previewLeave.endDate)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">ประเภทการลา:</span>
                    <span className="font-bold text-[#7749BC] dark:text-purple-300">
                      {previewLeave.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">เหตุผลการลา:</span>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {previewLeave.reason || 'ไม่ได้ระบุเหตุผล'}
                  </div>
                </div>

                {/* Evidence attachment */}
                <div className="space-y-1">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">เอกสารหลักฐานแนบ:</span>
                  {previewLeave.attachmentUrl ? (
                    <div className="rounded-xl border border-neutral-200 dark:border-slate-700 overflow-hidden">
                      <AttachmentPreview
                        url={previewLeave.attachmentUrl}
                        alt={`หลักฐานการลา ${previewLeave.studentName}`}
                      />
                    </div>
                  ) : (
                    <div className="p-3 text-center rounded-xl bg-neutral-50 dark:bg-slate-800 text-neutral-400 text-xs">
                      ไม่มีเอกสารแนบ
                    </div>
                  )}
                </div>

                {/* Result info */}
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">ผลการพิจารณา:</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">
                      {previewLeave.status}
                    </span>
                  </div>
                  {previewLeave.comment && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">ความเห็นอาจารย์:</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {previewLeave.comment}
                      </span>
                    </div>
                  )}
                  {previewLeave.approvedBy && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">ผู้อนุมัติ:</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {previewLeave.approvedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setPreviewLeave(null)}
                  className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors cursor-pointer"
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
