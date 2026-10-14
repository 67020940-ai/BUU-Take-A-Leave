#!/usr/bin/env node
/**
 * Import and synchronize courses, teachers, and student cohorts from Google Drive Excel files into SQLite / Prisma.
 * Source folder: /Users/jay/Library/CloudStorage/GoogleDrive-sixxyonex2@gmail.com/My Drive/mock up รายชื่อ
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();

const GOOGLE_DRIVE_DIR = '/Users/jay/Library/CloudStorage/GoogleDrive-sixxyonex2@gmail.com/My Drive/mock up รายชื่อ';
const TEACHER_EXCEL = path.join(
  GOOGLE_DRIVE_DIR,
  'ตารางภาระงานของอาจารย์ประจำภาควิชาสารสนเทศศึกษา ปีการศึก2569',
  'ตารางสอนอาจารย์ ปีการศึกษา 69.xlsx'
);
const STUDENT_EXCEL = path.join(
  GOOGLE_DRIVE_DIR,
  'ตารางเรียนนิสิต',
  'ตารางเรียนนิสิต1.xlsx'
);

const PASSWORD_PLAIN = '1234';

const TEACHERS_MAP = {
  teeradech: {
    key: 'teeradech',
    email: 'teacher-teeradech@buu.ac.th',
    name: 'ดร.ธีรเดช มานะกุล',
    search: ['ธีรเดช'],
  },
  wannaprapa: {
    key: 'wannaprapa',
    email: 'teacher-wannaprapa@buu.ac.th',
    name: 'ผศ.วรรณประภา เอี่ยมฤทธิ์',
    search: ['วรรณประภา'],
  },
  khwanchadin: {
    key: 'khwanchadin',
    email: 'teacher-khwanchadin@buu.ac.th',
    name: 'ผศ.ดร.ขวัญชฎิล พิศาลพงศ์',
    search: ['ขวัญชฎิล'],
  },
  nichapon: {
    key: 'nichapon',
    email: 'teacher-chatchapon@buu.ac.th', // keep original email for seamless test login
    name: 'ผศ.ดร.ณิชพน โชติจันทรกุล',
    search: ['ณิชพน', 'ฉัชพน'],
  },
  srihathai: {
    key: 'srihathai',
    email: 'teacher-srihathai@buu.ac.th',
    name: 'ผศ.ดร.ศรีหทัย เวลล์ส',
    search: ['ศรีหทัย'],
  },
  akara: {
    key: 'akara',
    email: 'teacher-akara@buu.ac.th',
    name: 'ผศ.ดร.อัครา ธรรมมาสถิตย์กุล',
    search: ['อัครา'],
  },
  somruethai: {
    key: 'somruethai',
    email: 'teacher-somruethai@buu.ac.th',
    name: 'อ.สมฤทัย ธีรเรืองสิริ',
    search: ['สมฤทัย'],
  },
  preeyanuch: {
    key: 'preeyanuch',
    email: 'teacher-preeyanuch@buu.ac.th',
    name: 'ผศ.ดร.ปรียานุช วรวิกโฆษิต',
    search: ['ปรียานุช'],
  },
};

const DAY_MAP = {
  จันทร์: 'MO',
  วันจันทร์: 'MO',
  อังคาร: 'TU',
  วันอังคาร: 'TU',
  พุธ: 'WE',
  วันพุธ: 'WE',
  พฤหัสบดี: 'TH',
  วันพฤหัสบดี: 'TH',
  ศุกร์: 'FR',
  วันศุกร์: 'FR',
};

function normalizeDay(str) {
  if (!str) return null;
  const s = str.trim().replace(/\s+/g, '');
  for (const [k, v] of Object.entries(DAY_MAP)) {
    if (s.includes(k)) return v;
  }
  return s;
}

function normalizeGroup(g) {
  if (!g) return '01';
  const clean = g.toString().replace(/[^0-9]/g, '');
  if (!clean) return '01';
  return clean.padStart(2, '0');
}

function findTeacherObj(text) {
  if (!text) return null;
  for (const t of Object.values(TEACHERS_MAP)) {
    if (t.search.some((kw) => text.includes(kw))) {
      return t;
    }
  }
  return null;
}

const STUDENT_NAMES = [
  'จุฑามาศ แสงทอง', 'มงคล ชัยมงคล', 'สุจิตรา บุญชู', 'พิชัย รักดี',
  'วิไล สมบูรณ์', 'สมเกียรติ พูนสวัสดิ์', 'ชัยวัฒน์ จันทร', 'กมลชนก ศรีสุข',
  'ธนกร วงศ์ษา', 'ปิยะดา มีสุข', 'ณัฐวุฒิ ทองดี', 'อรอุมา แก้วมณี',
  'วรากร ปัญญาดี', 'สุพัตรา เพชรรัตน์', 'ภานุวัฒน์ สายทอง', 'เบญจวรรณ บุญมี',
  'ศุภกร วงศ์สุข', 'รัตนาภรณ์ ศรีสุวรรณ', 'อนุชา คำแก้ว', 'พรทิพย์ อินทร์แก้ว',
  'เอกชัย นาคทอง', 'ปวีณา บุญรอด', 'กิตติพงษ์ ทองใบ', 'นภาพร สุขใจ',
  'ธีรภัทร มั่นคง', 'อัจฉรา ผลบุญ', 'วีรยุทธ ใจกล้า', 'สุนิสา แก้วประเสริฐ',
  'อภิสิทธิ์ รุ่งเรือง', 'ดวงใจ สว่างวงศ์', 'กฤษณะ ทิพย์รักษ์', 'มัณฑนา ศรีวิไล',
];

async function main() {
  console.log('🚀 Starting Google Drive Database Import...');
  console.log(`📁 Google Drive Folder: ${GOOGLE_DRIVE_DIR}`);

  if (!fs.existsSync(TEACHER_EXCEL)) {
    throw new Error(`Teacher Excel file not found at: ${TEACHER_EXCEL}`);
  }
  if (!fs.existsSync(STUDENT_EXCEL)) {
    throw new Error(`Student Excel file not found at: ${STUDENT_EXCEL}`);
  }

  const password = await bcrypt.hash(PASSWORD_PLAIN, 10);

  // 1. Clean Database
  console.log('🧹 Clearing existing database tables...');
  await prisma.notification.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Admin
  console.log('👑 Creating Admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@buu.ac.th',
      password,
      name: 'ผู้ดูแลระบบ',
      role: 'admin',
      faculty: 'คณะวิทยาการสารสนเทศ',
      major: 'ภาควิชาสารสนเทศศึกษา',
    },
  });

  // 3. Create Teachers
  console.log('👨‍🏫 Creating Teachers from Google Drive metadata...');
  const teacherUsers = {}; // key -> User record
  const teacherRows = {};  // for credential xlsx export
  for (const t of Object.values(TEACHERS_MAP)) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        password,
        name: t.name,
        role: 'teacher',
        faculty: 'คณะวิทยาการสารสนเทศ',
        major: 'ภาควิชาสารสนเทศศึกษา',
      },
    });
    teacherUsers[t.key] = user;
    teacherRows[t.key] = {
      name: t.name,
      email: t.email,
      password: PASSWORD_PLAIN,
      subjects: [],
    };
  }

  // 4. Parse Teacher Excel
  console.log('📖 Parsing Teacher Excel file...');
  const wbT = new ExcelJS.Workbook();
  await wbT.xlsx.readFile(TEACHER_EXCEL);

  const courseMap = new Map(); // key `${code}#${term}#${group}` -> course object

  wbT.eachSheet((sheet) => {
    let term = '1/2569';
    if (sheet.name.includes('เทอม2')) term = '2/2569';
    else if (sheet.name.includes('เทอม1')) term = '1/2569';

    let sheetTeacher = findTeacherObj(sheet.name);

    sheet.eachRow((row, r) => {
      const c1 = row.getCell(1).text?.trim();
      if (r === 1 && c1) {
        const found = findTeacherObj(c1);
        if (found) sheetTeacher = found;
      }

      const code = row.getCell(2).text?.trim();
      const nameEn = row.getCell(3).text?.trim();
      const nameTh = row.getCell(4).text?.trim();
      const groupRaw = row.getCell(5).text?.trim();
      const dayRaw = row.getCell(6).text?.trim();
      const time = row.getCell(7).text?.trim();
      const room = row.getCell(8).text?.trim();

      if (code && code.match(/^[0-9]{8}$/)) {
        let group = normalizeGroup(groupRaw);
        let key = `${code}#${term}#${group}`;

        // Handle team-taught / cooperative education having identical group numbers
        if (courseMap.has(key)) {
          let gNum = parseInt(group, 10) || 1;
          while (courseMap.has(`${code}#${term}#${String(gNum).padStart(2, '0')}`)) {
            gNum++;
          }
          group = String(gNum).padStart(2, '0');
          key = `${code}#${term}#${group}`;
        }

        courseMap.set(key, {
          code,
          name: nameTh || nameEn,
          term,
          group,
          totalSessions: 15,
          day: normalizeDay(dayRaw),
          time: time || null,
          room: room || null,
          teacherKey: sheetTeacher?.key || null,
          teacherUser: sheetTeacher ? teacherUsers[sheetTeacher.key] : null,
        });
      }
    });
  });

  // 5. Parse Student Excel for additional General Ed courses
  console.log('📖 Parsing Student Schedule Excel file for cohort courses...');
  const wbS = new ExcelJS.Workbook();
  await wbS.xlsx.readFile(STUDENT_EXCEL);

  const cohortCourseKeys = {
    66: { '1/2569': [], '2/2569': [] },
    67: { '1/2569': [], '2/2569': [] },
    68: { '1/2569': [], '2/2569': [] },
    69: { '1/2569': [], '2/2569': [] },
  };

  wbS.eachSheet((sheet) => {
    const match = sheet.name.match(/รหัส\s*(\d{2})\s*เทอม\s*(\d)\s*ปี\s*(\d{2})/);
    if (!match) return;

    const cohort = parseInt(match[1], 10);
    const termNum = match[2];
    const year = match[3];
    if (year !== '69' || !cohortCourseKeys[cohort]) return;

    const term = `${termNum}/2569`;

    sheet.eachRow((row) => {
      const code = row.getCell(1).text?.trim();
      const nameEn = row.getCell(2).text?.trim();
      const nameTh = row.getCell(3).text?.trim();
      const groupRaw = row.getCell(4).text?.trim();
      const dayRaw = row.getCell(5).text?.trim();
      const time = row.getCell(6).text?.trim();
      const col7 = row.getCell(7).text?.trim();
      const col8 = row.getCell(8).text?.trim();

      if (code && code.match(/^[0-9]{8}$/)) {
        let room = null;
        let teacherText = col7;
        if (col7 && col7.startsWith('QS')) {
          room = col7;
          teacherText = col8;
        }

        const teacherObj = findTeacherObj(teacherText);
        let group = groupRaw ? normalizeGroup(groupRaw) : '01';
        let key = `${code}#${term}#${group}`;

        if (!courseMap.has(key)) {
          // If not in courseMap yet, add general ed / department course
          courseMap.set(key, {
            code,
            name: nameTh || nameEn,
            term,
            group: groupRaw ? group : '',
            totalSessions: 15,
            day: normalizeDay(dayRaw),
            time: time || null,
            room: room || null,
            teacherKey: teacherObj?.key || null,
            teacherUser: teacherObj ? teacherUsers[teacherObj.key] : null,
          });
        } else {
          // Enrich room or teacher if missing
          const existing = courseMap.get(key);
          if (!existing.room && room) existing.room = room;
          if (!existing.teacherUser && teacherObj) {
            existing.teacherKey = teacherObj.key;
            existing.teacherUser = teacherUsers[teacherObj.key];
          }
        }

        if (!cohortCourseKeys[cohort][term].includes(key)) {
          cohortCourseKeys[cohort][term].push(key);
        }
      }
    });
  });

  // 6. Insert all Courses into Database
  console.log(`📚 Inserting ${courseMap.size} courses into database...`);
  const courseDbRecords = {}; // key -> Course DB record

  for (const [key, c] of courseMap.entries()) {
    const course = await prisma.course.create({
      data: {
        code: c.code,
        name: c.name,
        term: c.term,
        group: c.group,
        totalSessions: c.totalSessions,
        day: c.day,
        time: c.time,
        room: c.room,
        teacherId: c.teacherUser?.id || null,
        teacherName: c.teacherUser?.name || null,
      },
    });
    courseDbRecords[key] = course;

    if (c.teacherKey && teacherRows[c.teacherKey]) {
      const label = c.group ? `${c.code} (${c.group})` : c.code;
      teacherRows[c.teacherKey].subjects.push(`${label} ${c.name} [${c.term}]`);
    }
  }

  // 7. Create Mock Students and Enrollments
  console.log('🎓 Creating Mock Students and Enrollments across cohorts...');
  const studentRows = [];
  const createdStudents = [];
  const enrollments = [];

  let nameIndex = 0;
  for (const cohort of [66, 67, 68, 69]) {
    const cohortStudents = [];
    for (let i = 1; i <= 8; i++) {
      const studentId = `${cohort}${String(i).padStart(6, '0')}`;
      const name = STUDENT_NAMES[nameIndex % STUDENT_NAMES.length];
      nameIndex++;

      const student = await prisma.user.create({
        data: {
          email: `${studentId}@go.buu.ac.th`,
          password,
          name,
          role: 'student',
          studentId,
          faculty: 'คณะวิทยาการสารสนเทศ',
          major: 'ภาควิชาสารสนเทศศึกษา',
        },
      });

      cohortStudents.push(student);
      createdStudents.push(student);

      studentRows.push({
        name: student.name,
        studentId: student.studentId,
        cohort: `รุ่น ${cohort}`,
        email: student.email,
        password: PASSWORD_PLAIN,
      });
    }

    // Enroll students in courses for Term 1/2569 and Term 2/2569
    for (const term of ['1/2569', '2/2569']) {
      let keysForTerm = cohortCourseKeys[cohort][term];
      if (!keysForTerm || keysForTerm.length === 0) {
        // Fallback: enroll in courses matching this term if specific cohort sheet was empty
        keysForTerm = Array.from(courseMap.keys()).filter((k) => k.includes(`#${term}#`)).slice(0, 4);
      }

      // Group courses by code so we can split students between G.1 and G.2
      const byCode = {};
      for (const k of keysForTerm) {
        const [code] = k.split('#');
        if (!byCode[code]) byCode[code] = [];
        byCode[code].push(k);
      }

      cohortStudents.forEach((st, idx) => {
        for (const code of Object.keys(byCode)) {
          const availableGroups = byCode[code];
          const chosenKey = availableGroups[idx % availableGroups.length];
          const courseRec = courseDbRecords[chosenKey];
          if (courseRec) {
            enrollments.push({
              studentId: st.id,
              courseId: courseRec.id,
            });
          }
        }
      });
    }
  }

  // Deduplicate and insert enrollments
  const uniqueEnrollments = [];
  const seenEnrollment = new Set();
  for (const e of enrollments) {
    const pair = `${e.studentId}_${e.courseId}`;
    if (!seenEnrollment.has(pair)) {
      seenEnrollment.add(pair);
      uniqueEnrollments.push(e);
    }
  }

  console.log(`📝 Inserting ${uniqueEnrollments.length} student course enrollments...`);
  await prisma.enrollment.createMany({ data: uniqueEnrollments });

  // 8. Create Realistic Sample Leave Requests & Notifications
  console.log('📄 Creating realistic sample leave requests and notifications...');
  const sampleStudent = createdStudents[0]; // 66000001
  const studentEnrollments = await prisma.enrollment.findMany({
    where: { studentId: sampleStudent.id },
    include: { course: true },
  });

  if (studentEnrollments.length > 0) {
    const c1 = studentEnrollments[0].course;
    const leave1 = await prisma.leaveRequest.create({
      data: {
        studentId: sampleStudent.id,
        courseId: c1.id,
        type: 'ลาป่วย',
        period: 'เต็มคาบเรียน 3 ชั่วโมง',
        startDate: '2026-08-20',
        endDate: '2026-08-20',
        reason: 'มีอาการไข้หวัด พักรักษาตัวที่บ้านตามแพทย์สั่ง',
        status: 'อนุมัติ',
        teacherComment: 'อนุมัติการลาตามระเบียบเรียบร้อย',
      },
    });

    if (c1.teacherId) {
      await prisma.notification.create({
        data: {
          userId: c1.teacherId,
          message: `${sampleStudent.name} ยื่นคำร้องลา "${c1.name}" (${leave1.type})`,
          link: '/teacher/requests',
        },
      });
    }
    await prisma.notification.create({
      data: {
        userId: sampleStudent.id,
        message: `คำร้องลา "${c1.name}" ได้รับการอนุมัติแล้ว`,
        link: '/student?tab=history',
        read: true,
      },
    });
  }

  // Add a pending leave for another student to test Teacher approval queue
  if (createdStudents.length > 8) {
    const student2 = createdStudents[8]; // 67000001
    const st2Enrolls = await prisma.enrollment.findMany({
      where: { studentId: student2.id },
      include: { course: true },
    });
    if (st2Enrolls.length > 0) {
      const c2 = st2Enrolls[0].course;
      const leave2 = await prisma.leaveRequest.create({
        data: {
          studentId: student2.id,
          courseId: c2.id,
          type: 'ลากิจส่วนตัว',
          period: 'เต็มคาบเรียน 3 ชั่วโมง',
          startDate: '2026-09-02',
          endDate: '2026-09-02',
          reason: 'ติดภารกิจครอบครัวจำเป็นเร่งด่วน',
          status: 'รออนุมัติ',
        },
      });
      if (c2.teacherId) {
        await prisma.notification.create({
          data: {
            userId: c2.teacherId,
            message: `${student2.name} ยื่นคำร้องลา "${c2.name}" (${leave2.type}) รอการพิจารณา`,
            link: '/teacher/requests',
          },
        });
      }
    }
  }

  // 9. Create Sample Admin Helpdesk Ticket
  await prisma.ticket.create({
    data: {
      userId: sampleStudent.id,
      userName: sampleStudent.name,
      subject: 'สอบถามเรื่องการนับเปอร์เซ็นต์เวลาเรียน',
      message: 'หากลาป่วยที่มีใบรับรองแพทย์ จะถูกนำมาคิดในโควต้า 20% หรือไม่ครับ',
      status: 'ตอบกลับแล้ว',
      reply: 'การลาป่วยที่มีใบรับรองแพทย์และได้รับอนุมัติจากอาจารย์ จะไม่ถือเป็นการขาดเรียนครับ',
    },
  });

  // 10. Generate updated user-credentials.xlsx
  console.log('📊 Generating updated user-credentials.xlsx workbook...');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BUU Take A Leave - Google Drive Importer';
  workbook.created = new Date();

  function addSheet(name, columns, rows) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = columns;
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7749BC' } };
    sheet.getRow(1).alignment = { vertical: 'middle' };
    return sheet;
  }

  addSheet(
    'แอดมิน (Admin)',
    [
      { header: 'ชื่อ-สกุล', key: 'name', width: 28 },
      { header: 'อีเมล (Username)', key: 'email', width: 30 },
      { header: 'รหัสผ่าน', key: 'password', width: 14 },
    ],
    [{ name: admin.name, email: admin.email, password: PASSWORD_PLAIN }]
  );

  addSheet(
    'อาจารย์ (Teachers)',
    [
      { header: 'ชื่อ-สกุล', key: 'name', width: 30 },
      { header: 'อีเมล (Username)', key: 'email', width: 32 },
      { header: 'รหัสผ่าน', key: 'password', width: 12 },
      { header: 'วิชาและภาระงานที่สอน', key: 'subjects', width: 65 },
    ],
    Object.values(teacherRows).map((tr) => ({
      name: tr.name,
      email: tr.email,
      password: tr.password,
      subjects: tr.subjects.join(' | '),
    }))
  );

  addSheet(
    'นิสิต (Students)',
    [
      { header: 'ชื่อ-สกุล', key: 'name', width: 24 },
      { header: 'รหัสนิสิต', key: 'studentId', width: 14 },
      { header: 'รุ่น', key: 'cohort', width: 10 },
      { header: 'อีเมล (Username)', key: 'email', width: 30 },
      { header: 'รหัสผ่าน', key: 'password', width: 12 },
    ],
    studentRows
  );

  const credPath1 = path.join(__dirname, '..', 'user-credentials.xlsx');
  await workbook.xlsx.writeFile(credPath1);
  console.log(`✅ Saved credentials to: ${credPath1}`);

  console.log('\n=============================================');
  console.log('🎉 Google Drive Data Import Succeeded!');
  console.log(`- อาจารย์: ${Object.keys(teacherUsers).length} ท่าน (ชื่อ-นามสกุลจริงตามภาควิชา)`);
  console.log(`- รายวิชาทั้งหมด: ${courseMap.size} กลุ่มเรียน (ครอบคลุมทั้ง เทอม 1/2569 และ เทอม 2/2569)`);
  console.log(`- นิสิต: ${createdStudents.length} คน (4 รุ่น 66-69 x 8 คน)`);
  console.log(`- การลงทะเบียนเรียน: ${uniqueEnrollments.length} รายการ`);
  console.log(`- รหัสผ่านทุกบัญชี: ${PASSWORD_PLAIN}`);
  console.log('=============================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
