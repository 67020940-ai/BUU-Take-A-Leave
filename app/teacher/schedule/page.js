import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import TeacherScheduleView from './teacher-schedule-view';

export const metadata = {
  title: 'ตารางสอนและการเตรียมการสอน | Take A Leave',
  description: 'ตารางเรียน แผนการสอนรายสัปดาห์ และเนื้อหาเตรียมการสอนนิสิต มหาวิทยาลัยบูรพา',
};

export default async function TeacherSchedulePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

  const { usingMock, courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);
  const leaves = await getTeacherLeaves(user.id, usingMock);

  return (
    <TeacherScheduleView
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
      usingMock={usingMock}
    />
  );
}
