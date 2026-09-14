import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const LEAVE_QUOTA_RATIO = 0.2; // ลาเกิน 20% ของจำนวนครั้งเรียนทั้งหมด = เกินโควต้า

// ---------- users / auth ----------
export async function findUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password);
  return ok ? user : null;
}
export async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}
export function isUniversityEmail(email) {
  return /@(go\.)?buu\.ac\.th$/i.test(String(email || '').trim());
}

// ---------- courses ----------
// select เฉพาะฟิลด์ที่จำเป็นของอาจารย์ ไม่ดึงทั้ง object (กัน password hash หลุดไปกับ course.teacher)
const TEACHER_SELECT = { select: { id: true, name: true } };

export async function listAllCourses() {
  return prisma.course.findMany({ include: { teacher: TEACHER_SELECT }, orderBy: { createdAt: 'desc' } });
}

export async function getCourse(id) {
  return prisma.course.findUnique({ where: { id }, include: { teacher: TEACHER_SELECT } });
}
export async function listCoursesForStudent(studentId) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: { course: { include: { teacher: TEACHER_SELECT } } },
  });
  return enrollments.map((e) => e.course);
}
export async function listCoursesForTeacher(teacherId) {
  return prisma.course.findMany({ where: { teacherId } });
}
export async function listStudentsInCourse(courseId) {
  const enrollments = await prisma.enrollment.findMany({ where: { courseId }, include: { student: true } });
  return enrollments.map((e) => e.student);
}
export async function isEnrolled(studentId, courseId) {
  const e = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
  return !!e;
}

// ---------- leaves ----------
export async function listLeavesForStudent(studentId) {
  return prisma.leaveRequest.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
}
export async function listLeavesForTeacher(teacherId) {
  const courses = await listCoursesForTeacher(teacherId);
  const courseIds = courses.map((c) => c.id);
  return prisma.leaveRequest.findMany({ where: { courseId: { in: courseIds } }, orderBy: { createdAt: 'desc' } });
}
export async function listAllLeaves() {
  return prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } });
}
export async function getLeave(id) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  return prisma.leaveRequest.findUnique({ where: { id: numId } });
}
export async function getLeaveByAttachment(filename) {
  return prisma.leaveRequest.findFirst({ where: { attachment: filename } });
}
export async function addLeave(studentId, data) {
  const leave = await prisma.leaveRequest.create({
    data: {
      studentId,
      courseId: data.courseId,
      type: data.type,
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      attachment: data.attachment || null,
      status: 'รออนุมัติ',
    },
  });

  const course = await getCourse(data.courseId);
  const student = await getUserById(studentId);
  // บางวิชาอาจยังไม่มีอาจารย์ผู้สอนผูกไว้ในระบบ (teacherId เป็น null) จึงแจ้งเตือนไม่ได้
  if (course?.teacherId) {
    await addNotification(course.teacherId, `${student.name} ยื่นคำร้องลา "${course.name}" (${leave.type})`, '/teacher');
  }
  return leave;
}
export async function setLeaveStatus(id, status, comment) {
  const existing = await getLeave(id);
  if (!existing) return null;
  const leave = await prisma.leaveRequest.update({
    where: { id: existing.id },
    data: { status, teacherComment: comment || null },
  });
  const course = await getCourse(leave.courseId);
  const suffix = comment ? ` — หมายเหตุ: ${comment}` : '';
  const message =
    status === 'รออนุมัติ'
      ? `คำร้องลา "${course?.name || ''}" (${leave.type}) ถูกอาจารย์ยกเลิกการพิจารณา นำกลับไปรอพิจารณาใหม่${suffix}`
      : `คำร้องลา "${course?.name || ''}" (${leave.type}) ถูก${status}แล้ว${suffix}`;
  await addNotification(leave.studentId, message, '/student');
  return leave;
}

// นิสิตยกเลิกใบลาของตัวเองได้เฉพาะตอนที่ยังรออนุมัติอยู่ (กัน race กับตอนอาจารย์กดอนุมัติพร้อมกัน
// ด้วย updateMany ที่เช็คเงื่อนไขสถานะในตัว query เดียวกัน)
export async function cancelLeave(id, studentId) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  const result = await prisma.leaveRequest.updateMany({
    where: { id: numId, studentId, status: 'รออนุมัติ' },
    data: { status: 'ยกเลิก' },
  });
  if (result.count === 0) return null;
  return getLeave(numId);
}

// ส่งใบลาที่ยกเลิกไปแล้วซ้ำอีกครั้ง โดยอัปเดตทับแถวเดิม (ไม่สร้างแถวใหม่) เพื่อไม่ให้ประวัติรก
export async function resubmitLeave(id, studentId, data) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  const result = await prisma.leaveRequest.updateMany({
    where: { id: numId, studentId, status: 'ยกเลิก' },
    data: {
      courseId: data.courseId,
      type: data.type,
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      attachment: data.attachment || null,
      status: 'รออนุมัติ',
      createdAt: new Date(),
    },
  });
  if (result.count === 0) return null;

  const leave = await getLeave(numId);
  const course = await getCourse(leave.courseId);
  const student = await getUserById(studentId);
  if (course?.teacherId) {
    await addNotification(course.teacherId, `${student.name} ยื่นคำร้องลา "${course.name}" (${leave.type}) อีกครั้ง`, '/teacher');
  }
  return leave;
}

// จำนวนครั้งที่ลาอนุมัติแล้วของนิสิตในรายวิชา
export async function countApprovedLeaves(studentId, courseId) {
  return prisma.leaveRequest.count({ where: { studentId, courseId, status: 'อนุมัติ' } });
}

// สรุปเวลาเรียน/โควต้าของนิสิตในรายวิชา
export async function getAttendanceSummary(studentId, courseId) {
  const course = await getCourse(courseId);
  if (!course) return null;
  const approvedLeaves = await countApprovedLeaves(studentId, courseId);
  const attended = Math.max(course.totalSessions - approvedLeaves, 0);
  const percentage = Math.round((attended / course.totalSessions) * 100);
  const quotaLimit = Math.floor(course.totalSessions * LEAVE_QUOTA_RATIO);
  return {
    course,
    totalSessions: course.totalSessions,
    approvedLeaves,
    attended,
    percentage,
    quotaLimit,
    overQuota: approvedLeaves > quotaLimit,
  };
}

// ---------- notifications ----------
export async function addNotification(userId, message, link) {
  return prisma.notification.create({ data: { userId, message, link: link || null } });
}
export async function listNotifications(userId) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}
export async function markNotificationRead(id, userId) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  const note = await prisma.notification.findFirst({ where: { id: numId, userId } });
  if (!note) return null;
  return prisma.notification.update({ where: { id: note.id }, data: { read: true } });
}

// ---------- support tickets ----------
export async function addTicket(userId, subject, message) {
  const user = await getUserById(userId);
  return prisma.ticket.create({
    data: { userId, userName: user?.name || '', subject, message, status: 'เปิดเรื่อง' },
  });
}
export async function listTicketsForUser(userId) {
  return prisma.ticket.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}
export async function listAllTickets() {
  return prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
}
export async function replyTicket(id, reply) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  const ticket = await prisma.ticket.findUnique({ where: { id: numId } });
  if (!ticket) return null;
  const updated = await prisma.ticket.update({ where: { id: ticket.id }, data: { reply, status: 'ตอบกลับแล้ว' } });
  await addNotification(ticket.userId, `ทีมงานตอบกลับคำร้อง "${ticket.subject}" แล้ว`, '/support');
  return updated;
}
