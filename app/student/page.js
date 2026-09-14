import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getAttendanceSummary, getCourse, listCoursesForStudent, listLeavesForStudent } from '@/lib/db';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import LeaveHistoryList from '@/components/LeaveHistoryList';
import { DAY_LABEL_TH } from '@/lib/ui';
import {
  TrendingUp,
  CheckCircle2,
  BookOpen,
  LayoutDashboard,
  ChevronRight,
  Plus,
  CalendarClock,
  UserRound,
  MapPin,
  History,
} from 'lucide-react';

export default async function StudentPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const courses = await listCoursesForStudent(user.id);
  const summaries = await Promise.all(courses.map((c) => getAttendanceSummary(user.id, c.id)));
  const avgAttendance = summaries.length
    ? Math.round(summaries.reduce((acc, s) => acc + s.percentage, 0) / summaries.length)
    : 100;
  const approvedCount = summaries.reduce((acc, s) => acc + s.approvedLeaves, 0);

  const rawLeaves = await listLeavesForStudent(user.id);
  const leaves = await Promise.all(
    rawLeaves.map(async (l) => {
      const course = await getCourse(l.courseId);
      return { ...l, courseName: course ? `${course.code} ${course.name}` : '-' };
    })
  );
  const leavePendingCount = leaves.filter((l) => l.status === 'รออนุมัติ').length;

  const profileLine = [
    `รหัสนิสิต ${user.studentId}`,
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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>เวลาเรียนเฉลี่ยรวม</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{avgAttendance}%</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">เกณฑ์ ≥ 80%</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>ลาที่ได้รับอนุมัติ</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{approvedCount}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">ครั้งในเทอมนี้</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-neutral-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs mb-2">
              <span>วิชาที่ลงทะเบียน</span>
              <BookOpen className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{courses.length}</span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">รายวิชา</span>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            เวลาเรียนรายวิชา
          </h2>

          {summaries.length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-8 text-center shadow-xs">
              <BookOpen className="w-8 h-8 text-neutral-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">ยังไม่มีรายวิชาที่ลงทะเบียน</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">ติดต่อเจ้าหน้าที่ทะเบียนเพื่อลงทะเบียนรายวิชา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaries.map((s) => {
                const teacherName = s.course.teacher?.name || s.course.teacherName || null;
                const dayTime = s.course.day ? `${DAY_LABEL_TH[s.course.day] || s.course.day} ${s.course.time || ''} น.` : null;
                const room = s.course.room || null;
                const hasInfoBox = dayTime || room || teacherName;
                return (
                  <div
                    key={s.course.id}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-5 shadow-xs hover:border-[#7749BC]/60 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-slate-700">
                        {s.course.code}
                        {s.course.group && <span className="text-neutral-400"> • กลุ่ม {s.course.group}</span>}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                          s.overQuota
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        {s.percentage}%
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{s.course.name}</h3>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mb-3">ภาคเรียน {s.course.term}</p>

                    {hasInfoBox && (
                      <div className="rounded-2xl bg-neutral-50 dark:bg-slate-800/60 p-3 space-y-1.5 mb-3">
                        {dayTime && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <CalendarClock className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0" />
                            <span>{dayTime}</span>
                          </div>
                        )}
                        {room && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>ห้องเรียน {room}</span>
                          </div>
                        )}
                        {teacherName && (
                          <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                            <UserRound className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>ผู้สอน: {teacherName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-slate-800">
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        ลาแล้ว: {s.approvedLeaves} ครั้ง
                      </span>
                      <Link
                        href={`/student/leave?courseId=${s.course.id}`}
                        className="text-xs font-semibold text-[#7749BC] dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
                      >
                        <span>ยื่นลาวิชานี้</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
              <span>ประวัติการลา</span>
            </h2>
            {leaves.length > 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                ทั้งหมด {leaves.length} รายการ · อนุมัติแล้ว {approvedCount} · รออนุมัติ {leavePendingCount}
              </p>
            )}
          </div>
          <LeaveHistoryList leaves={leaves} />
        </section>
      </main>
      <Footer role={user.role} />
    </div>
  );
}
