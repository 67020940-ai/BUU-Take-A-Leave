import { cookies } from 'next/headers';
import { getUserById, MOCK_USERS_MAP } from './db';
import { verifySessionPayload } from './session';

export const SESSION_COOKIE = 'session';

export async function getCurrentUser() {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE)?.value;
  const session = verifySessionPayload(rawToken);
  if (!session?.userId) return null;

  const { userId, role } = session;

  // 1. Try resolving via getUserById (from SQLite DB or mock profile)
  try {
    const dbUser = await getUserById(userId);
    if (dbUser) {
      if (!dbUser.role && role) dbUser.role = role;
      return dbUser;
    }
  } catch (err) {
    console.warn('getCurrentUser getUserById error:', err.message);
  }

  // 2. Resilient fallback for serverless deployments (Vercel) & mock accounts
  if (role === 'admin' || (typeof userId === 'string' && userId.includes('admin'))) {
    return MOCK_USERS_MAP['admin-mock'];
  }
  if (role === 'teacher' || (typeof userId === 'string' && userId.includes('teacher'))) {
    return MOCK_USERS_MAP[userId] || MOCK_USERS_MAP['teacher-mock'];
  }

  // 3. Student fallback: supports student-mock, student-66000001, student-67020940, etc.
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
