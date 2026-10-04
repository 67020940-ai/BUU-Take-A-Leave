import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import WireframeStatsView from './wireframe-stats-view';

export const metadata = {
  title: 'สถิติการลาเรียนอาจารย์ผู้สอน | Take A Leave',
  description: 'แดชบอร์ดสถิติและการวิเคราะห์การลาเรียนของนิสิต มหาวิทยาลัยบูรพา',
};

export default async function TeacherStatsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

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
