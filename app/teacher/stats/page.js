import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import WireframeStatsView from './wireframe-stats-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'สถิติการลาเรียนอาจารย์ผู้สอน | Take A Leave',
  description: 'แดชบอร์ดสถิติและการวิเคราะห์การลาเรียนของนิสิต มหาวิทยาลัยบูรพา',
};

export default async function TeacherStatsPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_') || err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.warn('TeacherStatsPage getCurrentUser error:', err);
  }
  if (!user) redirect('/login');
  if (user.role !== 'teacher') redirect(homePathForRole(user.role));

  const { usingMock, courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);
  const leaves = await getTeacherLeaves(user.id, usingMock);

  return (
    <WireframeStatsView
      user={{
        name: user.name,
        role: user.role,
        email: user.email,
        faculty: user.faculty || 'คณะวิทยาการสารสนเทศ',
        major: user.major || 'ภาควิชาการจัดการสารสนเทศ',
      }}
      courses={courses}
      leaves={leaves}
      rosterByCourse={rosterByCourse}
    />
  );
}
