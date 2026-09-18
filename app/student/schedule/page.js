import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudentData } from '@/lib/studentData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StudentScheduleView from './schedule-view';

export const metadata = {
  title: 'ตารางเรียนและโควต้าเวลาเรียน | BUU Take A Leave',
  description: 'ตารางเรียนรายสัปดาห์ เวลาเรียน ห้องเรียน และโควต้าเวลาเรียน มหาวิทยาลัยบูรพา',
};

export default async function StudentSchedulePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const { summaries = [] } = await getStudentData(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 dark:bg-slate-950">
      <Header
        user={{
          name: user.name,
          role: user.role,
          email: user.email,
          faculty: user.faculty || 'วิทยาการสารสนเทศ',
          major: user.major || 'เทคโนโลยีสารสนเทศ',
        }}
        semester="1/2569"
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentScheduleView summaries={summaries} />
      </main>

      <Footer role={user.role} />
    </div>
  );
}
