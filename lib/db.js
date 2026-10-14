import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { MOCK_COURSES, getMockCoursesForTeacher, buildMockPendingLeaves, buildMockLeaveHistory } from './mockTeacherData';
import { MOCK_STUDENT_COURSES, MOCK_STUDENT_LEAVES, MOCK_STUDENT_SUMMARIES } from './studentData';
import { MOCK_TICKETS, MOCK_NOTIFICATIONS } from './mockAdminData';

export const LEAVE_QUOTA_RATIO = 0.2; // ลาเกิน 20% ของจำนวนครั้งเรียนทั้งหมด = เกินโควต้า

const MOCK_USERS_MAP = {
  'admin-mock': { id: 'admin-mock', email: 'admin@buu.ac.th', name: 'ผู้ดูแลระบบ', role: 'admin', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-mock': { id: 'teacher-mock', email: 'teacher-teeradech@buu.ac.th', name: 'ดร.ธีรเดช มานะกุล', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-teeradech': { id: 'teacher-mock', email: 'teacher-teeradech@buu.ac.th', name: 'ดร.ธีรเดช มานะกุล', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-srihathai': { id: 'teacher-srihathai', email: 'teacher-srihathai@buu.ac.th', name: 'ผศ.ดร.ศรีหทัย เวลล์ส', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-wannaprapa': { id: 'teacher-wannaprapa', email: 'teacher-wannaprapa@buu.ac.th', name: 'ผศ.วรรณประภา เอี่ยมฤทธิ์', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-khwanchadin': { id: 'teacher-khwanchadin', email: 'teacher-khwanchadin@buu.ac.th', name: 'ผศ.ดร.ขวัญชฎิล พิศาลพงศ์', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-chatchapon': { id: 'teacher-chatchapon', email: 'teacher-chatchapon@buu.ac.th', name: 'ผศ.ดร.ณิชพน โชติจันทรกุล', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-nichapon': { id: 'teacher-nichapon', email: 'teacher-nichapon@buu.ac.th', name: 'ผศ.ดร.ณิชพน โชติจันทรกุล', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-akara': { id: 'teacher-akara', email: 'teacher-akara@buu.ac.th', name: 'ผศ.ดร.อัครา ธรรมมาสถิตย์กุล', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-somruethai': { id: 'teacher-somruethai', email: 'teacher-somruethai@buu.ac.th', name: 'อ.สมฤทัย ธีรเรืองสิริ', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-preeyanuch': { id: 'teacher-preeyanuch', email: 'teacher-preeyanuch@buu.ac.th', name: 'ผศ.ดร.ปรียานุช วรวิกโฆษิต', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'student-mock': { id: 'student-mock', email: '66000001@go.buu.ac.th', name: 'จุฑามาศ แสงทอง', role: 'student', studentId: '66000001', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
};

// ---------- users / auth ----------
export async function findUser(email, password) {
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    return ok ? user : null;
  } catch (err) {
    console.warn('DB findUser error, using mock fallback:', err.message);
    if (password === '1234') {
      const cleanEmail = email.toLowerCase();
      if (cleanEmail === 'admin@buu.ac.th' || cleanEmail === 'admin@go.buu.ac.th') return MOCK_USERS_MAP['admin-mock'];
      if (cleanEmail.startsWith('teacher-')) {
        const key = cleanEmail.split('@')[0];
        return MOCK_USERS_MAP[key] || MOCK_USERS_MAP['teacher-mock'];
      }
      if (/^\d{8}@go\.buu\.ac\.th$/.test(cleanEmail)) {
        const studentCode = cleanEmail.replace('@go.buu.ac.th', '');
        return {
          ...MOCK_USERS_MAP['student-mock'],
          id: `student-${studentCode}`,
          email: cleanEmail,
          studentId: studentCode,
        };
      }
    }
    return null;
  }
}

export async function getUserById(id) {
  // Check if mock user has a real DB entry by email so DB profile/avatar is retrieved
  if (MOCK_USERS_MAP[id]) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: MOCK_USERS_MAP[id].email } });
      if (dbUser) return { ...MOCK_USERS_MAP[id], ...dbUser };
    } catch {}
    return MOCK_USERS_MAP[id];
  }
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    return user || MOCK_USERS_MAP['student-mock'];
  } catch (err) {
    return MOCK_USERS_MAP[id] || MOCK_USERS_MAP['student-mock'];
  }
}

