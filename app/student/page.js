import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getAttendanceSummary, getCourse, listCoursesForStudent, listLeavesForStudent } from '@/lib/db';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import StudentDashboard from './student-dashboard';
import { LayoutDashboard, Plus } from 'lucide-react';

export default async function StudentPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const courses = await listCoursesForStudent(user.id);
  const rawSummaries = await Promise.all(courses.map((c) => getAttendanceSummary(user.id, c.id)));
  const summaries = rawSummaries.filter(Boolean);

  const rawLeaves = await listLeavesForStudent(user.id);
  const leaves = await Promise.all(
    rawLeaves.map(async (l) => {
      const course = await getCourse(l.courseId);
      return {
        ...l,
        courseCode: course?.code || '',
        courseName: course ? `${course.code} ${course.name}` : '-',
        courseTitle: course?.name || '',
        courseTerm: course?.term || '',
        courseGroup: course?.group || '',
        teacherName: course?.teacher?.name || course?.teacherName || '',
      };
    })
  );

  const profileLine = [
    `รหัสนิสิต ${user.studentId || '-'}`,
    user.faculty && `คณะ${user.faculty}`,
    user.major && `สาขา${user.major}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ name: user.name, role: user.role, email: user.email, faculty: user.faculty, major: user.major }} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <PageHeader
          icon={LayoutDashboard}
          eyebrow="ระบบสารสนเทศนิสิต ม.บูรพา"
          title={`สวัสดี, ${user.name}`}
          subtitle={profileLine}
          action={
            <Link
              href="/student/leave"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] active:scale-95 text-white font-bold text-sm shadow-md shadow-purple-800/25 transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>ยื่นคำขอลาเรียนใหม่</span>
            </Link>
          }
        />

        <StudentDashboard summaries={summaries} leaves={leaves} />
      </main>
      <Footer role={user.role} />
    </div>
  );
}
