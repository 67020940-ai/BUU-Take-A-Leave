import { redirect } from 'next/navigation';

export default async function StudentLeavePage({ searchParams }) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(params);
  query.set('tab', 'leave');
  redirect(`/student?${query.toString()}`);
}
