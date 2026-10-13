import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function TeacherArchivePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');
  redirect('/teacher/stats?view=archive');
}

