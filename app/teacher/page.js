import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import TeacherDashboard from './teacher-dashboard';
import { GraduationCap, Clock, BookOpen, Users, AlertTriangle } from 'lucide-react';
import { getTeacherCoursesAndRoster, getTeacherLeaves } from '@/lib/teacherData';

export default async function TeacherPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'teacher') redirect('/login');

  // ใช้ข้อมูลตัวอย่าง (mock) แทนเฉพาะตอนที่อาจารย์คนนี้ยังไม่มีวิชาที่ผูกไว้จริงในระบบ
  const { usingMock, courses, rosterByCourse } = await getTeacherCoursesAndRoster(user.id);
  const leaves = await getTeacherLeaves(user.id, usingMock);
  const pendingLeaves = leaves.filter((l) => l.status === 'รออนุมัติ');

  const totalStudents = Object.values(rosterByCourse).reduce((sum, rows) => sum + rows.length, 0);
  const overQuotaCount = Object.values(rosterByCourse).reduce(
    (sum, rows) => sum + rows.filter((r) => r.overQuota).length,
    0
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ name: user.name, role: user.role, email: user.email, faculty: user.faculty, major: user.major }} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHeader
          icon={GraduationCap}
          eyebrow="อาจารย์ผู้สอนประจำรายวิชา ม.บูรพา"
          title={`สวัสดี, ${user.name}`}
          subtitle={[user.faculty, user.major].filter(Boolean).join(' • ')}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>คำร้องรอพิจารณา</span>
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{pendingLeaves.length}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">รายการ</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">จากทั้งหมด {leaves.length} รายการ</p>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>วิชาที่รับผิดชอบ</span>
              <BookOpen className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{courses.length}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">รายวิชา</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">รวมทุกกลุ่มเรียนที่สอน</p>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>นิสิตในความดูแล</span>
              <Users className="w-4 h-4 text-sky-500 shrink-0" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{totalStudents}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">คน</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">รวมทุกรายวิชาที่สอน</p>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>เกินโควต้าการลา</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{overQuotaCount}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">คน</span>
            </div>
            <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium mt-1">ควรติดตามเป็นพิเศษ</p>
          </div>
        </div>

        <TeacherDashboard courses={courses} initialLeaves={leaves} rosterByCourse={rosterByCourse} usingMock={usingMock} />
      </main>
      <Footer role={user.role} />
    </div>
  );
}
