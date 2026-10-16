import { redirect } from 'next/navigation';
import { getCurrentUser, homePathForRole } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import TeacherHistoryView from './teacher-history-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'ประวัติการอนุมัติ | Take A Leave',
  description: 'ประวัติและบันทึกการพิจารณาคำขอลาเรียนย้อนหลัง มหาวิทยาลัยบูรพา',
};

export default async function TeacherHistoryPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (err) {
    if (err?.digest?.startsWith('NEXT_') || err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
    console.warn('TeacherHistoryPage getCurrentUser error:', err);
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
    console.warn('TeacherHistoryPage getTeacherCoursesAndRoster error:', err);
  }

  try {
    leaves = await getTeacherLeaves(user.id, usingMock);
  } catch (err) {
    console.warn('TeacherHistoryPage getTeacherLeaves error:', err);
  }

  return (
    <TeacherHistoryView
      user={{
        name: user.name || 'อาจารย์ผู้สอน',
        role: user.role || 'teacher',
        email: user.email || '',
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
