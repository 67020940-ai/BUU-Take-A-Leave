import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import HistoryList from './history-list';
import { History, AlertTriangle } from 'lucide-react';

export default async function TeacherHistoryPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

  const { usingMock } = await getTeacherCoursesAndRoster(user.id);
  const leaves = await getTeacherLeaves(user.id, usingMock);
  const approvalHistory = leaves.filter((l) => l.status === 'อนุมัติ' || l.status === 'ไม่อนุมัติ');

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ name: user.name, role: user.role, email: user.email, faculty: user.faculty, major: user.major }} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHeader
          icon={History}
          eyebrow="อาจารย์ผู้สอนประจำรายวิชา ม.บูรพา"
          title="ประวัติการอนุมัติของฉัน"
          subtitle="ย้อนดูคำร้องลาเรียนที่เคยตัดสินใจแล้วทั้งหมด พร้อมหมายเหตุที่เคยให้ไว้"
        />

        {usingMock && (
          <div className="flex items-start sm:items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              กำลังแสดง<strong>ข้อมูลตัวอย่าง (Mock)</strong> — ยังไม่มีรายวิชาที่ผูกกับบัญชีอาจารย์นี้จริงในระบบ
              เมื่อเชื่อมข้อมูลจริงแล้วหน้านี้จะเปลี่ยนไปแสดงข้อมูลจริงโดยอัตโนมัติ
            </span>
          </div>
        )}

        <HistoryList leaves={approvalHistory} />
      </main>
      <Footer role={user.role} />
    </div>
  );
}
