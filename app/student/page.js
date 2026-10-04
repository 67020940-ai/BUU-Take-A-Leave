import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudentData } from '@/lib/studentData';
import StudentHomepageView from './student-homepage-view';

export const metadata = {
  title: 'ระบบนิสิต | BUU Take A Leave',
  description: 'ระบบยื่นและอนุมัติคำขอลาเรียนออนไลน์ สรุปเวลาเรียน มหาวิทยาลัยบูรพา',
};

export default async function StudentPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const { summaries = [], leaves = [], courses = [] } = await getStudentData(user.id);
  const resolvedParams = searchParams ? await searchParams : {};

  return (
    <StudentHomepageView
      user={user}
      summaries={summaries}
      leaves={leaves}
      courses={courses}
      initialTab={resolvedParams.tab || 'home'}
      initialCourseId={resolvedParams.courseId || ''}
      initialCourseCode={resolvedParams.code || resolvedParams.courseCode || ''}
      initialStatus={resolvedParams.status || 'all'}
      resubmitId={resolvedParams.resubmit || null}
    />
  );
}
