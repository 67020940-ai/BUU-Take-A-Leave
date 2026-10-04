import { redirect } from 'next/navigation';

export default async function StudentSchedulePage({ searchParams }) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(params);
  query.set('tab', 'schedule');
  redirect(`/student?${query.toString()}`);
}
