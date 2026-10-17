import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import TeacherRequestsView from './teacher-requests-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'คำขอร้องลาเรียน | Take A Leave',
  description: 'ระบบพิจารณาและอนุมัติคำขอลาเรียนของนิสิต มหาวิทยาลัยบูรพา',
};

export default async function TeacherRequestsPage(props) {
  const searchParams = await props?.searchParams;
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_') || err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.warn('TeacherRequestsPage getCurrentUser error:', err);
  }
  if (!user) redirect('/login');
  if (user.role !== 'teacher') redirect(homePathForRole(user.role));

  const [{ usingMock, courses, rosterByCourse }, leaves] = await Promise.all([
    getTeacherCoursesAndRoster(user.id),
    getTeacherLeaves(user.id, false),
  ]);

  return (
    <TeacherRequestsView
      user={{
        name: user.name,
        role: user.role,
        email: user.email,
        faculty: user.faculty || 'คณะวิทยาการสารสนเทศ',
        major: user.major || 'ภาควิชาการจัดการสารสนเทศ',
      }}
      courses={courses}
      initialLeaves={leaves}
      rosterByCourse={rosterByCourse}
      usingMock={usingMock}
      initialCourseId={searchParams?.courseId || searchParams?.course || 'all'}
    />
  );
}
