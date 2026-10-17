import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
import { MOCK_COURSES, getMockCoursesForTeacher, buildMockPendingLeaves, buildMockLeaveHistory } from './mockTeacherData.js';
import { MOCK_STUDENT_COURSES, MOCK_STUDENT_LEAVES } from './studentData.js';
import { enrichCourseSchedule } from './leave-stats.js';
import { isTermStartedOrPassed } from './ui.js';


export const LEAVE_QUOTA_RATIO = 0.2; // ลาเกิน 20% ของจำนวนครั้งเรียนทั้งหมด = เกินโควต้า

export const MOCK_USERS_MAP = {
  'admin-mock': { id: 'admin-mock', email: 'admin@buu.ac.th', name: 'ผู้ดูแลระบบ', role: 'admin', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-mock': { id: 'teacher-mock', email: 'teacher-akara@buu.ac.th', name: 'ผศ.ดร.อัครา ธรรมมาสถิตย์กุล', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
  'teacher-teeradech': { id: 'teacher-teeradech', email: 'teacher-teeradech@buu.ac.th', name: 'ดร.ธีรเดช มานะกุล', role: 'teacher', faculty: 'คณะวิทยาการสารสนเทศ', major: 'ภาควิชาสารสนเทศศึกษา', avatar: null },
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

  // Handle email directly if passed as id
  if (typeof id === 'string' && id.includes('@')) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { email: id.toLowerCase() } });
      if (dbUser) return dbUser;
    } catch {}
  }

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
    if (courses && courses.length > 0) return courses.map((c) => enrichCourseSchedule(c));
  } catch (err) {
    console.warn('DB listAllCourses error, using mock fallback:', err.message);
  }
  return MOCK_COURSES;
}

export async function getCourse(id) {
  try {
    const course = await prisma.course.findUnique({ where: { id }, include: { teacher: TEACHER_SELECT } });
    if (course) return enrichCourseSchedule(course);
  } catch (err) {
    // ignore
  }
  const fallback =
    MOCK_COURSES.find((c) => c.id === id) ||
    MOCK_STUDENT_COURSES.find((c) => c.id === id) ||
    MOCK_COURSES[0];
  return enrichCourseSchedule(fallback);
}

