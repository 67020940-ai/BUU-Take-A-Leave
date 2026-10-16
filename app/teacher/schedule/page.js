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
    const data = await getTeacherCoursesAndRoster(user.id);
    courses = data.courses || [];
    rosterByCourse = data.rosterByCourse || {};
    usingMock = Boolean(data.usingMock);
  } catch (err) {
    console.warn('TeacherSchedulePage getTeacherCoursesAndRoster error:', err);
  }

  try {
    leaves = await getTeacherLeaves(user.id, usingMock);
  } catch (err) {
    console.warn('TeacherSchedulePage getTeacherLeaves error:', err);
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
