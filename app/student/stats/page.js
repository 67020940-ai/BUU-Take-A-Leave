import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStudentData } from '@/lib/studentData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StudentStatsView from './stats-view';

export const metadata = {
  title: 'สถิติการลาเรียน | BUU Take A Leave',
  description: 'สถิติและภาพรวมการลาเรียนแยกตามประเภทและภาคการศึกษา มหาวิทยาลัยบูรพา',
};

export default async function StudentStatsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const { summaries = [], leaves = [] } = await getStudentData(user.id);

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
        <StudentStatsView summaries={summaries} leaves={leaves} />
      </main>

      <Footer role={user.role} />
    </div>
  );
}
