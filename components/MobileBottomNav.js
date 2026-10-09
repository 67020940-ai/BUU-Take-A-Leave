'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileEdit,
  CalendarDays,
  History,
  ClipboardCheck,
  BarChart3,
  BookOpen,
  LifeBuoy,
  FileText,
  User,
  Menu,
} from 'lucide-react';

export default function MobileBottomNav({
  role = 'student', // 'student' | 'teacher' | 'admin'
  activeTab = 'home',
  onSelectTab,
  onOpenDrawer,
  pendingCount = 0,
}) {
  const pathname = usePathname();
  const router = useRouter();

  let items = [];

  if (role === 'student') {
    items = [
      { key: 'home', label: 'หน้าหลัก', icon: LayoutDashboard, href: '/student' },
      { key: 'leave', label: 'ยื่นใบลา', icon: FileEdit, href: '/student?tab=leave' },
      { key: 'schedule', label: 'ตารางเรียน', icon: CalendarDays, href: '/student?tab=schedule' },
      { key: 'history', label: 'ประวัติ', icon: History, href: '/student?tab=history', badge: pendingCount },
      { key: 'more', label: 'เพิ่มเติม', icon: Menu, isAction: true },
    ];
  } else if (role === 'teacher') {
    items = [
      { key: 'home', label: 'หน้าหลัก', icon: LayoutDashboard, href: '/teacher' },
      { key: 'requests', label: 'คำขอลา', icon: ClipboardCheck, href: '/teacher/requests', badge: pendingCount },
      { key: 'stats', label: 'สถิติ', icon: BarChart3, href: '/teacher/stats' },
      { key: 'history', label: 'ประวัติ', icon: History, href: '/teacher/history' },
      { key: 'schedule', label: 'ตารางสอน', icon: CalendarDays, href: '/teacher/schedule' },
    ];
  } else if (role === 'admin') {
    items = [
      { key: 'overview', label: 'ภาพรวม', icon: LayoutDashboard, href: '/admin' },
      { key: 'leaves', label: 'คำร้องลา', icon: FileText, href: '/admin?tab=leaves' },
      { key: 'courses', label: 'รายวิชา', icon: BookOpen, href: '/admin?tab=courses' },
      { key: 'tickets', label: 'ปัญหา', icon: LifeBuoy, href: '/admin?tab=tickets', badge: pendingCount },
      { key: 'more', label: 'เมนู', icon: Menu, isAction: true },
    ];
  }

  function handleItemClick(item, e) {
    if (item.isAction) {
      e?.preventDefault();
      if (onOpenDrawer) onOpenDrawer();
      return;
    }
    if (onSelectTab) {
      e?.preventDefault();
      onSelectTab(item.key);
      if (item.href && pathname !== item.href.split('?')[0]) {
        router.push(item.href);
      }
    }
  }

  return (
    <nav
      aria-label="เมนูหลักสำหรับมือถือ"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-slate-800 shadow-xl transition-all"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="flex items-center justify-around px-1 pt-1.5 pb-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.key ||
            (!item.isAction && pathname === item.href);

          return (
            <button
              key={item.key}
              type="button"
              onClick={(e) => handleItemClick(item, e)}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative select-none ${
                isActive
                  ? 'text-[#7749BC] dark:text-purple-400 font-bold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 truncate max-w-full leading-none tracking-tight ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#7749BC] dark:bg-purple-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
