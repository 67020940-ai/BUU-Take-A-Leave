'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import AttachmentPreview from '@/components/AttachmentPreview';
import { DAY_LABEL_TH } from '@/lib/ui';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 transition-all shadow-xs';
const inputErrorCls =
  'w-full px-3.5 py-2.5 rounded-xl border-2 border-rose-500 dark:border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-xs';
const selectCls = `${inputCls} appearance-none pr-10 cursor-pointer`;

function fieldCls(hasError) {
  return hasError ? inputErrorCls : inputCls;
}

const labelCls = 'text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5';
const sectionTitleCls = 'text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wide mb-3';

// รายการประเภทการลา: ลบเหตุฉุกเฉินออก, คำว่า "อื่น ๆ" เว้นวรรคไม้ยมก
const LEAVE_TYPES = [
  { value: 'ลาป่วย', icon: HeartPulse },
  { value: 'ลากิจส่วนตัว', icon: User },
  { value: 'ลากิจกรรม', icon: Users },
  { value: 'อื่น ๆ', icon: MoreHorizontal },
];

const REASON_LIMIT = 300;

export default function LeaveForm({ courses, initialCourseId, lockCourse, initialValues, resubmitId }) {
  const [isLocked, setIsLocked] = useState(lockCourse);
  const router = useRouter();

  const [form, setForm] = useState({
    courseId: initialCourseId || courses[0]?.id || '',
    type: initialValues?.type === 'อื่นๆ' ? 'อื่น ๆ' : initialValues?.type || 'ลาป่วย',
    otherTypeDetail: '',
    period: initialValues?.period || 'เต็มคาบเรียน 3 ชั่วโมง',
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

  // รายวิชาที่เลือกในปัจจุบัน
  const currentCourse = useMemo(() => {
    return courses.find((c) => c.id === form.courseId) || courses[0] || null;
  }, [courses, form.courseId]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/leaves/attachment', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'อัปโหลดไฟล์ไม่สำเร็จ');
        return;
      }
      setAttachment(data);
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

    setSaving(true);
    try {
      const finalReason =
        form.type === 'อื่น ๆ' && form.otherTypeDetail.trim()
          ? `[ประเภท: ${form.otherTypeDetail.trim()}] ${form.reason.trim()}`
          : form.reason.trim();

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: form.courseId,
          type: form.type,
          period: form.period,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: finalReason,
          attachment: attachment?.filename || null,
          resubmitId: resubmitId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'บันทึกไม่สำเร็จ');
        return;
      }
      setForm({
        courseId: courses[0]?.id || '',
        type: 'ลาป่วย',
        otherTypeDetail: '',
        period: 'เต็มคาบเรียน 3 ชั่วโมง',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setAttachment(null);
      setTouched({});
      setSuccess('ส่งใบลาเรียบร้อยแล้ว รอการอนุมัติจากอาจารย์ผู้สอน กำลังไปยังหน้าประวัติการลา...');
      setTimeout(() => {
        router.push('/student/history');
        router.refresh();
      }, 1200);
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
                      {c.code} {c.name} {c.group ? `(กลุ่ม ${c.group})` : ''}
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
                    {currentCourse.day ? `วัน${DAY_LABEL_TH[currentCourse.day] || currentCourse.day} ` : ''}
                    {currentCourse.time ? `${currentCourse.time} น.` : '13:00 - 15:50 น.'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
                  กลุ่ม {currentCourse.group || '01'} • ห้อง {currentCourse.room || '-'} • ผู้สอน:{' '}
                  {currentCourse.teacherName || currentCourse.teacher?.name || '-'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
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
                className={`${fieldCls(!!fieldErrors.startDate)} cursor-pointer`}
              />
              {fieldErrors.startDate && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.startDate}</span>
                </p>
              )}
            </div>
            <div>
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
                className={`${fieldCls(!!fieldErrors.endDate)} cursor-pointer`}
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
          <label className={labelCls}>ไฟล์แนบ (รูปถ่ายใบรับรองแพทย์ / ใบนัด / หนังสือขออนุญาต)</label>
          {attachment ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/60">
              <div className="flex-1 text-xs">
                <AttachmentPreview src={attachment.url} label="ดูรูปเต็ม" thumbClassName="w-14 h-14 rounded-lg" />
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
                  <span>เลือกรูปภาพเอกสารแนบ...</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
          )}
          {uploadError && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{uploadError}</p>}
          <p className="text-[11px] text-neutral-400 mt-1">* รองรับไฟล์ JPG, PNG, GIF, WEBP ขนาดไม่เกิน 5MB</p>
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
    </form>
  );
}
