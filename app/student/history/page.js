import { redirect } from 'next/navigation';

export default async function StudentHistoryPage({ searchParams }) {
  const params = searchParams ? await searchParams : {};
  const query = new URLSearchParams(params);
  query.set('tab', 'history');
  redirect(`/student?${query.toString()}`);
}
