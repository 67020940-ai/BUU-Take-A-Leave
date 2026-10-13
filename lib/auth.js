import { cookies } from 'next/headers';
import { getUserById } from './db';
import { verifySession } from './session';

export const SESSION_COOKIE = 'session';

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const userId = verifySession(token);
  if (!userId) return null;

  // If mock user ID, try finding corresponding DB user by email so DB avatar/phone are loaded
  if (userId.includes('-mock')) {
    const mockEmails = {
      'admin-mock': 'admin@buu.ac.th',
      'teacher-mock': 'teacher-teeradech@buu.ac.th',
      'student-mock': '66000001@go.buu.ac.th',
    };
    const targetEmail = mockEmails[userId];
    if (targetEmail) {
      try {
        const dbUser = await getUserById(userId);
        if (dbUser) return dbUser;
      } catch {}
    }
    const mockUsers = {
      'admin-mock': { id: 'admin-mock', email: 'admin@buu.ac.th', name: 'ผู้ดูแลระบบ', role: 'admin', avatar: '/avatars/juthamat.png' },
      'teacher-mock': { id: 'teacher-mock', email: 'teacher-teeradech@buu.ac.th', name: 'ดร.ธีรเดช', role: 'teacher', avatar: '/avatars/juthamat.png' },
      'student-mock': { id: 'student-mock', email: '66000001@go.buu.ac.th', name: 'จุฑามาศ แสงทอง', role: 'student', avatar: '/avatars/juthamat.png' },
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
