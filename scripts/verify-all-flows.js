// scripts/verify-all-flows.js
// Automated End-to-End API and Database Flow Verification for BUU Take A Leave

const { prisma } = require('../lib/prisma.js');
const {
  listCoursesForTeacher,
  listLeavesForTeacher,
  listCoursesForStudent,
  listLeavesForStudent,
  addLeave,
  setLeaveStatus,
  cancelLeave,
  getAttendanceSummary,
  addTicket,
  listTicketsForUser,
  replyTicket,
  getUserById,
  updateUserProfile,
} = require('../lib/db.js');
const { getTeacherCoursesAndRoster } = require('../lib/teacherData.js');
const ExcelJS = require('exceljs');

async function runComprehensiveVerification() {
  console.log('🚀 Starting Comprehensive BUU Take A Leave System Verification...\n');
  let passCount = 0;
  let totalCount = 0;

  function assert(condition, testName) {
    totalCount++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // -------------------------------------------------------------
  // Test 1: User Database & Accounts Integrity
  // -------------------------------------------------------------
  console.log('📋 Test Group 1: Users & Authentication Integrity');
  const student = await prisma.user.findFirst({ where: { role: 'student' } });
  assert(!!student, `Found student in database: ${student?.name} (${student?.email})`);

  const teacherTeeradech = await prisma.user.findFirst({ where: { email: 'teacher-teeradech@buu.ac.th' } });
  assert(!!teacherTeeradech, `Found teacher Dr. Teeradech in database: ${teacherTeeradech?.name}`);

  const teacherAkara = await prisma.user.findFirst({ where: { email: 'teacher-akara@buu.ac.th' } });
  assert(!!teacherAkara, `Found teacher Dr. Akara in database: ${teacherAkara?.name}`);

  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  assert(!!admin, `Found admin in database: ${admin?.name} (${admin?.email})`);

  // -------------------------------------------------------------
  // Test 2: Courses & Enrollment
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 2: Courses & Enrollment Integrity');
  const teeradechCourses = await listCoursesForTeacher(teacherTeeradech.id);
  assert(teeradechCourses.length >= 4, `Dr. Teeradech teaches ${teeradechCourses.length} courses`);

  const akaraCourses = await listCoursesForTeacher(teacherAkara.id);
  assert(akaraCourses.length >= 6, `Dr. Akara teaches ${akaraCourses.length} courses`);

  const studentCourses = await listCoursesForStudent(student.id);
  assert(studentCourses.length > 0, `Student is enrolled in ${studentCourses.length} courses`);

  // -------------------------------------------------------------
  // Test 3: Leave Submission Flow (Student -> Neon DB)
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 3: Leave Submission & Quota Calculation');
  const targetCourse = teeradechCourses[0];
  const newLeave = await addLeave(student.id, {
    courseId: targetCourse.id,
    type: 'ลาป่วย',
    period: 'เต็มคาบเรียน 3 ชั่วโมง',
    startDate: '2026-10-20',
    endDate: '2026-10-20',
    reason: 'ทดสอบการส่งคำร้องลาเรียนระบบอัตโนมัติ (Integration Test)',
    attachment: 'sample-medical-cert.png',
  });
  assert(!!newLeave && !!newLeave.id, `Leave submitted successfully with ID: ${newLeave?.id}`);

  const studentLeaves = await listLeavesForStudent(student.id);
  const foundLeave = studentLeaves.find((l) => String(l.id) === String(newLeave.id));
  assert(!!foundLeave, `Newly submitted leave appears in student history`);

  const summary = await getAttendanceSummary(student.id, targetCourse.id);
  assert(summary !== null && summary.totalSessions > 0, `Attendance summary calculated correctly for course: ${targetCourse.code}`);

  // -------------------------------------------------------------
  // Test 4: Teacher Leave Review & Real-time Update Flow
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 4: Teacher Leave Review & Action Flow');
  const teacherLeaves = await listLeavesForTeacher(teacherTeeradech.id);
  const teacherFoundLeave = teacherLeaves.find((l) => String(l.id) === String(newLeave.id));
  assert(!!teacherFoundLeave, `Teacher sees the newly submitted leave in pending review queue`);

  // Teacher approves the leave with comment
  const approved = await setLeaveStatus(newLeave.id, 'อนุมัติ', 'อนุมัติการลาตามแบบทดสอบอัตโนมัติ');
  assert(approved?.status === 'อนุมัติ', `Teacher successfully approved leave #${newLeave.id}`);
  assert(approved?.teacherComment === 'อนุมัติการลาตามแบบทดสอบอัตโนมัติ', `Teacher comment persisted: "${approved?.teacherComment}"`);

  // -------------------------------------------------------------
  // Test 5: Leave Cancellation Constraint Flow
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 5: Leave Cancellation Integrity');
  // Approved leave should NOT be cancellable by student
  const cancelAttemptOnApproved = await cancelLeave(newLeave.id, student.id);
  assert(!cancelAttemptOnApproved || cancelAttemptOnApproved.status !== 'ยกเลิก', `Approved leave correctly cannot be cancelled by student`);

  // Submit another pending leave to test successful cancellation
  const cancelTestLeave = await addLeave(student.id, {
    courseId: targetCourse.id,
    type: 'ลากิจส่วนตัว',
    period: 'เต็มคาบเรียน 3 ชั่วโมง',
    startDate: '2026-10-25',
    endDate: '2026-10-25',
    reason: 'ทดสอบยกเลิกคำร้อง',
  });
  assert(!!cancelTestLeave, `Created test leave #${cancelTestLeave.id} for cancellation`);

  const cancelled = await cancelLeave(cancelTestLeave.id, student.id);
  assert(cancelled?.status === 'ยกเลิก', `Pending leave #${cancelTestLeave.id} successfully cancelled`);

  // -------------------------------------------------------------
  // Test 6: Teaching Materials Flow
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 6: Teaching Materials Flow');
  const materials = await prisma.teachingMaterial.findMany({ where: { courseId: targetCourse.id } });
  assert(materials.length > 0, `Teaching materials found for course ${targetCourse.name}: ${materials.length} files`);
  assert(materials[0].fileName.length > 0 && materials[0].fileUrl.length > 0, `Teaching material has valid fileName and fileUrl`);

  // -------------------------------------------------------------
  // Test 7: Support Ticket Flow
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 7: Support Ticket & Helpdesk Flow');
  const ticket = await addTicket(student.id, 'ทดสอบเปิด Ticket ผ่านระบบอัตโนมัติ', 'ระบบทำงานได้เสถียรและรวดเร็วมาก');
  assert(!!ticket && ticket.id > 0, `Support ticket created successfully with ID: ${ticket?.id}`);

  const userTickets = await listTicketsForUser(student.id);
  assert(userTickets.some((t) => t.id === ticket.id), `Ticket appears in student tickets list`);

  const repliedTicket = await replyTicket(ticket.id, 'ขอบคุณสำหรับข้อเสนอแนะ ทีมงานได้รับเรื่องเรียบร้อยแล้ว');
  assert(repliedTicket?.status === 'ตอบกลับแล้ว', `Admin replied to ticket, status changed to: ${repliedTicket?.status}`);

  // -------------------------------------------------------------
  // Test 8: Excel Report Generation (ExcelJS)
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 8: ExcelJS Report Generation Flow');
  const { courses: tCourses, rosterByCourse } = await getTeacherCoursesAndRoster(teacherTeeradech.id);
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Attendance');
  ws.columns = [
    { header: 'รหัสวิชา', key: 'code', width: 14 },
    { header: 'ชื่อรายวิชา', key: 'name', width: 30 },
  ];
  tCourses.forEach((c) => ws.addRow({ code: c.code, name: c.name }));
  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  assert(xlsxBuffer.length > 1000, `ExcelJS generated valid .xlsx binary buffer of size: ${xlsxBuffer.length} bytes`);

  // -------------------------------------------------------------
  // Test 9: User Profile Update & Persistence Flow
  // -------------------------------------------------------------
  console.log('\n📋 Test Group 9: Profile Update & Persistence Flow');
  const updatedUser = await updateUserProfile(student, { phone: '0812345678', bio: 'นิสิตทดสอบระบบ BUU Take A Leave' });
  assert(updatedUser?.phone === '0812345678', `Student phone updated in database: ${updatedUser?.phone}`);
  const reloaded = await getUserById(student.id);
  assert(reloaded?.phone === '0812345678', `Student phone verified persistent after reload: ${reloaded?.phone}`);

  console.log(`\n🎉 ALL TESTS PASSED! (${passCount}/${totalCount} assertions verified successfully)\n`);
}

runComprehensiveVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  });
