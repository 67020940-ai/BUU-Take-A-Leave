import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { MOCK_COURSES, getMockCoursesForTeacher } from './mockTeacherData';
import { MOCK_STUDENT_COURSES } from './studentData';

export const LEAVE_QUOTA_RATIO = 0.2; // ลาเกิน 20% ของจำนวนครั้งเรียนทั้งหมด = เกินโควต้า

export const MOCK_USERS_MAP = {
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
  if (!id) return null;
  // Check if mock user has a real DB entry by email so DB profile/avatar is retrieved
  if (MOCK_USERS_MAP[id]) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: MOCK_USERS_MAP[id].email } });
      if (dbUser) return { ...MOCK_USERS_MAP[id], ...dbUser };
    } catch {}
    return MOCK_USERS_MAP[id];
  }

  // Handle student mock ID formats: e.g. student-66000001, student-67020940
  if (typeof id === 'string' && id.startsWith('student-')) {
    const studentCode = id.replace('student-', '');
    const cleanEmail = /^\d{8}$/.test(studentCode) ? `${studentCode}@go.buu.ac.th` : '66000001@go.buu.ac.th';
    const mockStudent = {
      ...MOCK_USERS_MAP['student-mock'],
      id,
      email: cleanEmail,
      studentId: studentCode === 'mock' ? '66000001' : studentCode,
      name: studentCode === 'mock' ? MOCK_USERS_MAP['student-mock'].name : `นิสิต (${studentCode})`,
    };
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (dbUser) return { ...mockStudent, ...dbUser };
    } catch {}
    return mockStudent;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) return user;
  } catch (err) {
    // ignore
  }
  return MOCK_USERS_MAP[id] || null;
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

export async function updateUserProfile(user, profileData) {
  if (!user) return null;

  const {
    name,
    firstName,
    lastName,
    phone,
    studentId,
    personnelId,
    faculty,
    major,
    department,
    academicYear,
    advisorName,
    bio,
    avatar,
  } = profileData;

  const combinedName = (firstName || lastName)
    ? [firstName, lastName].filter(Boolean).join(' ').trim()
    : (name || user.name);

  const updatedData = {
    name: combinedName,
    ...(firstName !== undefined && { firstName }),
    ...(lastName !== undefined && { lastName }),
    ...(phone !== undefined && { phone }),
    ...(studentId !== undefined && { studentId }),
    ...(personnelId !== undefined && { personnelId }),
    ...(faculty !== undefined && { faculty }),
    ...(major !== undefined && { major }),
    ...(department !== undefined && { department: department || major }),
    ...(academicYear !== undefined && { academicYear }),
    ...(advisorName !== undefined && { advisorName }),
    ...(bio !== undefined && { bio }),
    ...(avatar !== undefined && { avatar }),
  };

  // 1. Update in-memory mock map for instant consistency
  if (user.id && MOCK_USERS_MAP[user.id]) {
    Object.assign(MOCK_USERS_MAP[user.id], updatedData);
  }
  for (const key of Object.keys(MOCK_USERS_MAP)) {
    if (user.email && MOCK_USERS_MAP[key].email?.toLowerCase() === user.email.toLowerCase()) {
      Object.assign(MOCK_USERS_MAP[key], updatedData);
    }
  }

  // 2. Persist to Prisma DB
  try {
    if (user.email) {
      const updated = await prisma.user.upsert({
        where: { email: user.email.toLowerCase() },
        update: updatedData,
        create: {
          id: user.id || `user_${Date.now()}`,
          email: user.email.toLowerCase(),
          password: '',
          role: user.role || 'student',
          ...updatedData,
        },
      });
      return updated;
    } else if (user.id) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: updatedData,
      });
      return updated;
    }
  } catch (err) {
    console.error('Prisma updateUserProfile error:', err.message);
    throw err;
  }

  return { ...user, ...updatedData };
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

// ---------- student resolution helper ----------
export async function resolveStudentDbUser(studentId) {
  if (!studentId) return null;
  // 1. Direct match by User.id
  try {
    const direct = await prisma.user.findUnique({ where: { id: studentId } });
    if (direct) return direct;
  } catch {}

  // 2. Resolve code from student-xxx or numeric
  let studentCode = studentId;
  if (typeof studentId === 'string' && studentId.startsWith('student-')) {
    studentCode = studentId.replace('student-', '');
  }
  if (studentCode === 'mock') {
    studentCode = '66000001';
  }

  try {
    const byCodeOrEmail = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId: studentCode },
          { email: `${studentCode}@go.buu.ac.th` },
        ],
      },
    });
    if (byCodeOrEmail) return byCodeOrEmail;
  } catch {}

  // 3. Auto-upsert student so Foreign Key constraint never fails
  try {
    const email = `${studentCode}@go.buu.ac.th`;
    const name = MOCK_USERS_MAP[studentId]?.name || `นิสิต (${studentCode})`;
    const hash = await bcrypt.hash('1234', 10);
    return await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
        role: 'student',
        studentId: studentCode,
        faculty: 'คณะวิทยาการสารสนเทศ',
        major: 'ภาควิชาสารสนเทศศึกษา',
      },
    });
  } catch (upsertErr) {
    try {
      return await prisma.user.findFirst({
        where: {
          OR: [
            { studentId: studentCode },
            { email: `${studentCode}@go.buu.ac.th` },
          ],
        },
      });
    } catch {}
  }
  return null;
}

