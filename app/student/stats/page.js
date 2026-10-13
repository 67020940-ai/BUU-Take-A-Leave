import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function StudentStatsPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(params);
  query.set('tab', 'stats');
  redirect(`/student?${query.toString()}`);
}
