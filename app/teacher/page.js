import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';
import TeacherDashboard from './teacher-dashboard';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'ระบบอาจารย์ผู้สอน | Take A Leave',
  description: 'ระบบยื่นและอนุมัติคำขอลาเรียนออนไลน์ มหาวิทยาลัยบูรพา',
};

export default async function TeacherPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_') || err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.warn('TeacherPage getCurrentUser error:', err);
  }
  if (!user) redirect('/login');
  if (user.role !== 'teacher') redirect(homePathForRole(user.role));

  const { usingMock, courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);
  const leaves = await getTeacherLeaves(user.id, usingMock);

  return (
    <TeacherDashboard
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
    />
  );
}
