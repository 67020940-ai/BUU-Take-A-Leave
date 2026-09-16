import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLeave } from '@/lib/db';
import { getStudentData } from '@/lib/studentData';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import LeaveForm from './leave-form';
import { FileEdit } from 'lucide-react';

export default async function StudentLeavePage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const { courses } = await getStudentData(user.id);
  const { courseId, resubmit } = await searchParams;

  let resubmitLeave = null;
  if (resubmit) {
    const original = await getLeave(resubmit);
    if (original && original.studentId === user.id && original.status === 'ยกเลิก') {
      resubmitLeave = original;
    }
  }

  const effectiveCourseId = resubmitLeave?.courseId || courseId;
  const lockCourse = courses.some((c) => c.id === effectiveCourseId);
  const initialCourseId = lockCourse ? effectiveCourseId : courses[0]?.id || '';

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={{ name: user.name, role: user.role, email: user.email, faculty: user.faculty || 'วิทยาการสารสนเทศ', major: user.major || 'เทคโนโลยีสารสนเทศ' }} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          icon={FileEdit}
          eyebrow="นิสิต ม.บูรพา"
          title="ยื่นคำขอลาเรียน"
          subtitle="กรอกรายละเอียดให้ครบถ้วน ระบบจะแจ้งอาจารย์ผู้สอนทันที"
        />
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <LeaveForm
            courses={courses}
            initialCourseId={initialCourseId}
            lockCourse={lockCourse}
            resubmitId={resubmitLeave?.id || null}
            initialValues={
              resubmitLeave
                ? {
                    type: resubmitLeave.type,
                    period: resubmitLeave.period,
                    startDate: resubmitLeave.startDate,
                    endDate: resubmitLeave.endDate,
                    reason: resubmitLeave.reason,
                    attachment: resubmitLeave.attachment,
                  }
                : null
            }
          />
        </div>
      </main>
      <Footer role={user.role} />
    </div>
  );
}
