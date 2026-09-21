import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TeacherStatsView from './teacher-stats-view';

export const metadata = {
  title: 'สถิติการลาเรียนอาจารย์ผู้สอน | BUU Take A Leave',
  description: 'แดชบอร์ดสถิติและการวิเคราะห์การลาเรียนของนิสิต มหาวิทยาลัยบูรพา',
};

export default async function TeacherStatsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

  const { usingMock, courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);
  const leaves = await getTeacherLeaves(user.id, usingMock);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-slate-950">
      <Header
        user={{
          name: user.name,
          role: user.role,
          email: user.email,
          faculty: user.faculty || 'คณะวิทยาการสารสนเทศ',
          major: user.major || 'ภาควิชาการจัดการสารสนเทศ',
        }}
        semester="1/2569"
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherStatsView
          courses={courses}
          leaves={leaves}
          rosterByCourse={rosterByCourse}
        />
      </main>

      <Footer role={user.role} />
    </div>
  );
}
