import Link from 'next/link';

const SUPPORT_HREF = { student: '/support', teacher: '/support', admin: '/admin' };

export default function Footer({ role, semester = '1/2569' }) {
  const supportHref = SUPPORT_HREF[role] || '/support';

  return (
    <footer className="mt-auto border-t border-neutral-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-neutral-800 dark:text-neutral-200">BUU e-Leave</span>
          <span>·</span>
          <span>ระบบลาเรียนออนไลน์ มหาวิทยาลัยบูรพา</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href={supportHref} className="hover:text-[#7749BC] dark:hover:text-purple-300 hover:underline">
            แจ้งข้อผิดพลาดระบบ (Support)
          </Link>
          <span>·</span>
          <span>ภาคการศึกษา {semester}</span>
        </div>
      </div>
    </footer>
  );
}
