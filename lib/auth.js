import { cookies } from 'next/headers';
import { getUserById, MOCK_USERS_MAP, getCachedDbValue, setCachedDbValue } from './db.js';
import { verifySessionPayload } from './session.js';
import { prisma } from './prisma.js';

export const SESSION_COOKIE = 'session';

export async function getCurrentUser() {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE)?.value;
  const session = verifySessionPayload(rawToken);
  if (!session?.userId) return null;

  const { userId, role } = session;
  const cacheKey = `auth_user_${userId}_${role || ''}`;
  const cached = getCachedDbValue(cacheKey);
  if (cached !== undefined) return cached;

  // 1. Direct match by User.id in PostgreSQL
  try {
    const direct = await prisma.user.findUnique({ where: { id: userId } });
    if (direct) {
      if (!direct.role && role) direct.role = role;
      return setCachedDbValue(cacheKey, direct);
    }
  } catch (err) {
    console.warn('getCurrentUser direct match error:', err.message);
  }

  // 2. Try resolving via getUserById and verify user exists in PostgreSQL
  try {
    const dbUser = await getUserById(userId);
    if (dbUser && dbUser.id && dbUser.id !== userId) {
      const realUser = await prisma.user.findUnique({ where: { id: dbUser.id } });
      if (realUser) {
        if (!realUser.role && role) realUser.role = role;
        return setCachedDbValue(cacheKey, realUser);
      }
    }
  } catch (err) {
    console.warn('getCurrentUser getUserById error:', err.message);
  }

  // 3. Recovery by specific email, handle, or student code
  try {
    if (role === 'admin') {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
      if (admin) return admin;
    } else if (role === 'teacher') {
      let handle = typeof userId === 'string' ? userId.replace('teacher-', '') : '';
      let targetEmail = typeof userId === 'string' && userId.includes('@') ? userId : null;
      if (!targetEmail && handle) targetEmail = `teacher-${handle}@buu.ac.th`;

      const teacher = await prisma.user.findFirst({
        where: {
          role: 'teacher',
          OR: [
            ...(targetEmail ? [{ email: targetEmail }] : []),
            ...(handle ? [{ email: { contains: handle } }] : []),
          ],
        },
      }) || await prisma.user.findFirst({ where: { role: 'teacher' } });

      if (teacher) return teacher;
    } else {
      // Role is student: find matching student by code or email
      const studentCode = typeof userId === 'string' && userId.startsWith('student-')
        ? userId.replace('student-', '')
        : (/^\d{8}$/.test(userId) ? userId : '66000001');

      const student = await prisma.user.findFirst({
        where: {
          role: 'student',
          OR: [
            { studentId: studentCode },
            { email: `${studentCode}@go.buu.ac.th` },
          ],
        },
      }) || await prisma.user.findFirst({ where: { role: 'student' } });

      if (student) return student;
    }
  } catch (recoverErr) {
    console.warn('getCurrentUser recovery error:', recoverErr.message);
  }

  // 4. Mock fallback for local mock testing
  if (role === 'admin' || (typeof userId === 'string' && userId.includes('admin'))) {
    return MOCK_USERS_MAP['admin-mock'];
  }
  if (role === 'teacher' || (typeof userId === 'string' && userId.includes('teacher'))) {
    return MOCK_USERS_MAP[userId] || MOCK_USERS_MAP['teacher-mock'] || {
      id: userId,
      email: typeof userId === 'string' && userId.includes('@') ? userId : `${userId}@buu.ac.th`,
      name: 'อาจารย์ผู้สอน',
      role: 'teacher',
      faculty: 'คณะวิทยาการสารสนเทศ',
      major: 'ภาควิชาสารสนเทศศึกษา',
      avatar: null,
    };
  }

  const studentCode = typeof userId === 'string' && userId.startsWith('student-')
    ? userId.replace('student-', '')
    : '66000001';

  return {
    ...MOCK_USERS_MAP['student-mock'],
    id: userId,
    email: /^\d{8}$/.test(studentCode) ? `${studentCode}@go.buu.ac.th` : '66000001@go.buu.ac.th',
    studentId: studentCode === 'mock' ? '66000001' : studentCode,
    name: studentCode === 'mock' ? MOCK_USERS_MAP['student-mock'].name : `นิสิต (${studentCode})`,
    role: 'student',
  };
}

export function homePathForRole(role) {
  if (role === 'teacher') return '/teacher';
  if (role === 'admin') return '/admin';
  return '/student';
}
