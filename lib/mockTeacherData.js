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
const MOCK_PERIODS = ['เต็มคาบเรียน (09:00 - 12:00)', 'เต็มคาบเรียน (13:00 - 16:00)', 'ครึ่งคาบแรก (09:00 - 10:30)', 'เต็มคาบเรียน 3 ชั่วโมง'];
const MOCK_REASONS = [
  'มีนัดพบแพทย์ตามใบนัดโรงพยาบาลชลบุรี',
  'ป่วยเป็นไข้หวัดใหญ่ มีอาการตัวร้อน พักรักษาตัวที่บ้าน',
  'ติดภารกิจครอบครัวเร่งด่วนต่างจังหวัด',
  'เป็นตัวแทนเข้าร่วมโครงการแข่งขันนวัตกรรมและวิชาการระดับชาติ',
  'ปวดศีรษะและท้องเสียเฉียบพลัน',
  'ร่วมกิจกรรมจิตอาสาและบริการวิชาการของคณะ',
  'มีนัดตรวจสุขภาพประจำปี',
];

// รายการคำขอลาที่รออนุมัติ
export function buildMockPendingLeaves() {
  const pendingTemplates = [
    { courseIdx: 0, studentIdx: 1, type: 'ลาป่วย', date: '2026-09-02', reasonIdx: 1 },
    { courseIdx: 1, studentIdx: 3, type: 'ลากิจส่วนตัว', date: '2026-09-03', reasonIdx: 2 },
    { courseIdx: 2, studentIdx: 5, type: 'ลากิจกรรม', date: '2026-09-07', reasonIdx: 3 },
    { courseIdx: 0, studentIdx: 8, type: 'ลาป่วย', date: '2026-09-10', reasonIdx: 4 },
    { courseIdx: 3, studentIdx: 2, type: 'อื่นๆ', date: '2026-09-15', reasonIdx: 6 },
    { courseIdx: 1, studentIdx: 6, type: 'ลาป่วย', date: '2026-09-21', reasonIdx: 0 },
  ];

  return pendingTemplates.map((item, idx) => {
    const course = MOCK_COURSES[item.courseIdx % MOCK_COURSES.length];
    const roster = buildMockRoster(course);
    const student = roster[item.studentIdx % roster.length];
    return {
      id: `mock-leave-${idx + 1}`,
      status: 'รออนุมัติ',
      type: item.type,
      period: MOCK_PERIODS[idx % MOCK_PERIODS.length],
      startDate: item.date,
      endDate: item.date,
      reason: MOCK_REASONS[item.reasonIdx % MOCK_REASONS.length],
      attachment: null,
      createdAt: `${item.date}T08:30:00`,
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      courseTerm: course.term,
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

// ประวัติใบลาที่พิจารณาแล้ว
export function buildMockLeaveHistory() {
  const historyTemplates = [
    { courseIdx: 0, studentIdx: 7, type: 'ลาป่วย', date: '2026-09-02', status: 'อนุมัติ', reasonIdx: 0 },
    { courseIdx: 1, studentIdx: 11, type: 'ลาป่วย', date: '2026-09-03', status: 'อนุมัติ', reasonIdx: 1 },
    { courseIdx: 2, studentIdx: 14, type: 'ลากิจส่วนตัว', date: '2026-09-07', status: 'อนุมัติ', reasonIdx: 2 },
    { courseIdx: 3, studentIdx: 4, type: 'ลากิจกรรม', date: '2026-09-08', status: 'อนุมัติ', reasonIdx: 3 },
    { courseIdx: 0, studentIdx: 9, type: 'ลาป่วย', date: '2026-09-10', status: 'ไม่อนุมัติ', reasonIdx: 4 },
    { courseIdx: 1, studentIdx: 12, type: 'ลากิจส่วนตัว', date: '2026-09-14', status: 'อนุมัติ', reasonIdx: 2 },
    { courseIdx: 2, studentIdx: 16, type: 'ลาป่วย', date: '2026-09-15', status: 'อนุมัติ', reasonIdx: 0 },
    { courseIdx: 3, studentIdx: 8, type: 'ลากิจกรรม', date: '2026-09-18', status: 'อนุมัติ', reasonIdx: 3 },
    { courseIdx: 0, studentIdx: 15, type: 'ลาป่วย', date: '2026-09-20', status: 'อนุมัติ', reasonIdx: 1 },
    { courseIdx: 1, studentIdx: 19, type: 'ลากิจส่วนตัว', date: '2026-08-25', status: 'อนุมัติ', reasonIdx: 2 },
    { courseIdx: 2, studentIdx: 21, type: 'ลาป่วย', date: '2026-08-28', status: 'อนุมัติ', reasonIdx: 0 },
  ];

  return historyTemplates.map((item, idx) => {
    const course = MOCK_COURSES[item.courseIdx % MOCK_COURSES.length];
    const roster = buildMockRoster(course);
    const student = roster[item.studentIdx % roster.length];
    return {
      id: `mock-leave-history-${idx + 1}`,
      status: item.status,
      type: item.type,
      period: MOCK_PERIODS[(idx + 1) % MOCK_PERIODS.length],
      startDate: item.date,
      endDate: item.date,
      reason: MOCK_REASONS[item.reasonIdx % MOCK_REASONS.length],
      attachment: null,
      createdAt: `${item.date}T09:15:00`,
      teacherComment: MOCK_HISTORY_COMMENTS[item.status],
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      courseTerm: course.term,
      section: course.group,
      studentName: student.studentName,
      studentCode: student.studentCode,
      studentEmail: student.email,
    };
  });
}
