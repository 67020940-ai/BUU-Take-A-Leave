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

  let courses = [];
  let rosterByCourse = {};
  let usingMock = true;
  let leaves = [];

  try {
    const [courseData, leavesData] = await Promise.all([
      getTeacherCoursesAndRoster(user.id).catch((err) => {
        console.warn('TeacherStatsPage getTeacherCoursesAndRoster error:', err);
        return {};
      }),
      getTeacherLeaves(user.id, false).catch((err) => {
        console.warn('TeacherStatsPage getTeacherLeaves error:', err);
        return [];
      }),
    ]);
    courses = courseData.courses || [];
    rosterByCourse = courseData.rosterByCourse || {};
    usingMock = Boolean(courseData.usingMock);
    leaves = leavesData || [];
  } catch (err) {
    console.warn('TeacherStatsPage data fetch error:', err);
  }

  return (
    <WireframeStatsView
      user={{
        name: user.name || 'อาจารย์ผู้สอน',
        role: user.role || 'teacher',
        email: user.email || '',
        faculty: user.faculty || 'คณะวิทยาการสารสนเทศ',
        major: user.major || 'ภาควิชาการจัดการสารสนเทศ',
      }}
      courses={courses}
      leaves={leaves}
      rosterByCourse={rosterByCourse}
    />
  );
}
