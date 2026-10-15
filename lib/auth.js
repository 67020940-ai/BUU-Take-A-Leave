import { cookies } from 'next/headers';
import { getUserById, MOCK_USERS_MAP } from './db.js';
import { verifySessionPayload } from './session.js';
import { prisma } from './prisma.js';


export const SESSION_COOKIE = 'session';


export async function getCurrentUser() {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE)?.value;
  const session = verifySessionPayload(rawToken);
  if (!session?.userId) return null;

  const { userId, role } = session;

  // 1. Try resolving via getUserById and verify user exists in PostgreSQL
  try {
    const dbUser = await getUserById(userId);
    if (dbUser && dbUser.id) {
      const realUser = await prisma.user.findUnique({ where: { id: dbUser.id } });
      if (realUser) {
        if (!realUser.role && role) realUser.role = role;
        return realUser;
      }
    }
  } catch (err) {
    console.warn('getCurrentUser getUserById error:', err.message);
  }

  // 2. Recovery from stale session IDs (e.g. after database reseed / re-deploy)
  try {
    if (role === 'admin') {
      const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
      if (admin) return admin;
    } else if (role === 'teacher') {
      const teacher = await prisma.user.findFirst({ where: { role: 'teacher' } });
      if (teacher) return teacher;
    } else {
      // Role is student: find matching student by code, email or fallback to first student
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

  // 3. Mock fallback for local mock testing
  if (role === 'admin' || (typeof userId === 'string' && userId.includes('admin'))) {
    return MOCK_USERS_MAP['admin-mock'];
  }
  if (role === 'teacher' || (typeof userId === 'string' && userId.includes('teacher'))) {
    return MOCK_USERS_MAP[userId] || MOCK_USERS_MAP['teacher-mock'];
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

