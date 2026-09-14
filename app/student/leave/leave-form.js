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
  AlertTriangle,
  MoreHorizontal,
  ChevronDown,
  ImagePlus,
  Loader2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import AttachmentPreview from '@/components/AttachmentPreview';

const emptyForm = { courseId: '', type: 'ลาป่วย', period: 'เต็มคาบเรียน 3 ชั่วโมง', startDate: '', endDate: '', reason: '' };

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 transition-all shadow-xs';
const inputErrorCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-rose-400 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/30 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-xs';
const selectCls = `${inputCls} appearance-none pr-10 cursor-pointer`;
function fieldCls(hasError) {
  return hasError ? inputErrorCls : inputCls;
}
const labelCls = 'text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5';
const sectionTitleCls = 'text-xs font-bold text-[#7749BC] dark:text-purple-300 uppercase tracking-wide mb-3';

const LEAVE_TYPES = [
  { value: 'ลาป่วย', icon: HeartPulse },
  { value: 'ลากิจส่วนตัว', icon: User },
  { value: 'ลากิจกรรม', icon: Users },
  { value: 'เหตุฉุกเฉิน', icon: AlertTriangle },
  { value: 'อื่นๆ', icon: MoreHorizontal },
];

const PERIODS = [
  { value: 'เต็มคาบเรียน 3 ชั่วโมง', short: 'เต็มคาบ (3 ชม.)' },
  { value: 'ครึ่งคาบแรก 1.5 ชั่วโมง', short: 'ครึ่งคาบแรก (1.5 ชม.)' },
  { value: 'ครึ่งคาบหลัง 1.5 ชั่วโมง', short: 'ครึ่งคาบหลัง (1.5 ชม.)' },
];

const REASON_LIMIT = 300;

export default function LeaveForm({ courses, initialCourseId, lockCourse, initialValues, resubmitId }) {
  const lockedCourse = lockCourse ? courses.find((c) => c.id === initialCourseId) : null;
  const router = useRouter();
  const [form, setForm] = useState({
    courseId: initialCourseId || courses[0]?.id || '',
    type: initialValues?.type || emptyForm.type,
    period: initialValues?.period || emptyForm.period,
    startDate: initialValues?.startDate || emptyForm.startDate,
    endDate: initialValues?.endDate || emptyForm.endDate,
    reason: initialValues?.reason || emptyForm.reason,
  });
  const [attachment, setAttachment] = useState(
    initialValues?.attachment
      ? { filename: initialValues.attachment, url: `/api/leaves/attachment/${initialValues.attachment}` }
      : null
  ); // { filename, url }
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // { startDate, endDate, reason }

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

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: '' }));
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

    const nextFieldErrors = {};
    if (!form.startDate) nextFieldErrors.startDate = 'กรุณากรอกวันที่เริ่มลา';
    if (!form.endDate) nextFieldErrors.endDate = 'กรุณากรอกวันที่สิ้นสุด';
    if (!form.reason.trim()) nextFieldErrors.reason = 'กรุณากรอกเหตุผลการลา';
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('กรุณากรอกข้อมูลในช่องที่ทำเครื่องหมายสีแดงให้ครบถ้วน');
      return;
    }
    setFieldErrors({});

    if (dateError) {
      setError(dateError);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, attachment: attachment?.filename || null, resubmitId: resubmitId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'บันทึกไม่สำเร็จ');
        return;
      }
      setForm({ ...emptyForm, courseId: courses[0]?.id || '' });
      setAttachment(null);
      setSuccess('ส่งใบลาเรียบร้อยแล้ว รอการอนุมัติจากอาจารย์ผู้สอน กำลังกลับไปหน้าหลัก...');
      setTimeout(() => {
        router.push('/student');
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
      <section>
        <p className={sectionTitleCls}>รายละเอียดการลา</p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>
              <BookOpen className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>รายวิชา</span>
            </label>
            {lockedCourse ? (
              <div className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                <Lock className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0" />
                <span className="truncate">
                  {lockedCourse.code} {lockedCourse.name}
                </span>
              </div>
            ) : (
              <div className="relative">
                <select value={form.courseId} onChange={(e) => update('courseId', e.target.value)} className={selectCls}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>ประเภทการลา</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LEAVE_TYPES.map(({ value, icon: Icon }) => {
                const active = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update('type', value)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      active
                        ? 'bg-[#7749BC] border-[#7749BC] text-white shadow-sm shadow-purple-800/25'
                        : 'bg-white dark:bg-slate-800/90 border-neutral-300 dark:border-slate-700 text-neutral-600 dark:text-neutral-300 hover:border-[#7749BC]/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>ช่วงเวลา</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PERIODS.map(({ value, short }) => {
                const active = form.period === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update('period', value)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                      active
                        ? 'bg-[#7749BC] border-[#7749BC] text-white shadow-sm shadow-purple-800/25'
                        : 'bg-white dark:bg-slate-800/90 border-neutral-300 dark:border-slate-700 text-neutral-600 dark:text-neutral-300 hover:border-[#7749BC]/60'
                    }`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className={sectionTitleCls}>ช่วงวันที่ลา</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              <CalendarRange className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>วันที่เริ่มลา</span>
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
              className={fieldCls(!!fieldErrors.startDate)}
            />
            {fieldErrors.startDate && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5">{fieldErrors.startDate}</p>}
          </div>
          <div>
            <label className={labelCls}>
              <CalendarRange className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>วันที่สิ้นสุด</span>
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              className={fieldCls(!!fieldErrors.endDate)}
            />
            {fieldErrors.endDate && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5">{fieldErrors.endDate}</p>}
          </div>
        </div>
        {dateError ? (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1.5">{dateError}</p>
        ) : (
          dayCount && <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5">รวม {dayCount} วัน</p>
        )}
      </section>

      <section>
        <p className={sectionTitleCls}>เหตุผลและเอกสารประกอบ</p>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>
              <MessageSquareText className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>เหตุผล</span>
            </label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => update('reason', e.target.value.slice(0, REASON_LIMIT))}
              placeholder="อธิบายเหตุผลการลาโดยสังเขป..."
              className={fieldCls(!!fieldErrors.reason)}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErrors.reason ? (
                <p className="text-[11px] text-rose-600 dark:text-rose-400">{fieldErrors.reason}</p>
              ) : (
                <span />
              )}
              <p className="text-[11px] text-neutral-400 text-right">
                {form.reason.length}/{REASON_LIMIT}
              </p>
            </div>
          </div>

          <div>
            <label className={labelCls}>ไฟล์แนบ (รูปถ่ายเอกสารประกอบการลา)</label>
            {attachment ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/60">
                <div className="flex-1 text-xs">
                  <AttachmentPreview src={attachment.url} label="ดูรูปเต็ม" thumbClassName="w-14 h-14 rounded-lg" />
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-neutral-400 hover:text-rose-500 transition-colors p-1 shrink-0"
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
                    <span>เลือกรูปภาพ...</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>
            )}
            {uploadError && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{uploadError}</p>}
            <p className="text-[11px] text-neutral-400 mt-1">* รองรับไฟล์ JPG, PNG, GIF, WEBP ขนาดไม่เกิน 5MB</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !!dateError}
        className="w-full py-3 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-sm font-bold shadow-md shadow-purple-700/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>กำลังบันทึก...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>ส่งใบลา</span>
          </>
        )}
      </button>
    </form>
  );
}