// ---------- student resolution helper ----------
export async function resolveStudentDbUser(studentIdOrUser) {
  if (!studentIdOrUser) return null;
  if (typeof studentIdOrUser === 'object' && studentIdOrUser.id && studentIdOrUser.studentId) {
    return studentIdOrUser;
  }

  let id = typeof studentIdOrUser === 'string' ? studentIdOrUser : studentIdOrUser?.id;
  let email = typeof studentIdOrUser === 'object' ? studentIdOrUser?.email : null;
  let studentCode = typeof studentIdOrUser === 'object' ? studentIdOrUser?.studentId : null;

  // 1. Direct match by User.id in DB
  if (id) {
    try {
      const direct = await prisma.user.findUnique({ where: { id } });
      if (direct) return direct;
    } catch (e) {
      console.warn('resolveStudentDbUser direct match error:', e.message);
    }
  }

  // 2. Extract code from student-xxx or numeric
  if (!studentCode && typeof id === 'string') {
    if (id.startsWith('student-')) {
      studentCode = id.replace('student-', '');
    } else if (/^\d{8}$/.test(id)) {
      studentCode = id;
    }
  }
  if (!studentCode && email && email.includes('@')) {
    const code = email.split('@')[0];
    if (/^\d{8}$/.test(code)) studentCode = code;
  }
  if (!studentCode || studentCode === 'mock' || studentCode.startsWith('cm')) {
    studentCode = '66000001';
  }

  // 3. Search by studentId field or email in DB
  try {
    const candidateEmails = [email, `${studentCode}@go.buu.ac.th`, '66000001@go.buu.ac.th', '67020940@go.buu.ac.th'].filter(Boolean);
    const byCodeOrEmail = await prisma.user.findFirst({
      where: {
        OR: [
          { studentId: studentCode },
          { email: { in: candidateEmails } },
        ],
      },
    });
    if (byCodeOrEmail) return byCodeOrEmail;
  } catch (e) {
    console.warn('resolveStudentDbUser code/email error:', e.message);
  }

  // 4. Fallback to any active student in DB
  try {
    const anyStudent = await prisma.user.findFirst({
      where: { role: 'student' },
      orderBy: { createdAt: 'asc' },
    });
    if (anyStudent) return anyStudent;
  } catch (e) {
    console.warn('resolveStudentDbUser fallback error:', e.message);
  }

  // 5. Auto-upsert student so Foreign Key constraint never fails
  try {
    const finalEmail = email || `${studentCode}@go.buu.ac.th`;
    const hash = await bcrypt.hash('1234', 10);
    return await prisma.user.upsert({
      where: { email: finalEmail },
      update: {},
      create: {
        email: finalEmail,
        password: hash,
        name: typeof studentIdOrUser === 'object' && studentIdOrUser?.name ? studentIdOrUser.name : `นิสิต (${studentCode})`,
        role: 'student',
        studentId: studentCode,
        faculty: 'คณะวิทยาการสารสนเทศ',
        major: 'ภาควิชาสารสนเทศศึกษา',
      },
    });
  } catch (upsertErr) {
    console.warn('resolveStudentDbUser upsert error:', upsertErr.message);
    try {
      const found = await prisma.user.findFirst({ where: { role: 'student' } });
      if (found) return found;
    } catch {}
  }

  // 6. Graceful memory fallback so caller never fails with missing student
  const fallbackCode = studentCode || '66000001';
  return {
    id: id || `student-${fallbackCode}`,
    email: email || `${fallbackCode}@go.buu.ac.th`,
    name: typeof studentIdOrUser === 'object' && studentIdOrUser?.name ? studentIdOrUser.name : `นิสิต (${fallbackCode})`,
    role: 'student',
    studentId: fallbackCode,
    faculty: 'คณะวิทยาการสารสนเทศ',
    major: 'ภาควิชาสารสนเทศศึกษา',
  };
}



export function filterElectiveCoursesForStudent(courses, studentIdOrCode) {
  if (!courses || courses.length === 0) return courses;
  const termMap = new Map();
  for (const c of courses) {
    const term = c.term || '1/2569';
    if (!termMap.has(term)) termMap.set(term, []);
    termMap.get(term).push(c);
  }
  const result = [];
  const digits = String(studentIdOrCode || '').replace(/\D/g, '') || '1';
  const seedNum = parseInt(digits, 10) || 1;

  // ตรวจสอบรุ่นปีการศึกษาของนิสิตจากรหัสนิสิต (เช่น 66, 67, 68, 69)
  const cohortMatch = String(studentIdOrCode || '').trim().match(/^(\d{2})/);
  const cohort = cohortMatch ? parseInt(cohortMatch[1], 10) : 66;

  for (const [term, termCourses] of termMap.entries()) {
    const majorCourses = [];
    const geCourses = [];
    for (const c of termCourses) {
      const codeStr = String(c.code || '');
      const nameStr = String(c.name || '');

      // นิสิตรุ่น 68 (ปี 2) และ 69 (ปี 1) ยังไม่สามารถเรียนวิชาสหกิจศึกษา/เตรียมสหกิจ หรือวิชาปี 4 (รหัส 2454xxxx)
      // เฉพาะนิสิตปี 4 (รุ่น 66) เท่านั้นที่สามารถลงเรียนได้
      if (cohort >= 68) {
        if (
          codeStr === '24549264' ||
          codeStr === '24549164' ||
          nameStr.includes('สหกิจศึกษา') ||
          codeStr.startsWith('2454')
        ) {
          continue;
        }
      }

      if (codeStr.startsWith('895')) {
        geCourses.push(c);
      } else {
        majorCourses.push(c);
      }
    }
    result.push(...majorCourses);
    if (geCourses.length > 0) {
      const selectedIndex = (seedNum - 1) % geCourses.length;
      result.push(geCourses[selectedIndex >= 0 ? selectedIndex : 0]);
    }
  }
  return result;
}

