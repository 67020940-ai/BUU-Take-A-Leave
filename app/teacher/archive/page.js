import { redirect } from 'next/navigation';

export default function TeacherArchivePage() {
  redirect('/teacher/stats?view=archive');
}
