import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getStudentData } from '@/lib/studentData';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  FileEdit,
  History,
  CalendarDays,
  BarChart3,
  ArrowUpRight,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { initials } from '@/lib/ui';

export default async function StudentPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'student') redirect('/login');

  const { summaries = [], leaves = [] } = await getStudentData(user.id);

  const pendingLeaves = leaves.filter((l) => l.status === 'รออนุมัติ');
  const approvedLeaves = leaves.filter((l) => l.status === 'อนุมัติ');
  const activeSemester = '1/2569';

  const menuItems = [
    {
      id: 'leave',
      href: '/student/leave',
      title: 'ยื่นใบลา',
      englishTitle: 'Submit Leave Request',
      description: 'กรอกแบบฟอร์มขอลาเรียนออนไลน์ แนบหลักฐาน ส่งถึงอาจารย์ผู้สอน',
      icon: FileEdit,
      color: 'from-purple-500 to-indigo-600',
      badge: 'ส่งคำขอใหม่',
      badgeCls: 'bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300',
      accentBorder: 'hover:border-[#7749BC] dark:hover:border-purple-500',
      iconBg: 'bg-[#7749BC] text-white',
    },
    {
      id: 'history',
      href: '/student/history',
      title: 'ประวัติการลา',
      englishTitle: 'Leave History & Status',
      description: 'ตรวจสอบสถานะคำขอลา รายละเอียดการพิจารณา และยกเลิก/ยื่นใหม่',
      icon: History,
      color: 'from-amber-500 to-orange-600',
      badge: pendingLeaves.length > 0 ? `รออนุมัติ ${pendingLeaves.length} รายการ` : `ทั้งหมด ${leaves.length} รายการ`,
      badgeCls:
        pendingLeaves.length > 0
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          : 'bg-neutral-100 text-neutral-600 dark:bg-slate-800 dark:text-neutral-300',
      accentBorder: 'hover:border-amber-500 dark:hover:border-amber-500',
      iconBg: 'bg-amber-500 text-white',
    },
    {
      id: 'schedule',
      href: '/student/schedule',
      title: 'ตารางเรียน',
      englishTitle: 'Schedule & Attendance',
      description: 'ตารางเรียนรายสัปดาห์ ห้องเรียน ผู้สอน และโควต้าเวลาเรียน 80%',
      icon: CalendarDays,
      color: 'from-sky-500 to-blue-600',
      badge: `${summaries.length} รายวิชาที่ลงทะเบียน`,
      badgeCls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
      accentBorder: 'hover:border-sky-500 dark:hover:border-sky-500',
      iconBg: 'bg-sky-600 text-white',
    },
    {
      id: 'stats',
      href: '/student/stats',
      title: 'สถิติการลา',
      englishTitle: 'Leave Statistics & Analytics',
      description: 'สถิติการลาแยกตามประเภท กิจกรรม ป่วย กิจ และการเปรียบเทียบย้อนหลัง',
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-600',
      badge: `อนุมัติแล้ว ${approvedLeaves.length} ครั้ง`,
      badgeCls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      accentBorder: 'hover:border-emerald-500 dark:hover:border-emerald-500',
      iconBg: 'bg-emerald-600 text-white',
    },
  ];

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
        semester={activeSemester}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center justify-center">
        {/* Main Portal Container */}
        <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl sm:rounded-[36px] border border-neutral-200/80 dark:border-slate-800 shadow-xl shadow-purple-950/5 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
            {/* ================= LEFT COLUMN: HELLO & STUDENT PROFILE ================= */}
            <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-200/80 dark:border-slate-800 bg-gradient-to-br from-purple-50/40 via-white to-neutral-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900">
              <div className="space-y-6">
                {/* Handwritten Cursive "Hello" matching sketch S__29253653.jpg */}
                <div>
                  <h1 className="font-cursive text-5xl sm:text-6xl text-[#7749BC] dark:text-purple-400 font-bold tracking-wide -rotate-2 select-none">
                    Hello
                  </h1>
                  <div className="h-1 w-16 bg-[#7749BC] dark:bg-purple-500 rounded-full mt-1.5 opacity-80" />
                </div>

                {/* Student Avatar & Basic Identity */}
                <div className="flex items-start gap-4 pt-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#7749BC] to-purple-400 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg shadow-purple-800/20 shrink-0 ring-4 ring-purple-100 dark:ring-purple-950">
                    {initials(user.name)}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-[#7749BC] dark:bg-purple-950 dark:text-purple-300">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>นิสิตระดับปริญญาตรี</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {user.name}
                    </h2>
                    <p className="text-xs sm:text-sm font-mono font-medium text-neutral-500 dark:text-neutral-400">
                      รหัสนิสิต {user.studentId || '66000001'}
                    </p>
                  </div>
                </div>

                {/* Faculty & Major Card */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-neutral-200/80 dark:border-slate-700/80 space-y-2 shadow-xs">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      คณะ (Faculty)
                    </p>
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      คณะ{user.faculty || 'วิทยาการสารสนเทศ'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-neutral-100 dark:border-slate-700/60 space-y-1">
                    <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      สาขาวิชา (Major)
                    </p>
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      สาขาวิชา{user.major || 'เทคโนโลยีสารสนเทศ'}
                    </p>
                  </div>
                </div>

                {/* Academic Term Badge */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-xs">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <Clock className="w-4 h-4 text-[#7749BC] dark:text-purple-400" />
                    <span className="font-medium">ภาคการศึกษาปัจจุบัน:</span>
                  </div>
                  <span className="font-bold text-[#7749BC] dark:text-purple-300 px-2.5 py-0.5 rounded-lg bg-white dark:bg-slate-900 shadow-2xs border border-purple-200/60 dark:border-purple-900">
                    ภาคเรียนที่ {activeSemester}
                  </span>
                </div>
              </div>

              {/* Bottom Notification / Tip for Students */}
              <div className="pt-6 mt-6 border-t border-neutral-200/60 dark:border-slate-800/80 text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  สามารถเลือกเมนูด้านขวาเพื่อยื่นใบลา ตรวจสอบสถานะ เช็คตารางเรียน และสถิติการลาได้ทันที
                </p>
              </div>
            </div>

            {/* ================= RIGHT COLUMN: MENU. 2x2 GRID ================= */}
            <div className="lg:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white/50 dark:bg-slate-900/50">
              {/* Handwritten Cursive "Menu." header matching sketch S__29253653.jpg */}
              <div className="mb-6 sm:mb-8 flex items-center justify-between">
                <div>
                  <h3 className="font-cursive text-4xl sm:text-5xl text-neutral-800 dark:text-neutral-100 font-bold tracking-wide -rotate-1 select-none">
                    Menu.
                  </h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    เลือกบริการที่ต้องการเข้าใช้งาน
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-slate-700">
                  4 เมนูหลัก
                </span>
              </div>

              {/* 2x2 Menu Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group relative p-5 sm:p-6 rounded-3xl border border-neutral-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between min-h-[170px] ${item.accentBorder}`}
                    >
                      <div>
                        {/* Top: Icon & Arrow */}
                        <div className="flex items-center justify-between mb-3.5">
                          <div
                            className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-md shadow-neutral-900/10 transition-transform group-hover:scale-105`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-slate-700/60 flex items-center justify-center text-neutral-400 group-hover:text-[#7749BC] dark:group-hover:text-purple-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-950 transition-colors">
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-[#7749BC] dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                          <span>{item.title}</span>
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Bottom Badge */}
                      <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${item.badgeCls}`}>
                          {item.badge}
                        </span>
                        <span className="text-[11px] font-medium text-neutral-400 group-hover:text-[#7749BC] dark:group-hover:text-purple-400 transition-colors">
                          เข้าใช้งาน →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer role={user.role} />
    </div>
  );
}
