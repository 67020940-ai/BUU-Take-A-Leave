import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';

export default async function TeacherArchivePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'teacher') redirect(homePathForRole(user.role));
  redirect('/teacher/stats?view=archive');
}