export async function listCoursesForStudent(studentId) {
  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const idsToSearch = [studentId];
    if (studentUser && studentUser.id !== studentId) idsToSearch.push(studentUser.id);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: { in: idsToSearch } },
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
  if (!studentId || !courseId) return true;
  if (typeof studentId === 'string' && (studentId.includes('-mock') || courseId.startsWith('mock-'))) return true;

  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const resolvedStudentId = studentUser ? studentUser.id : studentId;

    const e = await prisma.enrollment.findFirst({
      where: {
        OR: [
          { studentId: resolvedStudentId, courseId },
          { studentId, courseId },
        ],
      },
    });
    if (e) return true;

    const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
    if (!courseExists) return false;

    const count = await prisma.enrollment.count({ where: { studentId: resolvedStudentId } });
    if (count === 0) return true;

    return false;
  } catch (err) {
    return true;
  }
}

// ---------- leaves ----------
export async function listLeavesForStudent(studentId) {
  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const idsToSearch = [studentId];
    if (studentUser && studentUser.id !== studentId) idsToSearch.push(studentUser.id);

    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId: { in: idsToSearch } },
      orderBy: { createdAt: 'desc' },
    });
    return leaves || [];
  } catch (err) {
    console.warn('DB listLeavesForStudent error:', err.message);
    return [];
  }
}

export async function listLeavesForTeacher(teacherId) {
  try {
    const courses = await listCoursesForTeacher(teacherId);
    const courseIds = courses.map((c) => c.id);
    if (courseIds.length === 0) return [];
    const leaves = await prisma.leaveRequest.findMany({ where: { courseId: { in: courseIds } }, orderBy: { createdAt: 'desc' } });
    return leaves || [];
  } catch (err) {
    console.warn('DB listLeavesForTeacher error:', err.message);
    return [];
  }
}

export async function listAllLeaves() {
  try {
    const leaves = await prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } });
    return leaves || [];
  } catch (err) {
    console.warn('DB listAllLeaves error:', err.message);
    return [];
  }
}

export async function getLeave(id) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    return await prisma.leaveRequest.findUnique({ where: { id: numId } });
  } catch (err) {
    return null;
  }
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
    const studentUser = await resolveStudentDbUser(studentId);
    const resolvedStudentId = studentUser ? studentUser.id : studentId;

    let targetCourseId = data.courseId;
    let course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) {
      course = await prisma.course.findFirst({ where: { code: data.courseId } });
      if (course) targetCourseId = course.id;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        studentId: resolvedStudentId,
        courseId: targetCourseId,
        type: data.type,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        attachment: data.attachment || null,
        status: 'รออนุมัติ',
      },
    });

    const student = studentUser || (await getUserById(studentId));
    if (course?.teacherId) {
      await addNotification(course.teacherId, `${student?.name || 'นิสิต'} ยื่นคำร้องลา "${course.name}" (${leave.type})`, '/teacher');
    }
    return leave;
  } catch (err) {
    console.error('DB addLeave error:', err.message);
    throw err;
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
    return null;
  }
}

export async function cancelLeave(id, studentId) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const ids = [studentId];
    if (studentUser && studentUser.id !== studentId) ids.push(studentUser.id);

    const result = await prisma.leaveRequest.updateMany({
      where: { id: numId, studentId: { in: ids }, status: 'รออนุมัติ' },
      data: { status: 'ยกเลิก' },
    });
    if (result.count === 0) return null;
    return getLeave(numId);
  } catch (err) {
    return null;
  }
}

export async function resubmitLeave(id, studentId, data) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const ids = [studentId];
    if (studentUser && studentUser.id !== studentId) ids.push(studentUser.id);

    const result = await prisma.leaveRequest.updateMany({
      where: { id: numId, studentId: { in: ids }, status: 'ยกเลิก' },
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
    return null;
  }
}

export async function countApprovedLeaves(studentId, courseId) {
  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const ids = [studentId];
    if (studentUser && studentUser.id !== studentId) ids.push(studentUser.id);

    return await prisma.leaveRequest.count({
      where: { studentId: { in: ids }, courseId, status: 'อนุมัติ' },
    });
  } catch (err) {
    return 0;
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
    return null;
  }
}

// ---------- notifications ----------
export async function addNotification(userId, message, link) {
  try {
    return await prisma.notification.create({ data: { userId, message, link: link || null } });
  } catch (err) {
    console.error('DB addNotification error:', err.message);
    return null;
  }
}

export async function listNotifications(userId) {
  try {
    const notes = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return notes || [];
  } catch (err) {
    return [];
  }
}

export async function markNotificationRead(id, userId) {
  const numId = Number(id);
  if (!Number.isInteger(numId)) return null;
  try {
    const note = await prisma.notification.findFirst({ where: { id: numId, userId } });
    if (!note) return null;
    return await prisma.notification.update({ where: { id: note.id }, data: { read: true } });
  } catch (err) {
    return null;
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
    console.error('DB addTicket error:', err.message);
    return null;
  }
}

export async function listTicketsForUser(userId) {
  try {
    const tickets = await prisma.ticket.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return tickets || [];
  } catch (err) {
    return [];
  }
}

export async function listAllTickets() {
  try {
    const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    return tickets || [];
  } catch (err) {
    return [];
  }
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