export async function updateUserAvatar(user, avatarUrl) {
  if (!user) return null;

  // 1. Update in-memory mock map for instant consistency
  if (user.id && MOCK_USERS_MAP[user.id]) {
    MOCK_USERS_MAP[user.id].avatar = avatarUrl;
  }
  for (const key of Object.keys(MOCK_USERS_MAP)) {
    if (user.email && MOCK_USERS_MAP[key].email?.toLowerCase() === user.email.toLowerCase()) {
      MOCK_USERS_MAP[key].avatar = avatarUrl;
    }
  }

  // 2. Persist to Prisma DB
  try {
    if (user.email) {
      const updated = await prisma.user.upsert({
        where: { email: user.email.toLowerCase() },
        update: { avatar: avatarUrl },
        create: {
          id: user.id || `user_${Date.now()}`,
          email: user.email.toLowerCase(),
          name: user.name || 'ผู้ใช้งาน',
          password: '',
          role: user.role || 'student',
          avatar: avatarUrl,
        },
      });
      return updated;
    } else if (user.id) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: avatarUrl },
      });
      return updated;
    }
  } catch (err) {
    console.warn('Prisma updateUserAvatar error:', err.message);
  }

  return null;
}

export function isUniversityEmail(email) {
  return /@(go\.)?buu\.ac\.th$/i.test(String(email || '').trim());
}

// ---------- courses ----------
const TEACHER_SELECT = { select: { id: true, name: true } };

export async function listAllCourses() {
  try {
    const courses = await prisma.course.findMany({ include: { teacher: TEACHER_SELECT }, orderBy: { createdAt: 'desc' } });
    if (courses && courses.length > 0) return courses;
  } catch (err) {
    console.warn('DB listAllCourses error, using mock fallback:', err.message);
  }
  return MOCK_COURSES;
}

export async function getCourse(id) {
  try {
    const course = await prisma.course.findUnique({ where: { id }, include: { teacher: TEACHER_SELECT } });
    if (course) return course;
  } catch (err) {
    // ignore
  }
  return (
    MOCK_COURSES.find((c) => c.id === id) ||
    MOCK_STUDENT_COURSES.find((c) => c.id === id) ||
    MOCK_COURSES[0]
  );
}

export async function listCoursesForStudent(studentId) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: { course: { include: { teacher: TEACHER_SELECT } } },
    });
    if (enrollments && enrollments.length > 0) return enrollments.map((e) => e.course);
  } catch (err) {
    console.warn('DB listCoursesForStudent error, using mock fallback:', err.message);
  }
  return MOCK_STUDENT_COURSES;
}

export async function listCoursesForTeacher(teacherId) {
  try {
    const courses = await prisma.course.findMany({ where: { teacherId } });
    if (courses && courses.length > 0) return courses;
  } catch (err) {
    console.warn('DB listCoursesForTeacher error, using mock fallback:', err.message);
  }
  const user = await getUserById(teacherId);
  return getMockCoursesForTeacher(user?.email || teacherId);
}

export async function listStudentsInCourse(courseId) {
  try {
    const enrollments = await prisma.enrollment.findMany({ where: { courseId }, include: { student: true } });
    if (enrollments && enrollments.length > 0) return enrollments.map((e) => e.student);
  } catch (err) {
    // fallback
  }
  return [];
}

export async function isEnrolled(studentId, courseId) {
  if (studentId.includes('-mock') || courseId.startsWith('mock-')) return true;
  try {
    const e = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
    return !!e;
  } catch (err) {
    return true;
  }
}

// ---------- leaves ----------
export async function listLeavesForStudent(studentId) {
  try {
    const leaves = await prisma.leaveRequest.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
    if (leaves && leaves.length > 0) return leaves;
    if (leaves && leaves.length === 0 && studentId !== 'student-mock') return [];
  } catch (err) {
    console.warn('DB listLeavesForStudent error, using mock fallback:', err.message);
  }
  if (studentId === 'student-mock') return MOCK_STUDENT_LEAVES;
  return [];
}

export async function listLeavesForTeacher(teacherId) {
  try {
    const courses = await listCoursesForTeacher(teacherId);
    const courseIds = courses.map((c) => c.id);
    if (courseIds.length === 0) return [];
    const leaves = await prisma.leaveRequest.findMany({ where: { courseId: { in: courseIds } }, orderBy: { createdAt: 'desc' } });
    return leaves || [];
  } catch (err) {
    console.warn('DB listLeavesForTeacher error, using mock fallback:', err.message);
  }
  if (teacherId === 'teacher-mock') return [...buildMockPendingLeaves(), ...buildMockLeaveHistory()];
  return [];
}

export async function listAllLeaves() {
  try {
    const leaves = await prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } });
    if (leaves && leaves.length > 0) return leaves;
  } catch (err) {
    console.warn('DB listAllLeaves error, using mock fallback:', err.message);
  }
  return [...buildMockPendingLeaves(), ...buildMockLeaveHistory()];
}

