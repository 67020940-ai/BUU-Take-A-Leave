const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: { db: { url: 'file:/Users/jay/buu-e-leave/prisma/dev.db' } },
});

async function updateMockTeacherData() {
  const teachers = await prisma.user.findMany({ where: { role: 'teacher' } });
  const map = {};

  for (const t of teachers) {
    const courses = await prisma.course.findMany({ where: { teacherId: t.id } });
    map[t.email] = courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      term: c.term,
      group: c.group || '01',
      day: c.day,
      time: c.time,
      room: c.room,
      totalSessions: 15,
      studentCount: 35,
    }));
  }

  const mapJson = JSON.stringify(map, null, 2);

  const fileContent = `// ข้อมูลจำลอง (mock) สำหรับหน้าอาจารย์ — แยกตามอาจารย์แต่ละท่านอย่างเคร่งครัด
// ดึงข้อมูลวิชาจริงจาก Google Drive ปีการศึกษา 2569

const FIRST_NAMES = [
  'จุฑามาศ', 'มงคล', 'สุจิตรา', 'พิชัย', 'วิไล', 'สมเกียรติ', 'ชัยวัฒน์', 'กมลชนก',
  'ธนกร', 'ปิยะดา', 'ณัฐวุฒิ', 'อรอุมา', 'วรากร', 'สุพัตรา', 'ภานุวัฒน์', 'เบญจวรรณ',
  'ศุภกร', 'รัตนาภรณ์', 'อนุชา', 'พรทิพย์',
];
const LAST_NAMES = [
  'แสงทอง', 'ชัยมงคล', 'บุญชู', 'รักดี', 'สมบูรณ์', 'พูนสวัสดิ์', 'จันทร', 'ศรีสุข',
  'วงศ์ษา', 'มีสุข', 'ทองดี', 'แก้วมณี', 'ปัญญาดี', 'เพชรรัตน์', 'สายทอง', 'บุญมี',
];

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

export const MOCK_COURSES_BY_TEACHER = ${mapJson};

export function getMockCoursesForTeacher(identifier) {
  if (!identifier) return MOCK_COURSES_BY_TEACHER['teacher-srihathai@buu.ac.th'] || [];
  const clean = String(identifier).toLowerCase();
  for (const [email, list] of Object.entries(MOCK_COURSES_BY_TEACHER)) {
    if (clean === email.toLowerCase() || clean.includes(email.split('@')[0]) || email.includes(clean)) {
      return list;
    }
  }
  return MOCK_COURSES_BY_TEACHER['teacher-srihathai@buu.ac.th'] || [];
}

export const MOCK_COURSES = MOCK_COURSES_BY_TEACHER['teacher-akara@buu.ac.th'] || [];

const WIREFRAME_STUDENTS = [
  { code: '67020001', name: 'นางสาววราพร ทองแท้บุญ', leavesCount: 2, lastDate: '28/09/2569' },
  { code: '67020002', name: 'นางสาววราพร ไผ่ทองคำ', leavesCount: 7, lastDate: '05/10/2569' },
  { code: '67020003', name: 'นางสาวสนิชชา หมาล่า', leavesCount: 3, lastDate: '07/09/2569' },
  { code: '67020004', name: 'นายจีรวัฒน์ กุนเชียง', leavesCount: 1, lastDate: '31/08/2569' },
];

export function buildMockRoster(course) {
  const rand = mulberry32(hashSeed(course.id || course.code || 'course'));
  const count = course.studentCount || 35;
  const totalSessions = course.totalSessions || 15;
  const quotaLimit = Math.floor(totalSessions * MOCK_QUOTA_RATIO);
  const roster = [];
  for (let i = 0; i < count; i++) {
    let first, last, code, lastDate = null;
    let approvedLeaves = 0;
    if (i < WIREFRAME_STUDENTS.length) {
      const ws = WIREFRAME_STUDENTS[i];
      const parts = ws.name.split(' ');
      first = parts[0];
      last = parts.slice(1).join(' ');
      code = ws.code;
      approvedLeaves = ws.leavesCount;
      lastDate = ws.lastDate;
    } else {
      first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
      last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
      code = String(67000000 + Math.floor(rand() * 99999)).slice(0, 8);
      approvedLeaves = rand() < 0.12 ? quotaLimit + Math.floor(rand() * 3) + 1 : Math.floor(rand() * 3);
      if (approvedLeaves > 0) {
        const day = String(Math.floor(rand() * 28) + 1).padStart(2, '0');
        const month = String(Math.floor(rand() * 3) + 8).padStart(2, '0');
        lastDate = \`\${day}/\${month}/2569\`;
      }
    }
    const attended = Math.max(totalSessions - approvedLeaves, 0);
    const percentage = Math.round((attended / totalSessions) * 100);
    roster.push({
      studentId: \`\${course.id || course.code}-s\${i}\`,
      studentCode: code,
      studentName: \`\${first} \${last}\`.trim(),
      email: \`\${code}@go.buu.ac.th\`,
      attended,
      totalSessions,
      approvedLeaves,
      leavesCount: approvedLeaves,
      lastLeaveDate: lastDate,
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
  'มีอาการไข้หวัด ปวดศีรษะ พักรักษาตัวที่บ้าน',
  'ติดภารกิจครอบครัวจำเป็นเร่งด่วน',
  'เป็นตัวแทนนิสิตเข้าร่วมการแข่งขันระดับมหาวิทยาลัย',
];

export function buildMockPendingLeaves(courses = []) {
  const targetCourses = courses.length > 0 ? courses : [MOCK_COURSES[0]];
  const list = [];
  targetCourses.forEach((c, idx) => {
    list.push({
      id: \`pending-leave-\${idx + 1}\`,
      type: MOCK_LEAVE_TYPES[idx % MOCK_LEAVE_TYPES.length],
      period: MOCK_PERIODS[idx % MOCK_PERIODS.length],
      startDate: '2026-09-02',
      endDate: '2026-09-02',
      reason: MOCK_REASONS[idx % MOCK_REASONS.length],
      status: 'รออนุมัติ',
      teacherComment: null,
      attachment: '/sample-medical-cert.png',
      createdAt: '2026-09-02T08:30:00',
      courseId: c.id,
      courseCode: c.code,
      courseName: c.name,
      courseTerm: c.term,
      section: c.group || '01',
      studentName: 'จุฑามาศ แสงทอง',
      studentCode: '66000001',
      studentEmail: '66000001@go.buu.ac.th',
    });
  });
  return list;
}

export function buildMockLeaveHistory(courses = []) {
  return [];
}
`;

  fs.writeFileSync('/Users/jay/buu-e-leave/lib/mockTeacherData.js', fileContent, 'utf8');
  fs.writeFileSync('/Users/jay/BUU-Take-A-Leave/lib/mockTeacherData.js', fileContent, 'utf8');
  console.log('✅ Generated isolated mock teacher data in both folders!');
}

updateMockTeacherData().finally(() => prisma.$disconnect());
