// ข้อมูลตั้งต้นสำหรับใช้งานจริง — รายวิชา/อาจารย์/วัน-เวลาเรียน อ้างอิงจากไฟล์
// "ประกาศ รายวิชาลงทะเบียนสำหรับนิสิต 1-69.pdf" (เทอม 1/2569, รหัสนิสิต 66-69)
// ไฟล์ประกาศไม่มีรายชื่อนิสิตจริงเป็นรายบุคคล จึงสร้างบัญชีนิสิตตัวอย่างต่อรุ่นไว้ให้ทดสอบระบบได้ครบ
// ชื่ออาจารย์ในไฟล์เป็นชื่อย่อ (ไม่มีอีเมลจริง) จึงออกอีเมลชั่วคราวให้ - ควรเปลี่ยนเป็นอีเมลจริงเมื่อได้ข้อมูลจากทางคณะ
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();

const PASSWORD_PLAIN = '1234';
const TERM = '1/2569';

// ---------- อาจารย์ผู้สอน (8 คน ตามชื่อย่อในไฟล์ประกาศ) ----------
const TEACHERS = [
  { key: 'teeradech', email: 'teacher-teeradech@buu.ac.th', name: 'ดร.ธีรเดช' },
  { key: 'wannaprapa', email: 'teacher-wannaprapa@buu.ac.th', name: 'ผศ.วรรณประภา' },
  { key: 'khwanchadin', email: 'teacher-khwanchadin@buu.ac.th', name: 'ผศ.ดร.ขวัญชฎิล' },
  { key: 'chatchapon', email: 'teacher-chatchapon@buu.ac.th', name: 'ผศ.ดร.ฉัชพน' },
  { key: 'srihathai', email: 'teacher-srihathai@buu.ac.th', name: 'ผศ.ดร.ศรีหทัย' },
  { key: 'akara', email: 'teacher-akara@buu.ac.th', name: 'ผศ.ดร.อัครา' },
  { key: 'somruethai', email: 'teacher-somruethai@buu.ac.th', name: 'อ.สมฤทัย' },
  { key: 'preeyanuch', email: 'teacher-preeyanuch@buu.ac.th', name: 'ผศ.ดร.ปรียานุช' },
];

