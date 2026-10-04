'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  GraduationCap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function StudentTopBar({
  user,
  semester = '1/2569',
  onSemesterChange,
  availableSemesters = ['1/2569', '2/2568', '1/2568'],
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'ค้นหารหัสวิชา, ชื่อวิชา, หรือห้องเรียน...',
  onToggleMobileSidebar,
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (active && data.notifications) setNotifications(data.notifications);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function handleNotificationClick(n) {
    markRead(n.id);
    setShowNotifications(false);
    if (n.link) router.push(n.link);
  }

  function handlePrevSemester() {
    const idx = availableSemesters.indexOf(semester);
    if (idx !== -1 && idx < availableSemesters.length - 1) {
      if (onSemesterChange) onSemesterChange(availableSemesters[idx + 1]);
    }
  }

  function handleNextSemester() {
    const idx = availableSemesters.indexOf(semester);
    if (idx > 0) {
      if (onSemesterChange) onSemesterChange(availableSemesters[idx - 1]);
    }
  }

  const studentName = user?.name || 'นิสิต';
  const studentInitials = studentName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  const studentId = user?.studentId || (user?.email ? user.email.split('@')[0] : '');

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Mobile Menu Toggle & Semester Selector: ภาคเรียนที่ < 1/2569 > */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="เปิดเมนูด้านข้าง"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* ภาคเรียนที่ < 1/2569 > */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-neutral-200/70 dark:border-slate-700 shadow-2xs">
            <span className="font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              ภาคเรียนที่
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevSemester}
                className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                title="ภาคเรียนก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="font-mono font-bold text-[#7749BC] dark:text-purple-300 px-1">
                {semester}
              </span>

              <button
                type="button"
                onClick={handleNextSemester}
                className="p-1 rounded-md hover:bg-white dark:hover:bg-slate-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                title="ภาคเรียนถัดไป"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Search Bar (Purple Rounded Pill matching Teacher wireframe) */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-4 pr-10 py-2 sm:py-2.5 rounded-full bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-purple-400 dark:placeholder:text-purple-500/70 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/40 focus:border-[#7749BC] transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-[#7749BC] dark:text-purple-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Theme Toggle, Notification Bell & Student Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle (Dark / Light Mode) */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-2xl bg-neutral-100/80 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-neutral-600 dark:text-neutral-300 hover:text-[#7749BC] dark:hover:text-purple-300 border border-neutral-200/70 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
              title="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">การแจ้งเตือน</h4>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-neutral-400">ไม่มีการแจ้งเตือนใหม่</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          n.read
                            ? 'bg-neutral-50/60 dark:bg-slate-800/40 border-neutral-200/60 dark:border-slate-800 text-neutral-500'
                            : 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-neutral-900 dark:text-neutral-100 font-semibold'
                        }`}
                      >
                        <p className="text-xs">{n.message || n.title}</p>
                        <span className="text-[10px] text-neutral-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Avatar with Name & Code */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#7749BC] to-[#582B9E] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shadow-purple-900/20 shrink-0">
              {studentInitials || <User className="w-4 h-4" />}
            </div>
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[120px]">
                {studentName}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate font-mono">
                {studentId ? `${studentId}` : user?.faculty || 'คณะวิทยาการสารสนเทศ'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