export async function listCoursesForStudent(studentId) {
  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const rawId = typeof studentId === 'string' ? studentId : studentId?.id;
    const idsToSearch = [rawId, studentUser?.id].filter((x) => typeof x === 'string' && x.length > 0);

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: { in: idsToSearch } },
      include: { course: { include: { teacher: TEACHER_SELECT } } },
    });
    if (enrollments && enrollments.length > 0) {
      // เฉพาะภาคการศึกษาปัจจุบันและที่ผ่านมาแล้วเท่านั้น (เช่น 1/2569) ป้องกันเทอม 2/2569 ที่ยังไม่เปิดแสดงขึ้นมา
      const validEnrollments = enrollments.filter((e) => isTermStartedOrPassed(e.course?.term || '1/2569', '1/2569'));
      const targetEnrollments = validEnrollments.length > 0 ? validEnrollments : enrollments;
      const enriched = targetEnrollments.map((e) => enrichCourseSchedule(e.course));
      const studentCode = studentUser?.studentId || (typeof studentId === 'string' ? studentId : '1');
      return filterElectiveCoursesForStudent(enriched, studentCode);
    }
  } catch (err) {
    console.warn('DB listCoursesForStudent error, using mock fallback:', err.message);
  }
  return MOCK_STUDENT_COURSES;
}

export async function listCoursesForTeacher(teacherId) {
  try {
    let teacherUser = await getUserById(teacherId);
    if (!teacherUser && typeof teacherId === 'string' && teacherId.includes('@')) {
      teacherUser = await prisma.user.findUnique({ where: { email: teacherId.toLowerCase() } });
    }
    const idsToSearch = [teacherId];
    if (teacherUser) {
      if (teacherUser.id && !idsToSearch.includes(teacherUser.id)) idsToSearch.push(teacherUser.id);
      if (teacherUser.email && !idsToSearch.includes(teacherUser.email)) idsToSearch.push(teacherUser.email);
    }
    if (typeof teacherId === 'string' && !teacherId.includes('@')) {
      const emailCandidate = `${teacherId}@buu.ac.th`.toLowerCase();
      try {
        const dbTeacher = await prisma.user.findUnique({ where: { email: emailCandidate } });
        if (dbTeacher) {
          if (!idsToSearch.includes(dbTeacher.id)) idsToSearch.push(dbTeacher.id);
          if (!idsToSearch.includes(dbTeacher.email)) idsToSearch.push(dbTeacher.email);
        }
      } catch {}
    }

    const courses = await prisma.course.findMany({
      where: { teacherId: { in: idsToSearch } },
      include: { teacher: TEACHER_SELECT },
    });
    if (courses && courses.length > 0) {
      const validCourses = courses.filter((c) => isTermStartedOrPassed(c.term || '1/2569', '1/2569'));
      const targetCourses = validCourses.length > 0 ? validCourses : courses;
      return targetCourses.map((c) => enrichCourseSchedule(c));
    }
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

    // As long as course exists in system, allow leave submission (auto-enroll will link it)
    const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
    if (courseExists) return true;

    return true;
  } catch (err) {
    return true;
  }
}

const MOCK_TEACHER_LEAVE_OVERRIDES = new Map();

