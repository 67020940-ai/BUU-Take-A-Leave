import { redirect } from 'next/navigation';

export default async function StudentStatsPage({ searchParams }) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(params);
  query.set('tab', 'stats');
  redirect(`/student?${query.toString()}`);
}
