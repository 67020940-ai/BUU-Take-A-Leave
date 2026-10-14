import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';

export default async function StudentLeavePage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'student') redirect(homePathForRole(user.role));

  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(params);
  query.set('tab', 'leave');
  redirect(`/student?${query.toString()}`);
}