// ---------- รายวิชาทั้งหมด (แต่ละกลุ่มเรียนคือ 1 แถว) ----------
// group: '' = ไม่มีกลุ่มเรียนเฉพาะ (วิชาศึกษาทั่วไป จัดตารางผ่านระบบ Reg ของมหาวิทยาลัยเอง)
const COURSES = [
  // รหัส 66
  { code: '24543164', name: 'Seminar on Current Issues and Trend in Information Science', group: '01', day: 'FR', time: '13:00-15:50', teacher: 'teeradech' },
  { code: '24543164', name: 'Seminar on Current Issues and Trend in Information Science', group: '02', day: 'FR', time: '09:00-11:50', teacher: 'teeradech' },
  { code: '24545164', name: 'Library of Congress Classification', group: '01', day: 'WE', time: '09:00-11:50', teacher: 'wannaprapa' },
  { code: '24545164', name: 'Library of Congress Classification', group: '02', day: 'WE', time: '13:00-15:50', teacher: 'wannaprapa' },
  { code: '24545464', name: 'Research and Statistics in Information Studies', group: '01', day: 'WE', time: '13:00-16:50', teacher: 'khwanchadin' },
  { code: '24545464', name: 'Research and Statistics in Information Studies', group: '02', day: 'WE', time: '08:00-11:50', teacher: 'khwanchadin' },
  { code: '24537264', name: 'Web Design for Information Work', group: '01', day: 'FR', time: '08:00-11:50', teacher: 'chatchapon' },
  { code: '24537264', name: 'Web Design for Information Work', group: '02', day: 'FR', time: '13:00-16:50', teacher: 'chatchapon' },
  { code: '24549164', name: 'Pre Cooperative Education', group: '01', day: 'TH', time: '08:00-11:50', teacher: 'srihathai' },
  { code: '24549164', name: 'Pre Cooperative Education', group: '02', day: 'TH', time: '08:00-11:50', teacher: 'teeradech' },
  { code: '24527364', name: 'Data Communication and Computer Networks', group: '01', day: 'TU', time: '13:00-15:50', teacher: 'chatchapon' }, // เลือก 1 ใน 2 (รหัส 66)
  { code: '24531464', name: 'Information for Children and Young Adults', group: '01', day: 'TU', time: '09:00-11:50', teacher: 'khwanchadin' }, // เลือก 1 ใน 2 (รหัส 66)

  // รหัส 67
  { code: '89539764', name: 'Entrepreneurship in the 21st Century', group: '', day: null, time: null, teacher: null },
  { code: '24527664', name: 'Information Systems Analysis and Design', group: '01', day: 'MO', time: '13:00-15:50', teacher: 'akara' },
  { code: '24527664', name: 'Information Systems Analysis and Design', group: '02', day: 'MO', time: '09:00-11:50', teacher: 'akara' },
  { code: '24535164', name: 'Organization of Information Resources', group: '01', day: 'TH', time: '09:00-11:50', teacher: 'somruethai' },
  { code: '24535164', name: 'Organization of Information Resources', group: '02', day: 'TH', time: '16:00-18:50', teacher: 'somruethai' },
  { code: '24537364', name: 'Library Automation Systems', group: '01', day: 'MO', time: '08:00-11:50', teacher: 'preeyanuch' },
  { code: '24537364', name: 'Library Automation Systems', group: '02', day: 'MO', time: '13:00-16:50', teacher: 'preeyanuch' },
  { code: '24527364', name: 'Data Communication and Computer Networks', group: '02', day: 'TU', time: '17:00-19:50', teacher: 'chatchapon' }, // เลือก 2 ใน 4 (รหัส 67)
  { code: '24527564', name: 'Open Source Program Application', group: '01', day: 'TU', time: '13:00-16:50', teacher: 'akara' },
  { code: '24531264', name: 'Information Behavior and Users', group: '01', day: 'FR', time: '09:00-11:50', teacher: 'somruethai' },
  { code: '24521764', name: 'Knowledge Management', group: '01', day: 'TU', time: '09:00-11:50', teacher: 'srihathai' },

  // รหัส 68
  { code: '89510764', name: 'Love, Sex and Health', group: '', day: null, time: null, teacher: null },
  { code: '89520264', name: 'Thinking Process for Understanding Oneself and Others', group: '', day: null, time: null, teacher: null },
  { code: '89520364', name: 'Creative Activities', group: '', day: null, time: null, teacher: null },
  { code: '89530064', name: 'Opportunities and Challenges for Future Careers', group: '', day: null, time: null, teacher: null },
  { code: '24534164', name: 'English for Information Professional', group: '01', day: 'WE', time: '09:00-11:50', teacher: 'preeyanuch' },
  { code: '24534164', name: 'English for Information Professional', group: '02', day: 'WE', time: '13:00-15:50', teacher: 'preeyanuch' },
  { code: '24527564', name: 'Open Source Program Application', group: '02', day: 'TU', time: '08:00-11:50', teacher: 'akara' }, // เลือก 2 ใน 4 (รหัส 68)
  { code: '24531264', name: 'Information Behavior and Users', group: '02', day: 'FR', time: '13:00-15:50', teacher: 'somruethai' },
  { code: '24521764', name: 'Knowledge Management', group: '02', day: 'TU', time: '16:00-18:50', teacher: 'srihathai' },
  { code: '24531464', name: 'Information for Children and Young Adults', group: '02', day: 'TU', time: '13:00-15:50', teacher: 'khwanchadin' },

  // รหัส 69
  { code: '89510169', name: 'English for Everyday Communication', group: '', day: null, time: null, teacher: null },
  { code: '89520169', name: 'Creativity in Problem Solving', group: '', day: null, time: null, teacher: null },
  { code: '89520269', name: 'Smart Digital and Artificial Intelligence Usage Skills', group: '', day: null, time: null, teacher: null },
  { code: '24514169', name: 'Reading for Information Professional', group: '01', day: 'MO', time: '09:00-11:50', teacher: 'srihathai' },
  { code: '24514169', name: 'Reading for Information Professional', group: '02', day: 'MO', time: '13:00-15:50', teacher: 'srihathai' },
  { code: '24516269', name: 'Introduction to Information Sciences', group: '01', day: 'TU', time: '09:00-11:50', teacher: 'teeradech' },
  { code: '24516269', name: 'Introduction to Information Sciences', group: '02', day: 'TU', time: '17:00-19:50', teacher: 'teeradech' },
  { code: '24515169', name: 'Digital Information and Record Management', group: '01', day: 'MO', time: '13:00-15:50', teacher: 'wannaprapa' },
  { code: '24515169', name: 'Digital Information and Record Management', group: '02', day: 'MO', time: '09:00-11:50', teacher: 'wannaprapa' },
];

