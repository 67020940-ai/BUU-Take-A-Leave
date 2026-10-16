'use client';
/* Hallmark · macrostructure: Long Document / Focus Form · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  CalendarRange,
  MessageSquareText,
  Send,
  HeartPulse,
  User,
  Users,
  MoreHorizontal,
  ChevronDown,
  ImagePlus,
  Loader2,
  Lock,
  RotateCcw,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import AttachmentPreview from '@/components/AttachmentPreview';
import { DAY_LABEL_TH, formatThaiDay, formatTeacherFullName } from '@/lib/ui';
import { formatLeaveClassTime } from '@/lib/leave-stats';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#7749BC] focus:ring-1 focus:ring-[#7749BC] transition-all shadow-2xs';
const inputErrorCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-rose-500 dark:border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-500 transition-all shadow-2xs';
const selectCls = `${inputCls} appearance-none pr-10 cursor-pointer`;

function fieldCls(hasError) {
  return hasError ? inputErrorCls : inputCls;
}

const labelCls = 'text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5';
const sectionTitleCls = 'text-xs font-semibold text-[#7749BC] dark:text-purple-300 uppercase tracking-wider mb-3';

// รายการประเภทการลา: ลบเหตุฉุกเฉินออก, คำว่า "อื่น ๆ" เว้นวรรคไม้ยมก
const LEAVE_TYPES = [
  { value: 'ลาป่วย', icon: HeartPulse },
  { value: 'ลากิจส่วนตัว', icon: User },
  { value: 'ลากิจกรรม', icon: Users },
  { value: 'อื่น ๆ', icon: MoreHorizontal },
];

const REASON_LIMIT = 300;

export default function LeaveForm({
  courses,
  initialCourseId,
  lockCourse,
  initialValues,
  resubmitId,
  onSuccess,
  leaves = [],
  summaries = [],
}) {
  const [isLocked, setIsLocked] = useState(lockCourse);
  const router = useRouter();

  const [form, setForm] = useState({
    courseId: initialCourseId || courses[0]?.id || '',
    type: initialValues?.type === 'อื่นๆ' ? 'อื่น ๆ' : initialValues?.type || 'ลาป่วย',
    otherTypeDetail: '',
    period: initialValues?.period || '',
    startDate: initialValues?.startDate || '',
    endDate: initialValues?.endDate || '',
    reason: initialValues?.reason || '',
  });

  const lockedCourse = isLocked ? courses.find((c) => c.id === form.courseId || c.id === initialCourseId) : null;

  const [attachment, setAttachment] = useState(
    initialValues?.attachment
      ? { filename: initialValues.attachment, url: `/api/leaves/attachment/${initialValues.attachment}` }
      : null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [acknowledgedOverQuota, setAcknowledgedOverQuota] = useState(false);

  // Sync courseId when available courses update (e.g. semester switched)
  useEffect(() => {
    if (courses && courses.length > 0) {
      const exists = courses.some((c) => c.id === form.courseId);
      if (!exists && !isLocked) {
        setForm((prev) => ({ ...prev, courseId: courses[0].id }));
      }
    }
  }, [courses, isLocked, form.courseId]);

  // รายวิชาที่เลือกในปัจจุบัน
  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === form.courseId) || courses[0] || null;
  }, [courses, form.courseId]);

  // คำนวณสถิติโควตาการลาของวิชาที่เลือกในปัจจุบัน (เกณฑ์ขาดเรียนไม่เกิน 20% ปกติ 3 ครั้ง)
  const courseLeaveStats = useMemo(() => {
    if (!currentCourse) {
      return {
        usedCount: 0,
        approvedCount: 0,
        pendingCount: 0,
        quotaLimit: 3,
        nextNumber: 1,
        remainingAfter: 2,
        level: 1,
      };
    }
    const activeLeaves = (leaves || []).filter((l) => {
      const matchCourse =
        (l.courseId && l.courseId === currentCourse.id) ||
        (l.courseCode && l.courseCode === currentCourse.code);
      const isActive = l.status === 'อนุมัติ' || l.status === 'รออนุมัติ';
      return matchCourse && isActive;
    });

    const approvedCount = activeLeaves.filter((l) => l.status === 'อนุมัติ').length;
    const pendingCount = activeLeaves.filter((l) => l.status === 'รออนุมัติ').length;
    const usedCount = activeLeaves.length;
    const quotaLimit = currentCourse.totalSessions
      ? Math.max(1, Math.floor(currentCourse.totalSessions * 0.2))
      : 3;
    const nextNumber = usedCount + 1;
    const remainingAfter = Math.max(0, quotaLimit - nextNumber);

    let level = 1;
    if (nextNumber === 1) level = 1;
    else if (nextNumber === 2) level = 2;
    else if (nextNumber === quotaLimit) level = 3;
    else if (nextNumber > quotaLimit) level = 4;

    return {
      usedCount,
      approvedCount,
      pendingCount,
      quotaLimit,
      nextNumber,
      remainingAfter,
      level,
    };
  }, [currentCourse, leaves]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    // ไฟล์ใหญ่เกินกำหนด: แจ้งเตือนแต่ไม่ขวางการยื่นใบลา (ส่งใบลาโดยไม่แนบไฟล์ได้)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 5MB) — คุณยังส่งใบลาโดยไม่แนบไฟล์ได้');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/leaves/attachment', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError((data.error || 'อัปโหลดไฟล์ไม่สำเร็จ') + ' — คุณยังส่งใบลาโดยไม่แนบไฟล์ได้');
        return;
      }
      setAttachment(data);
    } catch (err) {
      console.error('Attachment upload failed:', err);
      setUploadError('อัปโหลดไฟล์ไม่สำเร็จ (เครือข่ายขัดข้อง) — คุณยังส่งใบลาโดยไม่แนบไฟล์ได้');
    } finally {
      setUploading(false);
    }
  }

  // ตรวจสอบความถูกต้องของแต่ละฟิลด์ทันที
  function validateSingleField(field, value, currentForm = form) {
    let errMsg = '';
    if (field === 'startDate') {
      if (!value) errMsg = 'กรุณากรอกวันที่เริ่มลา';
    } else if (field === 'endDate') {
      if (!value) errMsg = 'กรุณากรอกวันที่สิ้นสุด';
      else if (currentForm.startDate && value < currentForm.startDate) {
        errMsg = 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มลา';
      }
    } else if (field === 'reason') {
      if (!String(value || '').trim()) {
        errMsg = 'กรุณากรอกเหตุผลการลา (เช่น อุบัติเหตุ, ป่วยเป็นไข้)';
      }
    } else if (field === 'otherTypeDetail') {
      if (currentForm.type === 'อื่น ๆ' && !String(value || '').trim()) {
        errMsg = 'กรุณาระบุประเภทการลาเพิ่มเติม';
      }
    }
    setFieldErrors((prev) => ({ ...prev, [field]: errMsg }));
    return errMsg;
  }

  // เมื่อผู้ใช้แตะออกจากช่อง (onBlur) แล้วยังไม่ได้ใส่ข้อมูล ให้ขึ้น error สีแดงทันที
  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateSingleField(field, form[field]);
  }

  function update(field, value) {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    // ลบ error ทันทีเมื่อผู้ใช้กรอกข้อมูล
    if (touched[field] || fieldErrors[field]) {
      validateSingleField(field, value, nextForm);
    }
  }

  const dateError = useMemo(() => {
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      return 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มลา';
    }
    return '';
  }, [form.startDate, form.endDate]);

  const dayCount = useMemo(() => {
    if (!form.startDate || !form.endDate || dateError) return null;
    const diff = (new Date(form.endDate) - new Date(form.startDate)) / (1000 * 60 * 60 * 24);
    return diff + 1;
  }, [form.startDate, form.endDate, dateError]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // สั่ง mark touched ทุกช่องที่มี * ทันที
    setTouched({
      startDate: true,
      endDate: true,
      reason: true,
      otherTypeDetail: true,
    });

    const nextFieldErrors = {};
    if (!form.startDate) nextFieldErrors.startDate = 'กรุณากรอกวันที่เริ่มลา';
    if (!form.endDate) nextFieldErrors.endDate = 'กรุณากรอกวันที่สิ้นสุด';
    if (form.type === 'อื่น ๆ' && !form.otherTypeDetail.trim()) {
      nextFieldErrors.otherTypeDetail = 'กรุณาระบุประเภทการลาเพิ่มเติม';
    }
    if (!form.reason.trim()) {
      nextFieldErrors.reason = 'กรุณากรอกเหตุผลการลา (เช่น อุบัติเหตุ, ป่วยเป็นไข้)';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('กรุณากรอกข้อมูลในช่องที่มีเครื่องหมายดอกจัน (*) สีแดงให้ครบถ้วน');
      return;
    }
    setFieldErrors({});

    if (dateError) {
      setError(dateError);
      return;
    }

    // ตรวจสอบผ่านเรียบร้อย ให้เปิดป๊อปอัปแจ้งเตือนโควตา 4 ระดับเพื่อยืนยันก่อนส่งจริง
    setAcknowledgedOverQuota(false);
    setShowConfirmModal(true);
  }

  async function executeSubmit() {
    setShowConfirmModal(false);
    setSaving(true);
    try {
      const finalReason =
        form.type === 'อื่น ๆ' && form.otherTypeDetail.trim()
          ? `[ประเภท: ${form.otherTypeDetail.trim()}] ${form.reason.trim()}`
          : form.reason.trim();

      const resolvedPeriod = formatLeaveClassTime({
        startDate: form.startDate,
        endDate: form.endDate,
        courseTime: currentCourse?.time,
        courseDay: currentCourse?.day,
        course: currentCourse,
      });

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: form.courseId,
          type: form.type,
          period: resolvedPeriod || 'เวลาเรียนตามตาราง',
          startDate: form.startDate,
          endDate: form.endDate,
          reason: finalReason,
          attachment: attachment?.url || attachment?.filename || null,
          resubmitId: resubmitId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `บันทึกไม่สำเร็จ (รหัสข้อผิดพลาด ${res.status}) กรุณาลองใหม่อีกครั้ง`);
        return;
      }
      setForm({
        courseId: courses[0]?.id || '',
        type: 'ลาป่วย',
        otherTypeDetail: '',
        period: '',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setAttachment(null);
      setTouched({});
      setSuccess('ส่งใบลาเรียบร้อยแล้ว รอการอนุมัติจากอาจารย์ผู้สอน กำลังไปยังหน้าประวัติการลา...');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('buu:leaves_updated'));
      }
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data.leave);
        } else {
          router.push('/student/history');
          router.refresh();
        }
      }, 600);
    } catch (err) {
      console.error('Leave submission failed:', err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  }

  if (courses.length === 0) {
    return <p className="text-sm text-neutral-500">ยังไม่มีรายวิชาที่ลงทะเบียน จึงยังยื่นใบลาไม่ได้</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {initialValues && (
        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-neutral-700 dark:text-neutral-200 flex items-center gap-2.5">
          <RotateCcw className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0" />
          <span>ดึงข้อมูลจากใบลาที่ยกเลิกไปก่อนหน้ามาให้แล้ว ตรวจสอบและแก้ไขได้ก่อนส่งอีกครั้ง</span>
        </div>
      )}

      {/* SECTION 1: Course, Time Period & Leave Type & Reason */}
      <section>
        <p className={sectionTitleCls}>1. รายละเอียดการลา (Leave Details)</p>
        <div className="space-y-5">
          {/* 1.1 รายวิชาที่ต้องการลา */}
          <div>
            <label className={labelCls}>
              <BookOpen className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>รายวิชาที่ต้องการลา</span>
              <span className="text-rose-500">*</span>
            </label>
            {lockedCourse ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full px-4 py-3 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 text-sm font-medium text-neutral-900 dark:text-neutral-100 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Lock className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0" />
                  <span className="truncate font-bold text-neutral-900 dark:text-neutral-100">
                    {lockedCourse.code} {lockedCourse.name} {lockedCourse.group ? `(กลุ่ม ${lockedCourse.group})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <span className="text-[11px] font-semibold text-[#7749BC] dark:text-purple-300 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-xl border border-purple-200/60 shadow-2xs">
                    ตรงตามตารางเรียน
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLocked(false)}
                    className="text-xs text-neutral-500 hover:text-[#7749BC] dark:hover:text-purple-300 underline cursor-pointer"
                  >
                    เปลี่ยนวิชา
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={form.courseId}
                  onChange={(e) => update('courseId', e.target.value)}
                  className={selectCls}
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} {c.name} {c.group ? `(กลุ่ม ${c.group})` : ''} {c.term ? `[เทอม ${c.term}]` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* แสดงช่วงเวลาเรียนและรายละเอียดกลุ่มของวิชานี้ */}
            {currentCourse && (
              <div className="mt-2.5 p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/70 dark:border-slate-700/70 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">ช่วงเวลาเรียน:</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">
                    {currentCourse.day ? `${formatThaiDay(currentCourse.day)} ` : ''}
                    {currentCourse.time ? `${currentCourse.time} น.` : '13:00 - 15:50 น.'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                  กลุ่ม {currentCourse.group || '01'} • ห้อง {currentCourse.room || '-'} • ผู้สอน:{' '}
                  {formatTeacherFullName(currentCourse.teacherName || currentCourse.teacher?.name)}
                </p>
              </div>
            )}

            {/* ป้ายเตือนสถานะโควตาการลาปัจจุบันของรายวิชานี้ */}
            {currentCourse && (
              <div
                className={`mt-2.5 p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  courseLeaveStats.level === 4
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                    : courseLeaveStats.level === 3
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                    : courseLeaveStats.level === 2
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
                    : 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/70 dark:border-purple-900/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-1.5">
                    {courseLeaveStats.level === 4 ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : courseLeaveStats.level === 3 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      สถานะโควตาการลา (เกณฑ์ขาดเรียนไม่เกิน 20%)
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs font-mono tabular-nums ${
                      courseLeaveStats.level === 4
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        : courseLeaveStats.level === 3
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        : 'bg-white/90 dark:bg-slate-900/90 text-[#7749BC] dark:text-purple-300 border-purple-200/80 dark:border-purple-800'
                    }`}
                  >
                    ใช้ไป {courseLeaveStats.usedCount} / {courseLeaveStats.quotaLimit} ครั้ง
                  </span>
                </div>

                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {courseLeaveStats.level === 4 ? (
                    <span className="text-rose-700 dark:text-rose-300 font-semibold">
                      ⚠️ คุณใช้สิทธิ์ลาครบเกณฑ์ {courseLeaveStats.quotaLimit} ครั้งแล้ว การยื่นครั้งต่อไปจะเป็นการลาครั้งที่ {courseLeaveStats.nextNumber} (เกินโควตา 20% พิจารณาแบบรายบุคคล)
                    </span>
                  ) : courseLeaveStats.level === 3 ? (
                    <span className="text-amber-800 dark:text-amber-300 font-medium">
                      การยื่นครั้งต่อไปจะเป็นการลา<strong>ครั้งที่ 3 (ครั้งสุดท้ายตามเกณฑ์ 20%)</strong> • หากอนุมัติจะไม่สามารถลาในวิชานี้ได้อีก
                    </span>
                  ) : courseLeaveStats.level === 2 ? (
                    <span>
                      ใช้ไปแล้ว 1 ครั้ง ({courseLeaveStats.approvedCount} อนุมัติ, {courseLeaveStats.pendingCount} รออนุมัติ) • การยื่นครั้งต่อไปเป็นครั้งที่ 2 (จะเหลืออีกเพียง 1 ครั้งสุดท้าย)
                    </span>
                  ) : (
                    <span>
                      ยังไม่เคยลาในวิชานี้ • มีโควตาลาได้สูงสุด {courseLeaveStats.quotaLimit} ครั้ง (20% ของ 15 คาบเรียน)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* 1.2 ประเภทการลา */}
          <div>
            <label className={labelCls}>
              <span>ประเภทการลา (Leave Type)</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LEAVE_TYPES.map(({ value, icon: Icon }) => {
                const active = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update('type', value)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#7749BC] border-[#7749BC] text-white shadow-sm shadow-purple-800/25'
                        : 'bg-white dark:bg-slate-800/90 border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 hover:border-[#7749BC]/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{value}</span>
                  </button>
                );
              })}
            </div>

            {/* ช่องระบุเมื่อเลือก "อื่น ๆ" */}
            {form.type === 'อื่น ๆ' && (
              <div className="mt-3 p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/80 transition-all">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                  <span>โปรดระบุประเภทการลาเพิ่มเติม (Specify Leave Type)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.otherTypeDetail}
                  onChange={(e) => update('otherTypeDetail', e.target.value)}
                  onBlur={() => handleBlur('otherTypeDetail')}
                  placeholder="เช่น อุบัติเหตุ, ไปต่อใบขับขี่, สอบคัดเลือก, เข้าร่วมงานอบรมวิชาการภายนอก..."
                  className={fieldCls(!!fieldErrors.otherTypeDetail)}
                  autoFocus
                />
                {fieldErrors.otherTypeDetail && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.otherTypeDetail}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 1.3 เหตุผลการลา (Reason for Leave) */}
          <div>
            <label className={labelCls}>
              <MessageSquareText className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>เหตุผลการลา (Reason for Leave)</span>
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => update('reason', e.target.value.slice(0, REASON_LIMIT))}
              onBlur={() => handleBlur('reason')}
              placeholder="ระบุเหตุผลการลา เช่น อุบัติเหตุ..."
              className={fieldCls(!!fieldErrors.reason)}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErrors.reason ? (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.reason}</span>
                </p>
              ) : (
                <div />
              )}
              <p className="text-[11px] text-neutral-400 text-right">
                {form.reason.length}/{REASON_LIMIT}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Dates (มีแค่ วันที่เริ่มลา และ วันที่สิ้นสุด) */}
      <section>
        <p className={sectionTitleCls}>2. วันที่ลา (Leave Dates)</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <div className="min-w-0">
              <label className={labelCls}>
                <CalendarRange className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                <span>วันที่เริ่มลา</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onFocus={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onChange={(e) => update('startDate', e.target.value)}
                onBlur={() => handleBlur('startDate')}
                className={`${fieldCls(!!fieldErrors.startDate)} cursor-pointer w-full min-w-0 max-w-full`}
              />
              {fieldErrors.startDate && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.startDate}</span>
                </p>
              )}
            </div>
            <div className="min-w-0">
              <label className={labelCls}>
                <CalendarRange className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                <span>วันที่สิ้นสุด</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onFocus={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {}
                }}
                onChange={(e) => update('endDate', e.target.value)}
                onBlur={() => handleBlur('endDate')}
                className={`${fieldCls(!!fieldErrors.endDate)} cursor-pointer w-full min-w-0 max-w-full`}
              />
              {fieldErrors.endDate && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.endDate}</span>
                </p>
              )}
            </div>
          </div>
          {dateError ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{dateError}</span>
            </p>
          ) : (
            dayCount && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">รวมระยะเวลา {dayCount} วัน</p>
          )}
        </div>
      </section>

      {/* SECTION 3: Attachments */}
      <section>
        <p className={sectionTitleCls}>3. เอกสารหลักฐานประกอบ (Attachment)</p>
        <div className="space-y-2">
          <label className={labelCls}>ไฟล์แนบ (ใบรับรองแพทย์ / ใบนัด / หนังสือขออนุญาต เป็นรูปภาพหรือ PDF)</label>
          {attachment ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/60">
              <div className="flex-1 text-xs">
                <AttachmentPreview src={attachment.url} label="ดูเอกสารแนบ" thumbClassName="w-14 h-14 rounded-lg" />
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="text-neutral-400 hover:text-rose-500 transition-colors p-1 shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed text-sm transition-colors ${
                uploading
                  ? 'border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/60 text-neutral-400 cursor-wait'
                  : 'border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/60 text-neutral-500 cursor-pointer hover:border-[#7749BC]'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#7749BC] animate-spin" />
                  <span>กำลังอัปโหลด...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4 text-[#7749BC]" />
                  <span>เลือกเอกสารแนบ (รูปภาพ หรือ PDF)...</span>
                </>
              )}
              <input type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
          )}
          {uploadError && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{uploadError}</p>}
          <p className="text-[11px] text-neutral-400 mt-1">* รองรับไฟล์รูปภาพ (JPG, PNG, GIF, WEBP) และเอกสาร PDF ขนาดไม่เกิน 5MB</p>
        </div>
      </section>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !!dateError}
        className="w-full py-3 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-sm font-bold shadow-md shadow-purple-700/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>กำลังบันทึก...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>ส่งใบลา (Submit Leave Request)</span>
          </>
        )}
      </button>

      {/* ================= Progressive Quota Confirmation Modal ================= */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200/90 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    courseLeaveStats.level === 4
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300'
                      : courseLeaveStats.level === 3
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300'
                      : courseLeaveStats.level === 2
                      ? 'bg-amber-100/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300'
                      : 'bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300'
                  }`}
                >
                  {courseLeaveStats.level >= 3 ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    {courseLeaveStats.level === 4
                      ? 'แจ้งเตือนความเสี่ยงหมดสิทธิ์สอบ'
                      : courseLeaveStats.level === 3
                      ? 'คำเตือน: การใช้สิทธิ์ลาครั้งสุดท้าย'
                      : courseLeaveStats.level === 2
                      ? 'แจ้งเตือน: โควตาการลาใกล้เต็ม'
                      : 'ยืนยันการยื่นคำร้องลาเรียน'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        courseLeaveStats.level === 4
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : courseLeaveStats.level === 3
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      }`}
                    >
                      {courseLeaveStats.level === 4
                        ? `เกินโควตา 20% (ครั้งที่ ${courseLeaveStats.nextNumber})`
                        : `การลาครั้งที่ ${courseLeaveStats.nextNumber} / ${courseLeaveStats.quotaLimit}`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quota Impact Alert Box */}
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                courseLeaveStats.level === 4
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                  : courseLeaveStats.level === 3
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  : 'bg-neutral-50 dark:bg-slate-800/60 border-neutral-200/80 dark:border-slate-700/80 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {courseLeaveStats.level === 4 ? (
                <>
                  <p className="font-bold text-rose-700 dark:text-rose-300">
                    ⚠️ คำร้องนี้เป็นการลาเกินเกณฑ์ 20% ของรายวิชา
                  </p>
                  <p className="leading-relaxed">
                    คุณใช้สิทธิ์ลาในวิชานี้ครบกำหนด {courseLeaveStats.quotaLimit} ครั้งไปแล้ว การยื่นครั้งนี้จะถูกส่งให้อาจารย์ผู้สอนพิจารณาเป็นกรณีพิเศษเฉพาะบุคคล (Case-by-Case) ซึ่งอาจส่งผลต่อสิทธิ์การเข้าสอบปลายภาค (หมดสิทธิ์สอบตามข้อบังคับมหาวิทยาลัยบูรพา)
                  </p>
                </>
              ) : courseLeaveStats.level === 3 ? (
                <>
                  <p className="font-bold text-amber-800 dark:text-amber-300">
                    ⚠️ นี่คือการลาครั้งที่ 3 (ครั้งสุดท้ายตามเกณฑ์ 20%)
                  </p>
                  <p className="leading-relaxed">
                    หากคำร้องนี้ได้รับการอนุมัติ ท่านจะไม่สามารถลาในรายวิชานี้ได้อีกตลอดภาคการศึกษานี้ หากมีการลาหรือขาดเรียนเพิ่มจะเกินเกณฑ์ 20% และเสี่ยงหมดสิทธิ์สอบทันที
                  </p>
                </>
              ) : courseLeaveStats.level === 2 ? (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    โควตาคงเหลือหลังการลา: เหลืออีกเพียง 1 ครั้งสุดท้าย
                  </p>
                  <p className="leading-relaxed text-neutral-600 dark:text-neutral-300">
                    ปัจจุบันใช้สิทธิ์ไปแล้ว 1 ครั้ง เมื่อคำร้องนี้ผ่านจะใช้สิทธิ์เป็น 2/{courseLeaveStats.quotaLimit} ครั้ง
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                    โควตาคงเหลือหลังการลา: สามารถลาได้อีก {courseLeaveStats.remainingAfter} ครั้ง
                  </p>
                  <p className="leading-relaxed text-neutral-600 dark:text-neutral-300">
                    คำร้องนี้เป็นการลาครั้งแรกของรายวิชานี้ (1/{courseLeaveStats.quotaLimit} ครั้ง)
                  </p>
                </>
              )}
            </div>

            {/* Leave Details Summary */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200/60 dark:border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 dark:text-neutral-400">รายวิชา:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 text-right">
                  {currentCourse?.code} {currentCourse?.name}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 dark:text-neutral-400">ประเภทการลา:</span>
                <span className="font-semibold text-[#7749BC] dark:text-purple-300">
                  {form.type === 'อื่น ๆ' && form.otherTypeDetail ? `อื่น ๆ (${form.otherTypeDetail})` : form.type}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 dark:text-neutral-400">วันที่ลา:</span>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {form.startDate} {form.endDate && form.endDate !== form.startDate ? `ถึง ${form.endDate}` : ''} {dayCount ? `(${dayCount} วัน)` : ''}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-neutral-500 dark:text-neutral-400">เหตุผล:</span>
                <span className="text-neutral-800 dark:text-neutral-200 text-right line-clamp-2 max-w-[240px]">
                  {form.reason || '-'}
                </span>
              </div>
            </div>

            {/* Level 4 Mandatory Checkbox */}
            {courseLeaveStats.level === 4 && (
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={acknowledgedOverQuota}
                  onChange={(e) => setAcknowledgedOverQuota(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer shrink-0"
                />
                <span className="text-rose-900 dark:text-rose-200 font-medium leading-relaxed">
                  ข้าพเจ้ารับทราบว่าการลาครั้งนี้เกินเกณฑ์ 20% ของรายวิชา และยินยอมให้อาจารย์ผู้สอนพิจารณาเป็นกรณีพิเศษ ซึ่งอาจส่งผลต่อสิทธิ์การเข้าสอบปลายภาค
                </span>
              </label>
            )}

            {/* Modal Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer"
              >
                แก้ไขข้อมูล
              </button>
              <button
                type="button"
                onClick={executeSubmit}
                disabled={courseLeaveStats.level === 4 && !acknowledgedOverQuota}
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  courseLeaveStats.level === 4
                    ? acknowledgedOverQuota
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                      : 'bg-rose-300 dark:bg-rose-900/40 opacity-50 cursor-not-allowed'
                    : 'bg-[#7749BC] hover:bg-[#653ba6] shadow-purple-700/25'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>ยืนยันส่งใบลา</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