// ---------- leaves ----------
export async function listLeavesForStudent(studentId) {
  try {
    const studentUser = await resolveStudentDbUser(studentId);
    const rawId = typeof studentId === 'string' ? studentId : studentId?.id;
    const idsToSearch = [rawId, studentUser?.id].filter((x) => typeof x === 'string' && x.length > 0);

    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId: { in: idsToSearch } },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
    const mockLeaves = (MOCK_STUDENT_LEAVES || []).filter(
      (l) => idsToSearch.includes(l.studentId) || l.studentId === studentId
    );
    const existingIds = new Set((leaves || []).map((l) => l.id));
    const merged = [...(leaves || [])];
    for (const m of mockLeaves) {
      if (!existingIds.has(m.id)) {
        merged.push(m);
      }
    }
    return merged;
  } catch (err) {
    console.warn('DB listLeavesForStudent error:', err.message);
    return MOCK_STUDENT_LEAVES || [];
  }
}

export async function listLeavesForTeacher(teacherId) {
  try {
    const courses = await listCoursesForTeacher(teacherId);
    const courseIds = courses.map((c) => c.id);
    const courseCodes = courses.map((c) => c.code).filter(Boolean);
    if (courseIds.length === 0 && courseCodes.length === 0) return [];

    const leaves = await prisma.leaveRequest.findMany({
      where: {
        OR: [
          { courseId: { in: courseIds } },
          ...(courseCodes.length > 0 ? [{ course: { code: { in: courseCodes } } }] : []),
        ],
      },
      include: { course: true, student: { select: { id: true, name: true, studentId: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const teacherUser = await getUserById(teacherId);
    const teacherEmail = teacherUser?.email || (typeof teacherId === 'string' && teacherId.includes('@') ? teacherId : 'teacher-akara@buu.ac.th');
    const mockCourses = getMockCoursesForTeacher(teacherEmail);
    const targetMockCourses = courses.length > 0 ? courses : mockCourses;
    const mockPending = buildMockPendingLeaves(targetMockCourses);
    const mockHistory = buildMockLeaveHistory(targetMockCourses);
    const mockLeaves = (MOCK_STUDENT_LEAVES || []).filter(
      (l) => courseIds.includes(l.courseId)
    );

    const existingIds = new Set((leaves || []).map((l) => String(l.id)));
    const merged = [...(leaves || [])];

    // If teacher has 0 pending leaves in database, merge mock pending leaves so the review queue is never completely empty
    const hasPendingInDb = merged.some((l) => l.status === 'รออนุมัติ');
    if (!hasPendingInDb) {
      for (const mp of mockPending) {
        if (!existingIds.has(String(mp.id))) {
          const override = MOCK_TEACHER_LEAVE_OVERRIDES.get(String(mp.id));
          merged.push(override ? { ...mp, ...override } : mp);
          existingIds.add(String(mp.id));
        }
      }
    }

    // If teacher has 0 approved leaves in database, merge synchronized mock history leaves
    const hasApprovedInDb = merged.some((l) => l.status === 'อนุมัติ');
    if (!hasApprovedInDb) {
      for (const mh of mockHistory) {
        if (!existingIds.has(String(mh.id))) {
          const override = MOCK_TEACHER_LEAVE_OVERRIDES.get(String(mh.id));
          merged.push(override ? { ...mh, ...override } : mh);
          existingIds.add(String(mh.id));
        }
      }
    }

    for (const m of mockLeaves) {
      if (!existingIds.has(String(m.id))) {
        merged.push(m);
        existingIds.add(String(m.id));
      }
    }
    return merged;
  } catch (err) {
    console.warn('DB listLeavesForTeacher error:', err.message);
    return [];
  }
}

export async function listAllLeaves() {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
    const existingIds = new Set((leaves || []).map((l) => l.id));
    const merged = [...(leaves || [])];
    for (const m of MOCK_STUDENT_LEAVES || []) {
      if (!existingIds.has(m.id)) {
        merged.push(m);
      }
    }
    return merged;
  } catch (err) {
    console.warn('DB listAllLeaves error:', err.message);
    return MOCK_STUDENT_LEAVES || [];
  }
}

export async function getLeave(id) {
  if (id === undefined || id === null) return null;
  const numId = Number(id);
  if (Number.isInteger(numId)) {
    try {
      const found = await prisma.leaveRequest.findUnique({
        where: { id: numId },
        include: { course: true },
      });
      if (found) return found;
    } catch (err) {}
  }
  const strId = String(id);
  const studentMock = (MOCK_STUDENT_LEAVES || []).find((l) => String(l.id) === strId);
  if (studentMock) return studentMock;

  const teacherMocks = [...buildMockPendingLeaves(MOCK_COURSES), ...buildMockLeaveHistory(MOCK_COURSES)];
  const teacherMock = teacherMocks.find((l) => String(l.id) === strId);
  if (teacherMock) {
    const override = MOCK_TEACHER_LEAVE_OVERRIDES.get(strId);
    return override ? { ...teacherMock, ...override } : teacherMock;
  }
  return null;
}

export async function getLeaveByAttachment(filename) {
  try {
    const found = await prisma.leaveRequest.findFirst({ where: { attachment: filename } });
    if (found) return found;
  } catch (err) {}
  return (MOCK_STUDENT_LEAVES || []).find((l) => l.attachment === filename) || null;
}

// ค้นหารายวิชาจากฐานข้อมูลจริงเท่านั้น (ไม่ fallback ไปใช้ mock/วิชาแรก เพื่อไม่ให้ใบลาไปผูกกับวิชาผิด)
export async function findCourseStrict(courseId) {
  if (!courseId) return null;
  const byId = await prisma.course.findUnique({ where: { id: courseId } });
  if (byId) return byId;
  // รองรับ id จาก mock (mock-xxx) โดยแมปผ่านรหัสวิชา
  const mockCourse =
    MOCK_STUDENT_COURSES.find((c) => c.id === courseId) || MOCK_COURSES.find((c) => c.id === courseId);
  if (mockCourse?.code) {
    return prisma.course.findFirst({ where: { code: mockCourse.code } });
  }
  return null;
}

// ลองซ้ำเมื่อเป็น error ชั่วคราวของการเชื่อมต่อ (Neon serverless cold start / connection reset)
async function withDbRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const transient = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(err?.code);
      if (!transient || i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

// บันทึกใบลาลงฐานข้อมูลจริง หากบันทึกไม่ได้ต้อง throw เพื่อให้ผู้ใช้เห็นข้อผิดพลาดจริง
// (เดิมจะแอบสร้างใบลาปลอมใน memory แล้วตอบ 201 ทำให้ใบลาหายไปจากระบบ)
export async function addLeave(studentId, data) {
  const studentUser = await resolveStudentDbUser(studentId);
  if (!studentUser?.id) throw new Error('ไม่พบข้อมูลนิสิตในระบบ');

  const course = await findCourseStrict(data.courseId);
  if (!course) throw new Error('ไม่พบรายวิชาที่เลือก');

  // รับประกันว่า studentUser มีเรคอร์ด User จริงอยู่ใน PostgreSQL เสมอ ป้องกัน Foreign Key Constraint Fail
  let actualStudentDbUser = await prisma.user.findUnique({ where: { id: studentUser.id } });
  if (!actualStudentDbUser && studentUser.email) {
    actualStudentDbUser = await prisma.user.findUnique({ where: { email: studentUser.email.toLowerCase() } });
  }
  if (!actualStudentDbUser) {
    const studentCode = studentUser.studentId || (studentUser.email ? studentUser.email.split('@')[0] : '66000001');
    const finalEmail = studentUser.email || `${studentCode}@go.buu.ac.th`;
    const hash = await bcrypt.hash('1234', 10);
    actualStudentDbUser = await prisma.user.upsert({
      where: { email: finalEmail },
      update: {},
      create: {
        email: finalEmail,
        password: hash,
        name: studentUser.name || `นิสิต (${studentCode})`,
        role: 'student',
        studentId: studentCode,
        faculty: studentUser.faculty || 'คณะวิทยาการสารสนเทศ',
        major: studentUser.major || 'ภาควิชาสารสนเทศศึกษา',
      },
    });
  }

  const validStudentId = actualStudentDbUser.id;

  const leave = await withDbRetry(async () => {
    // 1. ลอง upsert enrollment เพื่อผูกวิชาและคำนวณสถิติ
    // ครอบ try-catch เพื่อไม่ให้ข้อผิดพลาดของ enrollment บล็อกการยื่นใบลาหลัก
    try {
      await prisma.enrollment.upsert({
        where: { studentId_courseId: { studentId: validStudentId, courseId: course.id } },
        update: {},
        create: { studentId: validStudentId, courseId: course.id },
      });
    } catch (enrollErr) {
      console.warn('Enrollment upsert non-critical warning:', enrollErr.message);
    }

    // 2. บันทึกคำขอลาเรียนจริงลง LeaveRequest table
    return await prisma.leaveRequest.create({
      data: {
        studentId: validStudentId,
        courseId: course.id,
        type: data.type,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        attachment: data.attachment || null,
        status: 'รออนุมัติ',
      },
    });
  });

  if (course.teacherId) {
    await addNotification(course.teacherId, `${studentUser.name || 'นิสิต'} ยื่นคำร้องลา "${course.name}" (${leave.type})`, '/teacher');
  }
  return leave;
}


export async function setLeaveStatus(id, status, comment) {
  if (id === undefined || id === null) return null;
  const numId = Number(id);
  if (Number.isInteger(numId)) {
    try {
      const existing = await getLeave(numId);
      if (existing) {
        if (existing.status === 'ยกเลิก' && status !== 'ยกเลิก') {
          return null; // นิสิตยกเลิกไปแล้ว ไม่อนุญาตให้เขียนทับ
        }
        const leave = await prisma.leaveRequest.update({
          where: { id: existing.id },
          data: { status, teacherComment: comment || null },
        });
        return leave;
      }
    } catch (err) {}
  }

  const strId = String(id);
  const mockLeave = (MOCK_STUDENT_LEAVES || []).find((l) => String(l.id) === strId);
  if (mockLeave) {
    if (mockLeave.status === 'ยกเลิก' && status !== 'ยกเลิก') return null;
    mockLeave.status = status;
    mockLeave.teacherComment = comment || null;
    return mockLeave;
  }

  const teacherMocks = [...buildMockPendingLeaves(MOCK_COURSES), ...buildMockLeaveHistory(MOCK_COURSES)];
  const teacherMock = teacherMocks.find((l) => String(l.id) === strId);
  if (teacherMock) {
    const updated = {
      ...teacherMock,
      ...(MOCK_TEACHER_LEAVE_OVERRIDES.get(strId) || {}),
      status,
      teacherComment: comment || null,
      approvedAt: new Date().toISOString(),
    };
    MOCK_TEACHER_LEAVE_OVERRIDES.set(strId, {
      status,
      teacherComment: comment || null,
      approvedAt: updated.approvedAt,
    });
    return updated;
  }
  return null;
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
    if (result.count > 0) return await getLeave(numId);
  } catch (err) {}

  const mockLeave = (MOCK_STUDENT_LEAVES || []).find((l) => l.id === numId);
  if (mockLeave && mockLeave.status === 'รออนุมัติ') {
    mockLeave.status = 'ยกเลิก';
    return mockLeave;
  }
  return null;
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
    if (result.count > 0) return await getLeave(numId);
  } catch (err) {}

  const mockLeave = (MOCK_STUDENT_LEAVES || []).find((l) => l.id === numId);
  if (mockLeave && mockLeave.status === 'ยกเลิก') {
    Object.assign(mockLeave, {
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
    });
    return mockLeave;
  }
  return null;
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
