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

export const GE_SCHEDULE_MAP = {
  '89510169': { day: 'MO', time: '09:00-11:50', room: 'HUSO-101' },
  '89520169': { day: 'MO', time: '13:00-15:50', room: 'HUSO-201' },
  '89520269': { day: 'MO', time: '09:00-11:50', room: 'HUSO-202' },
  '89510764': { day: 'TH', time: '09:00-11:50', room: 'HUSO-301' },
  '89520264': { day: 'TH', time: '13:00-15:50', room: 'HUSO-401' },
  '89520364': { day: 'FR', time: '09:00-11:50', room: 'HUSO-402' },
  '89530064': { day: 'WE', time: '13:00-15:50', room: 'HUSO-501' },
  '89539764': { day: 'FR', time: '13:00-15:50', room: 'HUSO-601' },
};

/**
 * แก้ไขชื่อรายวิชาที่พิมพ์ตกหล่น (เช่น "ควระบบ" หรือ "สัมนา")
 */
export function getCorrectedCourseName(name) {
  if (!name || typeof name !== 'string') return name;
  let fixed = name;
  if (fixed.includes('การจัดการควระบบห้องสมุดอัตโนมัติ')) {
    fixed = fixed.replace('การจัดการควระบบห้องสมุดอัตโนมัติ', 'การจัดการระบบห้องสมุดอัตโนมัติ');
  }
  if (fixed.includes('สัมนาทิศทางและแนวโน้ม')) {
    fixed = fixed.replace('สัมนาทิศทางและแนวโน้ม', 'สัมมนาทิศทางและแนวโน้ม');
  }
  return fixed;
}

/**
 * จัดการเลขห้องเรียนจำลอง:
 * - ตึก QS2: QS2-101 ถึง QS2-803 (เลขท้าย 01, 02, 03 เท่านั้น)
 * - ตึก HUSO: HUSO-101 ถึง HUSO-603 (เลขท้าย 01, 02, 03 เท่านั้น)
 */
export function getStandardizedRoom(course) {
  if (!course) return 'QS2-201';
  const code = String(course.code || '');
  if (code === '24549264') return null; // สหกิจศึกษา (ออกฝึกงาน)

  const existing = course.room ? String(course.room).trim() : '';
  if (existing && /^(QS2-[1-8]0[1-3]|HUSO-[1-6]0[1-3])$/i.test(existing)) {
    return existing.toUpperCase();
  }

  // คำนวณแบบคงที่จากรหัสวิชาและกลุ่มเรียน
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) % 1000;
  }
  const grNum = parseInt(course.group, 10) || 1;
  hash = (hash + grNum * 13) % 1000;

  if (code.startsWith('895')) {
    const floor = (hash % 6) + 1; // 1 to 6
    const roomNum = (hash % 3) + 1; // 1 to 3
    return `HUSO-${floor}0${roomNum}`;
  } else {
    const floor = (hash % 8) + 1; // 1 to 8
    const roomNum = (hash % 3) + 1; // 1 to 3
    return `QS2-${floor}0${roomNum}`;
  }
}

export function enrichCourseSchedule(course) {
  if (!course) return course;
  let enriched = { ...course };

  // 1. แก้ไขชื่อวิชาที่พิมพ์ตกหล่น
  if (enriched.name) {
    enriched.name = getCorrectedCourseName(enriched.name);
  }

  // 2. เติมข้อมูลตารางเรียนเริ่มต้นสำหรับวิชา GE
  if (!enriched.day && enriched.code && GE_SCHEDULE_MAP[enriched.code]) {
    const defaultSched = GE_SCHEDULE_MAP[enriched.code];
    enriched.day = enriched.day || defaultSched.day;
    enriched.time = enriched.time || defaultSched.time;
    enriched.room = enriched.room || defaultSched.room;
  }

  // 3. กำหนดเลขห้องเรียนให้ตรงตามกฎ QS2 (101-803) และ HUSO (101-603)
  const stdRoom = getStandardizedRoom(enriched);
  if (stdRoom !== undefined) {
    enriched.room = stdRoom;
  }

  return enriched;
}

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
      scopedLeaves: [],
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
    scopedLeaves: filtered,
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
