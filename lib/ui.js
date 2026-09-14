export const STATUS_DETAILS = {
  'รออนุมัติ': {
    label: 'รออนุมัติ',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  'อนุมัติ': {
    label: 'อนุมัติแล้ว',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  'ไม่อนุมัติ': {
    label: 'ไม่อนุมัติ',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    dot: 'bg-rose-500',
  },
  'ยกเลิก': {
    label: 'ยกเลิกแล้ว',
    badge: 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-slate-800 dark:text-neutral-400 dark:border-slate-700',
    dot: 'bg-neutral-400',
  },
};

export const LEAVE_TYPE_DEFAULT = 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-slate-800 dark:text-neutral-300 dark:border-slate-700';

export const LEAVE_TYPE_DETAILS = {
  'ลาป่วย': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
  'ลากิจส่วนตัว': 'bg-purple-50 text-[#7749BC] border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  'ลากิจกรรม': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  'เหตุฉุกเฉิน': 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  'อื่นๆ': LEAVE_TYPE_DEFAULT,
};

export const DAY_LABEL_TH = {
  MO: 'จันทร์',
  TU: 'อังคาร',
  WE: 'พุธ',
  TH: 'พฤหัสบดี',
  FR: 'ศุกร์',
  SA: 'เสาร์',
  SU: 'อาทิตย์',
};

export function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatThaiDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
