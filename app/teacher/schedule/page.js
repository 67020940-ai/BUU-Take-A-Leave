import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import TeacherScheduleView from './teacher-schedule-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'ตารางสอนและการเตรียมการสอน | Take A Leave',
  description: 'ตารางเรียน แผนการสอนรายสัปดาห์ และเนื้อหาเตรียมการสอนนิสิต มหาวิทยาลัยบูรพา',
};

export default async function TeacherSchedulePage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_') || err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.warn('TeacherSchedulePage getCurrentUser error:', err);
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
        console.warn('TeacherSchedulePage getTeacherCoursesAndRoster error:', err);
        return {};
      }),
      getTeacherLeaves(user.id, false).catch((err) => {
        console.warn('TeacherSchedulePage getTeacherLeaves error:', err);
        return [];
      }),
    ]);
    courses = courseData.courses || [];
    rosterByCourse = courseData.rosterByCourse || {};
    usingMock = Boolean(courseData.usingMock);
    leaves = leavesData || [];
  } catch (err) {
    console.warn('TeacherSchedulePage data fetch error:', err);
  }

  return (
    <TeacherScheduleView
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
      usingMock={usingMock}
    />
  );
}
