import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import TeacherRequestsView from './teacher-requests-view';

export const metadata = {
  title: 'คำขอร้องลาเรียน | Take A Leave',
  description: 'ระบบพิจารณาและอนุมัติคำขอลาเรียนของนิสิต มหาวิทยาลัยบูรพา',
};

export default async function TeacherRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

  const { usingMock, courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);
  const leaves = await getTeacherLeaves(user.id, usingMock);

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
    />
  );
}
