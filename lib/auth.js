import { cookies } from 'next/headers';
import { getUserById } from './db';
import { verifySession } from './session';

export const SESSION_COOKIE = 'session';

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const userId = verifySession(token);
  if (!userId) return null;
  return getUserById(userId);
}

export function homePathForRole(role) {
  if (role === 'teacher') return '/teacher';
  if (role === 'admin') return '/admin';
  return '/student';
}