// ---------- ความต้องการลงทะเบียนต่อรุ่น ----------
const COHORTS = {
  66: {
    required: ['24543164', '24545164', '24545464', '24537264', '24549164'],
    electives: [{ pick: 1, options: ['24527364#01', '24531464#01'] }],
  },
  67: {
    required: ['89539764', '24527664', '24535164', '24537364'],
    electives: [{ pick: 2, options: ['24527364#02', '24527564#01', '24531264#01', '24521764#01'] }],
  },
  68: {
    required: ['89510764', '89520264', '89520364', '89530064', '24534164'],
    electives: [{ pick: 2, options: ['24527564#02', '24531264#02', '24521764#02', '24531464#02'] }],
  },
  69: {
    required: ['89510169', '89520169', '89520269', '24514169', '24516269', '24515169'],
    electives: [],
  },
};

const STUDENTS_PER_COHORT = 8;
// รายชื่อเต็ม 32 ชื่อ ไม่ซ้ำกันเลยทั้งหมด (4 รุ่น x 8 คน ใช้คนละชื่อ)
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
  const password = await bcrypt.hash(PASSWORD_PLAIN, 10);
  const adminRows = [];
  const teacherRowList = [];
  const studentRows = [];

  // ล้างข้อมูลเดิมทั้งหมด (เรียงตามลำดับ foreign key)
  await prisma.notification.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // ---------- แอดมิน ----------
  const admin = await prisma.user.create({
    data: { email: 'admin@buu.ac.th', password, name: 'ผู้ดูแลระบบ', role: 'admin' },
  });
  adminRows.push({ name: admin.name, email: admin.email, password: PASSWORD_PLAIN });

  // ---------- อาจารย์ ----------
  const teacherByKey = {};
  const teacherRows = {}; // key -> แถวในชีต (เติมคอลัมน์ "วิชาที่สอน" หลังสร้างรายวิชาเสร็จ)
  for (const t of TEACHERS) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        password,
        name: t.name,
        role: 'teacher',
        faculty: 'คณะวิทยาการสารสนเทศ',
        major: 'ภาควิชาการจัดการสารสนเทศ',
      },
    });
    teacherByKey[t.key] = user;
    const row = { name: t.name, email: t.email, password: PASSWORD_PLAIN, subjects: '', note: 'อีเมลชั่วคราว รอเปลี่ยนเป็นอีเมลจริง' };
    teacherRows[t.key] = row;
    teacherRowList.push(row);
  }

  // ---------- รายวิชา ----------
  const courseByKey = {}; // `${code}#${group}` -> course record
  for (const c of COURSES) {
    const teacher = c.teacher ? teacherByKey[c.teacher] : null;
    const course = await prisma.course.create({
      data: {
        code: c.code,
        name: c.name,
        term: TERM,
        group: c.group,
        totalSessions: 15,
        teacherId: teacher?.id || null,
        teacherName: teacher?.name || null,
        day: c.day,
        time: c.time,
      },
    });
    courseByKey[`${c.code}#${c.group}`] = course;
    if (c.teacher) {
      const row = teacherRows[c.teacher];
      const label = c.group ? `${c.code}-${c.group}` : c.code;
      row.subjects = row.subjects ? `${row.subjects}, ${label}` : label;
    }
  }

  // ---------- นิสิต + ลงทะเบียนตามรุ่น ----------
  const students = [];
  const enrollments = [];
  let nameIdx = 0;
  for (const cohort of Object.keys(COHORTS)) {
    const spec = COHORTS[cohort];
    const cohortStudents = [];
    for (let i = 0; i < STUDENTS_PER_COHORT; i++) {
      const name = STUDENT_NAMES[nameIdx];
      nameIdx++;
      const code = `${cohort}${String(i + 1).padStart(6, '0')}`;
      const student = await prisma.user.create({
        data: {
          email: `${code}@go.buu.ac.th`,
          password,
          name,
          role: 'student',
          studentId: code,
          faculty: 'คณะวิทยาการสารสนเทศ',
          major: 'การจัดการสารสนเทศ',
        },
      });
      studentRows.push({ name: student.name, studentId: code, cohort: `รุ่น ${cohort}`, email: student.email, password: PASSWORD_PLAIN });
      cohortStudents.push(student);
      students.push(student);
    }

    // วิชาบังคับ: ถ้ามีหลายกลุ่มเรียน สลับกลุ่มตามลำดับนิสิตเพื่อกระจายนิสิตในแต่ละกลุ่ม
    for (const code of spec.required) {
      const groupsForCode = COURSES.filter((c) => c.code === code);
      cohortStudents.forEach((student, i) => {
        const group = groupsForCode[i % groupsForCode.length].group;
        const course = courseByKey[`${code}#${group}`];
        if (course) enrollments.push({ studentId: student.id, courseId: course.id });
      });
    }

    // วิชาเลือก: หมุนเวียนตัวเลือกให้นิสิตแต่ละคนเลือกครบตามจำนวนที่กำหนด
    for (const elective of spec.electives) {
      cohortStudents.forEach((student, i) => {
        for (let p = 0; p < elective.pick; p++) {
          const optionKey = elective.options[(i + p) % elective.options.length];
          const course = courseByKey[optionKey];
          if (course) enrollments.push({ studentId: student.id, courseId: course.id });
        }
      });
    }
  }

  if (enrollments.length) {
    await prisma.enrollment.createMany({ data: enrollments });
  }

  // ---------- ใบลาตัวอย่าง (สำหรับทดสอบคิวอนุมัติ + ประวัติการอนุมัติ) ----------
  const LEAVE_TYPES = ['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'อื่นๆ'];
  const PERIODS = ['เต็มคาบเรียน 3 ชั่วโมง', 'ครึ่งคาบแรก 1.5 ชั่วโมง', 'ครึ่งคาบหลัง 1.5 ชั่วโมง'];
  const REASONS = [
    'มีนัดพบแพทย์ตามใบนัด',
    'ป่วยเป็นไข้หวัดใหญ่ พักรักษาตัวที่บ้าน',
    'ติดภารกิจครอบครัวเร่งด่วน',
    'เป็นตัวแทนเข้าร่วมกิจกรรมของมหาวิทยาลัย',
  ];

  const leaveSpecs = [
    { student: students[0], courseKey: '24543164#01', type: 0, period: 0, reason: 1, date: '2026-08-20', status: 'อนุมัติ', comment: 'อนุมัติการลาตามระเบียบเรียบร้อย' },
    { student: students[1], courseKey: '24545164#01', type: 1, period: 1, reason: 2, date: '2026-08-25', status: 'รออนุมัติ' },
    { student: students[8], courseKey: '24527664#01', type: 0, period: 0, reason: 0, date: '2026-08-18', status: 'ไม่อนุมัติ', comment: 'เอกสารประกอบไม่ครบถ้วนตามเกณฑ์' },
    { student: students[9], courseKey: '24535164#01', type: 2, period: 2, reason: 3, date: '2026-08-22', status: 'อนุมัติ', comment: 'อนุมัติเนื่องจากเป็นตัวแทนเข้าร่วมกิจกรรมมหาวิทยาลัย' },
    { student: students[16], courseKey: '24534164#01', type: 0, period: 0, reason: 1, date: '2026-08-27', status: 'รออนุมัติ' },
    { student: students[17], courseKey: '24534164#02', type: 1, period: 0, reason: 2, date: '2026-08-19', status: 'อนุมัติ', comment: 'อนุมัติการลาตามระเบียบเรียบร้อย' },
    { student: students[24], courseKey: '24514169#01', type: 3, period: 1, reason: 0, date: '2026-08-21', status: 'ไม่อนุมัติ', comment: 'เหตุผลไม่เข้าเกณฑ์การลาตามระเบียบ' },
    { student: students[25], courseKey: '24516269#01', type: 0, period: 0, reason: 1, date: '2026-08-28', status: 'รออนุมัติ' },
  ];

  const leaves = [];
  for (const spec of leaveSpecs) {
    const course = courseByKey[spec.courseKey];
    const leave = await prisma.leaveRequest.create({
      data: {
        studentId: spec.student.id,
        courseId: course.id,
        type: LEAVE_TYPES[spec.type],
        period: PERIODS[spec.period],
        startDate: spec.date,
        endDate: spec.date,
        reason: REASONS[spec.reason],
        attachment: null,
        status: spec.status,
        teacherComment: spec.comment || null,
      },
    });
    leaves.push({ leave, course, student: spec.student });
  }

  // ---------- การแจ้งเตือนจากใบลาตัวอย่าง ----------
  for (const { leave, course, student } of leaves) {
    if (leave.status === 'รออนุมัติ') {
      if (course.teacherId) {
        await prisma.notification.create({
          data: {
            userId: course.teacherId,
            message: `${student.name} ยื่นคำร้องลา "${course.name}" (${leave.type})`,
            link: '/teacher',
          },
        });
      }
    } else {
      const suffix = leave.teacherComment ? ` — หมายเหตุ: ${leave.teacherComment}` : '';
      await prisma.notification.create({
        data: {
          userId: student.id,
          message: `คำร้องลา "${course.name}" (${leave.type}) ถูก${leave.status}แล้ว${suffix}`,
          link: '/student',
          read: Math.random() > 0.5,
        },
      });
    }
  }

  // ---------- ตัวอย่างคำร้องแจ้งปัญหา ----------
  const ticket1 = await prisma.ticket.create({
    data: {
      userId: students[2].id,
      userName: students[2].name,
      subject: 'เข้าสู่ระบบไม่ได้',
      message: 'ลองเข้าสู่ระบบหลายครั้งแล้วขึ้นว่ารหัสผ่านไม่ถูกต้อง',
      status: 'ตอบกลับแล้ว',
      reply: 'ตรวจสอบให้แล้วครับ ระบบรีเซ็ตรหัสผ่านให้เรียบร้อย ลองเข้าสู่ระบบใหม่อีกครั้งได้เลยครับ',
    },
  });
  await prisma.ticket.create({
    data: {
      userId: teacherByKey.somruethai.id,
      userName: teacherByKey.somruethai.name,
      subject: 'ไฟล์แนบมีปัญหา',
      message: 'เปิดไฟล์แนบใบลาของนิสิตบางคนไม่ได้',
      status: 'เปิดเรื่อง',
    },
  });
  await prisma.ticket.create({
    data: {
      userId: students[20].id,
      userName: students[20].name,
      subject: 'ข้อมูลเวลาเรียนไม่ถูกต้อง',
      message: 'เปอร์เซ็นต์เวลาเรียนที่แสดงในระบบไม่ตรงกับที่คำนวณเอง',
      status: 'เปิดเรื่อง',
    },
  });
  await prisma.notification.create({
    data: {
      userId: ticket1.userId,
      message: `ทีมงานตอบกลับคำร้อง "${ticket1.subject}" แล้ว`,
      link: '/support',
    },
  });

  // ---------- ไฟล์รายชื่อผู้ใช้ + รหัสผ่านทั้งหมด (.xlsx แยกชีตตามบทบาท) ----------
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BUU e-Leave seed script';
  workbook.created = new Date();

  function addSheet(name, columns, rows) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = columns;
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7749BC' } };
    sheet.getRow(1).alignment = { vertical: 'middle' };
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
    return sheet;
  }

  addSheet(
    'แอดมิน',
    [
      { header: 'ชื่อ-สกุล', key: 'name', width: 28 },
      { header: 'อีเมล (Username)', key: 'email', width: 30 },
      { header: 'รหัสผ่าน', key: 'password', width: 14 },
    ],
    adminRows
  );

  addSheet(
    'อาจารย์',
    [
      { header: 'ชื่อ-สกุล', key: 'name', width: 24 },
      { header: 'อีเมล (Username)', key: 'email', width: 32 },
      { header: 'รหัสผ่าน', key: 'password', width: 12 },
      { header: 'วิชาที่สอน (รหัสวิชา-กลุ่ม)', key: 'subjects', width: 55 },
      { header: 'หมายเหตุ', key: 'note', width: 30 },
    ],
    teacherRowList
  );

  addSheet(
    'นิสิต',
    [
      { header: 'ชื่อ-สกุล', key: 'name', width: 24 },
      { header: 'รหัสนิสิต', key: 'studentId', width: 14 },
      { header: 'รุ่น', key: 'cohort', width: 10 },
      { header: 'อีเมล (Username)', key: 'email', width: 30 },
      { header: 'รหัสผ่าน', key: 'password', width: 12 },
    ],
    studentRows
  );

  const outPath = path.join(__dirname, '..', 'user-credentials.xlsx');
  await workbook.xlsx.writeFile(outPath);

  console.log('Seed complete.');
  console.log(`- แอดมิน 1 คน, อาจารย์ ${TEACHERS.length} คน, นิสิต ${students.length} คน (${Object.keys(COHORTS).length} รุ่น x ${STUDENTS_PER_COHORT} คน)`);
  console.log(`- รายวิชา ${COURSES.length} กลุ่มเรียน, เทอม ${TERM}`);
  console.log(`- รหัสผ่านทุกบัญชี: ${PASSWORD_PLAIN}`);
  console.log(`- ไฟล์รายชื่อผู้ใช้ทั้งหมด (แยก 3 ชีต): ${outPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