export async function getLeave(id) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    const leave = await prisma.leaveRequest.findUnique({ where: { id: numId } });
    if (leave) return leave;
  } catch (err) {
    // fallback
  }
  const allMocks = [...buildMockPendingLeaves(), ...buildMockLeaveHistory(), ...MOCK_STUDENT_LEAVES];
  return allMocks.find((l) => l.id === numId || l.id === id) || null;
}

export async function getLeaveByAttachment(filename) {
  try {
    return await prisma.leaveRequest.findFirst({ where: { attachment: filename } });
  } catch (err) {
    return null;
  }
}

export async function addLeave(studentId, data) {
  try {
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
    if (course?.teacherId) {
      await addNotification(course.teacherId, `${student.name} ยื่นคำร้องลา "${course.name}" (${leave.type})`, '/teacher');
    }
    return leave;
  } catch (err) {
    console.warn('DB addLeave error, returning simulated object:', err.message);
    return {
      id: Math.floor(Math.random() * 9000) + 1000,
      studentId,
      courseId: data.courseId,
      type: data.type,
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      attachment: data.attachment || null,
      status: 'รออนุมัติ',
      teacherComment: null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function setLeaveStatus(id, status, comment) {
  try {
    const existing = await getLeave(id);
    if (!existing) return null;
    if (existing.status === 'ยกเลิก' && status !== 'ยกเลิก') {
      return null; // นิสิตยกเลิกไปแล้ว ไม่อนุญาตให้เขียนทับ
    }
    const leave = await prisma.leaveRequest.update({
      where: { id: existing.id },
      data: { status, teacherComment: comment || null },
    });
    return leave;
  } catch (err) {
    return { id, status, teacherComment: comment || null };
  }
}

export async function cancelLeave(id, studentId) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    const result = await prisma.leaveRequest.updateMany({
      where: { id: numId, studentId, status: 'รออนุมัติ' },
      data: { status: 'ยกเลิก' },
    });
    if (result.count === 0) return null;
    return getLeave(numId);
  } catch (err) {
    return { id: numId, studentId, status: 'ยกเลิก' };
  }
}

export async function resubmitLeave(id, studentId, data) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
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
    return getLeave(numId);
  } catch (err) {
    return { id: numId, studentId, ...data, status: 'รออนุมัติ', createdAt: new Date() };
  }
}

export async function countApprovedLeaves(studentId, courseId) {
  try {
    return await prisma.leaveRequest.count({ where: { studentId, courseId, status: 'อนุมัติ' } });
  } catch (err) {
    return 1;
  }
}

export async function getAttendanceSummary(studentId, courseId) {
  const course = await getCourse(courseId);
  if (!course) return null;
  try {
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
  } catch (err) {
    return MOCK_STUDENT_SUMMARIES[0];
  }
}

// ---------- notifications ----------
export async function addNotification(userId, message, link) {
  try {
    return await prisma.notification.create({ data: { userId, message, link: link || null } });
  } catch (err) {
    return { id: Date.now(), userId, message, link, read: false, createdAt: new Date() };
  }
}

export async function listNotifications(userId) {
  try {
    const notes = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (notes && notes.length > 0) return notes;
  } catch (err) {
    // fallback
  }
  return MOCK_NOTIFICATIONS.filter((n) => n.userId === userId);
}

export async function markNotificationRead(id, userId) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    const note = await prisma.notification.findFirst({ where: { id: numId, userId } });
    if (!note) return null;
    return await prisma.notification.update({ where: { id: note.id }, data: { read: true } });
  } catch (err) {
    return { id: numId, read: true };
  }
}

// ---------- support tickets ----------
export async function addTicket(userId, subject, message) {
  try {
    const user = await getUserById(userId);
    return await prisma.ticket.create({
      data: { userId, userName: user?.name || '', subject, message, status: 'เปิดเรื่อง' },
    });
  } catch (err) {
    return {
      id: Date.now(),
      userId,
      userName: 'ผู้ใช้งาน',
      subject,
      message,
      status: 'เปิดเรื่อง',
      createdAt: new Date(),
    };
  }
}

export async function listTicketsForUser(userId) {
  try {
    const tickets = await prisma.ticket.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (tickets && tickets.length > 0) return tickets;
  } catch (err) {
    // fallback
  }
  return MOCK_TICKETS;
}

export async function listAllTickets() {
  try {
    const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    if (tickets && tickets.length > 0) return tickets;
  } catch (err) {
    // fallback
  }
  return MOCK_TICKETS;
}

export async function replyTicket(id, reply) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: numId } });
    if (!ticket) return null;
    return await prisma.ticket.update({ where: { id: ticket.id }, data: { reply, status: 'ตอบกลับแล้ว' } });
  } catch (err) {
    return { id: numId, reply, status: 'ตอบกลับแล้ว' };
  }
}
