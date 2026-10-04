import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import TeacherDashboard from './teacher-dashboard';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';

export const metadata = {
  title: 'ระบบอาจารย์ผู้สอน | Take A Leave',
  description: 'ระบบยื่นและอนุมัติคำขอลาเรียนออนไลน์ มหาวิทยาลัยบูรพา',
};

export default async function TeacherPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

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
