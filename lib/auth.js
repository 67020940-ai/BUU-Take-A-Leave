import { cookies } from 'next/headers';
import { getUserById } from './db';
import { verifySession } from './session';

export const SESSION_COOKIE = 'session';

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const userId = verifySession(token);
  if (!userId) return null;

  // PROTOTYPE MODE: Bypass DB for mock users
  if (userId.includes('-mock')) {
    const mockUsers = {
      'admin-mock': { id: 'admin-mock', email: 'admin@buu.ac.th', name: 'ผู้ดูแลระบบ', role: 'admin' },
      'teacher-mock': { id: 'teacher-mock', email: 'teacher-teeradech@buu.ac.th', name: 'ดร.ธีรเดช', role: 'teacher' },
      'student-mock': { id: 'student-mock', email: '66000001@go.buu.ac.th', name: 'จุฑามาศ แสงทอง', role: 'student' },
    };
    return mockUsers[userId] || null;
  }

  return getUserById(userId);
}

export function homePathForRole(role) {
  if (role === 'teacher') return '/teacher';
  if (role === 'admin') return '/admin';
  return '/student';
}
