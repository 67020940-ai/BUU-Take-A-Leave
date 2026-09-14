// ข้อมูลจำลอง (mock) สำหรับหน้าอาจารย์ — ใช้ชั่วคราวเป็นตัวอย่างสำหรับอาจารย์ที่ยังไม่มีวิชาผูกไว้จริงในระบบ

const FIRST_NAMES = [
  'จุฑามาศ', 'มงคล', 'สุจิตรา', 'พิชัย', 'วิไล', 'สมเกียรติ', 'ชัยวัฒน์', 'กมลชนก',
  'ธนกร', 'ปิยะดา', 'ณัฐวุฒิ', 'อรอุมา', 'วรากร', 'สุพัตรา', 'ภานุวัฒน์', 'เบญจวรรณ',
  'ศุภกร', 'รัตนาภรณ์', 'อนุชา', 'พรทิพย์',
];
const LAST_NAMES = [
  'แสงทอง', 'ชัยมงคล', 'บุญชู', 'รักดี', 'สมบูรณ์', 'พูนสวัสดิ์', 'จันทร', 'ศรีสุข',
  'วงศ์ษา', 'มีสุข', 'ทองดี', 'แก้วมณี', 'ปัญญาดี', 'เพชรรัตน์', 'สายทอง', 'บุญมี',
];

// seeded PRNG เพื่อให้รายชื่อ/ตัวเลขคงที่ทุกครั้งที่โหลดหน้า (ไม่กระพริบเปลี่ยนทุก refresh)
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOCK_TOTAL_SESSIONS = 15;
export const MOCK_QUOTA_RATIO = 0.2;

export const MOCK_COURSES = [
  { id: 'mock-c1', code: '24527664', name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ', term: '1/2569', group: '01', totalSessions: MOCK_TOTAL_SESSIONS, studentCount: 39 },
  { id: 'mock-c2', code: '24527664', name: 'การวิเคราะห์และออกแบบระบบสารสนเทศ', term: '1/2569', group: '02', totalSessions: MOCK_TOTAL_SESSIONS, studentCount: 36 },
  { id: 'mock-c3', code: '24527564', name: 'การประยุกต์โปรแกรมโอเพนซอร์ส', term: '1/2569', group: '01', totalSessions: MOCK_TOTAL_SESSIONS, studentCount: 41 },
  { id: 'mock-c4', code: '24527564', name: 'การประยุกต์โปรแกรมโอเพนซอร์ส', term: '1/2569', group: '02', totalSessions: MOCK_TOTAL_SESSIONS, studentCount: 33 },
];

export function buildMockRoster(course) {
  const rand = mulberry32(hashSeed(course.id));
  const count = course.studentCount || 35;
  const totalSessions = course.totalSessions;
  const quotaLimit = Math.floor(totalSessions * MOCK_QUOTA_RATIO);
  const roster = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const code = String(67000000 + Math.floor(rand() * 99999)).slice(0, 8);
    // ส่วนใหญ่เข้าเรียนครบ มีบางส่วนลาเกินโควต้าเพื่อให้เห็นตัวกรอง "เกินโควต้า" ทำงานจริง
    const approvedLeaves = rand() < 0.12 ? quotaLimit + Math.floor(rand() * 3) + 1 : Math.floor(rand() * 2);
    const attended = Math.max(totalSessions - approvedLeaves, 0);
    const percentage = Math.round((attended / totalSessions) * 100);
    roster.push({
      studentId: `${course.id}-s${i}`,
      studentCode: code,
      studentName: `${first} ${last}`,
      email: `${code}@go.buu.ac.th`,
      attended,
      totalSessions,
      approvedLeaves,
      quotaLimit,
      percentage,
      overQuota: approvedLeaves > quotaLimit,
    });
  }
  return roster;
}

const MOCK_LEAVE_TYPES = ['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'อื่นๆ'];
const MOCK_PERIODS = ['เต็มคาบเรียน 3 ชั่วโมง', 'ครึ่งคาบแรก 1.5 ชั่วโมง', 'ครึ่งคาบหลัง 1.5 ชั่วโมง'];
const MOCK_REASONS = [
  'มีนัดพบแพทย์ตามใบนัด',
  'ป่วยเป็นไข้หวัดใหญ่ พักรักษาตัวที่บ้าน',
  'ติดภารกิจครอบครัวเร่งด่วน',
  'เป็นตัวแทนเข้าร่วมกิจกรรมของมหาวิทยาลัย',
];

// รหัส id ของใบลาจำลองขึ้นต้นด้วย "mock-leave-" เสมอ เพื่อให้ UI แยกออกจากใบลาจริง (เลข id ใน DB)
// และไม่ยิง API จริงเวลากดอนุมัติ/ไม่อนุมัติ
export function buildMockPendingLeaves() {
  return MOCK_COURSES.slice(0, 3).map((course, idx) => {
    const roster = buildMockRoster(course);
    const student = roster[idx % roster.length];
    return {
      id: `mock-leave-${idx + 1}`,
      status: 'รออนุมัติ',
      type: MOCK_LEAVE_TYPES[idx % MOCK_LEAVE_TYPES.length],
      period: MOCK_PERIODS[idx % MOCK_PERIODS.length],
      startDate: `2026-09-0${idx + 1}`,
      endDate: `2026-09-0${idx + 1}`,
      reason: MOCK_REASONS[idx % MOCK_REASONS.length],
      attachment: null,
      createdAt: `2026-08-2${8 + idx}T${9 + idx}:15:00`,
      courseCode: course.code,
      courseName: course.name,
      section: course.group,
      studentName: student.studentName,
      studentCode: student.studentCode,
      studentEmail: student.email,
    };
  });
}

const MOCK_HISTORY_COMMENTS = {
  'อนุมัติ': 'อนุมัติการลาตามระเบียบเรียบร้อย',
  'ไม่อนุมัติ': 'ไม่อนุมัติเนื่องจากข้อมูลหรือเอกสารประกอบไม่ครบถ้วนตามเกณฑ์',
};

// ตัวอย่างใบลาที่ผ่านการพิจารณาแล้ว ใช้แสดงในหน้า "ประวัติการอนุมัติ" ระหว่างรอเชื่อมข้อมูลจริง
export function buildMockLeaveHistory() {
  const decisions = ['อนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ', 'อนุมัติ'];
  return decisions.map((status, idx) => {
    const course = MOCK_COURSES[(idx + 1) % MOCK_COURSES.length];
    const roster = buildMockRoster(course);
    const student = roster[(idx + 7) % roster.length];
    const day = 20 + idx;
    return {
      id: `mock-leave-history-${idx + 1}`,
      status,
      type: MOCK_LEAVE_TYPES[(idx + 2) % MOCK_LEAVE_TYPES.length],
      period: MOCK_PERIODS[(idx + 1) % MOCK_PERIODS.length],
      startDate: `2026-08-${day}`,
      endDate: `2026-08-${day}`,
      reason: MOCK_REASONS[(idx + 1) % MOCK_REASONS.length],
      attachment: null,
      createdAt: `2026-08-${day}T10:00:00`,
      teacherComment: MOCK_HISTORY_COMMENTS[status],
      courseCode: course.code,
      courseName: course.name,
      section: course.group,
      studentName: student.studentName,
      studentCode: student.studentCode,
      studentEmail: student.email,
    };
  });
}
