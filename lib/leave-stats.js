/**
 * lib/leave-stats.js
 * Single source of truth for leave statistics calculation and class time formatting.
 */

export const DAY_NORM_MAP = {
  // ISO / numeric
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA',
  0: 'SU',
  7: 'SU',
  // Short keys
  MO: 'MO',
  TU: 'TU',
  WE: 'WE',
  TH: 'TH',
  FR: 'FR',
  SA: 'SA',
  SU: 'SU',
  MON: 'MO',
  TUE: 'TU',
  WED: 'WE',
  THU: 'TH',
  FRI: 'FR',
  SAT: 'SA',
  SUN: 'SU',
  // Full English
  MONDAY: 'MO',
  TUESDAY: 'TU',
  WEDNESDAY: 'WE',
  THURSDAY: 'TH',
  FRIDAY: 'FR',
  SATURDAY: 'SA',
  SUNDAY: 'SU',
  // Thai
  'จันทร์': 'MO',
  'วันจันทร์': 'MO',
  'อังคาร': 'TU',
  'วันอังคาร': 'TU',
  'พุธ': 'WE',
  'วันพุธ': 'WE',
  'พฤหัสบดี': 'TH',
  'วันพฤหัสบดี': 'TH',
  'พฤหัส': 'TH',
  'วันพฤหัส': 'TH',
  'ศุกร์': 'FR',
  'วันศุกร์': 'FR',
  'เสาร์': 'SA',
  'วันเสาร์': 'SA',
  'อาทิตย์': 'SU',
  'วันอาทิตย์': 'SU',
};

/**
 * Standardize any day representation into 2-letter uppercase key: MO, TU, WE, TH, FR, SA, SU
 */
export function normalizeDayKey(rawDay) {
  if (rawDay === null || rawDay === undefined) return '';
  const str = String(rawDay).trim();
  if (!str) return '';

  const upper = str.toUpperCase();
  if (DAY_NORM_MAP[upper]) return DAY_NORM_MAP[upper];

  for (const [key, val] of Object.entries(DAY_NORM_MAP)) {
    if (upper.includes(key)) return val;
  }
  return '';
}

/**
 * Calculate leave statistics across all leaves or filtered by term.
 * All leaves including 'ยกเลิก' are counted in total.
 */
export function calculateLeaveStats(leaves = [], termFilter = 'all', summaries = []) {
  if (!Array.isArray(leaves)) {
    return {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      hasCancelled: false,
      filteredLeaves: [],
    };
  }

  const filtered =
    !termFilter || termFilter === 'all'
      ? leaves
      : leaves.filter((l) => {
          const leaveTerm =
            l.courseTerm ||
            l.term ||
            (Array.isArray(summaries) &&
              summaries.find((s) => (s.course?.id || s.id) === l.courseId)?.course?.term);
          return !leaveTerm || leaveTerm === termFilter;
        });

  const total = filtered.length;
  const approved = filtered.filter((l) => l.status === 'อนุมัติ').length;
  const pending = filtered.filter((l) => l.status === 'รออนุมัติ').length;
  const rejected = filtered.filter((l) => l.status === 'ไม่อนุมัติ').length;
  const cancelled = filtered.filter(
    (l) => l.status === 'ยกเลิก' || l.status === 'เพิกถอน' || l.status === 'เพิกถอนการอนุมัติ'
  ).length;

  return {
    total,
    approved,
    pending,
    rejected,
    cancelled,
    hasCancelled: cancelled > 0,
    filteredLeaves: filtered,
  };
}

/**
 * Clean and format time string (e.g. "09:00 - 11:50" -> "9:00-11:50")
 */
export function cleanTimeString(timeStr) {
  if (!timeStr) return '';
  let cleaned = String(timeStr).trim();
  cleaned = cleaned.replace(/^\(+/, '').replace(/\)+$/, '').trim();
  // Format "09:00 - 11:50" to "9:00-11:50"
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-').map((p) => p.trim());
    const start = parts[0].replace(/^0/, '');
    const end = parts[1] ? parts[1].replace(/^0/, '') : '';
    return end ? `${start}-${end}` : start;
  }
  return cleaned.replace(/^0/, '');
}

/**
 * Format actual class time for a leave request based on course timetable and leave date range in Asia/Bangkok timezone.
 * Returns formatted string like "เวลาเรียน 9:00-11:50"
 */
export function formatLeaveClassTime(leave, fallbackCourse = null) {
  if (!leave) return 'ไม่ระบุเวลา';

  const course = leave.course || fallbackCourse || null;
  const rawTime = leave.courseTime || course?.time || '';
  const rawDay = leave.courseDay || course?.day || '';

  // If no course time available at all
  if (!rawTime) {
    // If legacy period exists and does not contain legacy static placeholder
    if (leave.period && !leave.period.includes('เต็มคาบ') && !leave.period.includes('ครึ่งคาบ')) {
      return `เวลาเรียน ${cleanTimeString(leave.period)}`;
    }
    return 'ไม่ระบุเวลา';
  }

  const courseDayKey = normalizeDayKey(rawDay);
  const startDateStr = leave.startDate;
  const endDateStr = leave.endDate || leave.startDate;

  if (!startDateStr) {
    const cleaned = cleanTimeString(rawTime);
    return cleaned ? `เวลาเรียน ${cleaned}` : 'ไม่ระบุเวลา';
  }

  // Iterate dates between startDate and endDate in Asia/Bangkok
  const matchedTimes = new Set();
  try {
    const start = new Date(`${startDateStr}T00:00:00+07:00`);
    const end = new Date(`${endDateStr}T00:00:00+07:00`);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const cur = new Date(start);
      // Limit to 31 days to guard against runaway loops
      let guard = 0;
      while (cur <= end && guard < 31) {
        // Bangkok day of week (0=Sunday, 1=Monday, ...)
        const dayNum = cur.getDay();
        const curDayKey = DAY_NORM_MAP[dayNum] || '';
        if (curDayKey && curDayKey === courseDayKey) {
          matchedTimes.add(cleanTimeString(rawTime));
        }
        cur.setDate(cur.getDate() + 1);
        guard++;
      }
    }
  } catch {
    // ignore date parse errors
  }

  if (matchedTimes.size > 0) {
    const joined = Array.from(matchedTimes).join(', ');
    return `เวลาเรียน ${joined}`;
  }

  // Fallback to course's first session time
  const fallbackClean = cleanTimeString(rawTime);
  if (fallbackClean) {
    return `เวลาเรียน ${fallbackClean}`;
  }

  return 'ไม่ระบุเวลา';
}
