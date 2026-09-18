'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquareWarning,
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  FileEdit,
  ClipboardCheck,
  History,
  CalendarDays,
  BarChart3,
} from 'lucide-react';
import { formatThaiDate } from '@/lib/ui';

const NAV = {
  student: [
    { href: '/student', label: 'หน้าหลัก', icon: LayoutDashboard },
    { href: '/student/leave', label: 'ยื่นใบลา', icon: FileEdit },
    { href: '/student/history', label: 'ประวัติการลา', icon: History },
    { href: '/student/schedule', label: 'ตารางเรียน', icon: CalendarDays },
    { href: '/student/stats', label: 'สถิติการลา', icon: BarChart3 },
  ],
  teacher: [
    { href: '/teacher', label: 'คำร้องรออนุมัติ', icon: ClipboardCheck },
    { href: '/teacher/history', label: 'ประวัติการอนุมัติ', icon: History },
  ],
  admin: [{ href: '/admin', label: 'ภาพรวมระบบ', icon: ShieldCheck }],
};

const ROLE_LABEL = { student: 'นิสิต', teacher: 'อาจารย์ผู้สอน', admin: 'ผู้ดูแลระบบ' };

export default function Header({ user, semester = '1/2569' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (active && data.notifications) setNotifications(data.notifications);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

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

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const links = NAV[user.role] || [];
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl border-b border-neutral-200/80 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href={user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/student'}
            className="flex items-center space-x-3 group"
          >
            <div className="flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-purple-900/20 ring-2 ring-purple-300/30 group-hover:scale-105 transition-transform">
                BUU
              </div>
              <span className="text-[9px] font-bold text-[#7749BC] dark:text-purple-300 leading-tight mt-0.5 tracking-tight text-center">
                Take A Leave
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 tracking-tight text-base">Take A Leave</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
                ระบบยื่นและอนุมัติคำขอลาเรียนออนไลน์
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-neutral-700 dark:text-neutral-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/80 dark:border-slate-700 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
              <span>ภาคเรียน {semester}</span>
            </div>

            <Link
              href="/support"
              title="แจ้งข้อผิดพลาดของระบบ / ติดต่อฝ่ายสนับสนุน"
              className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-[#7749BC] dark:hover:text-purple-300 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-slate-700"
            >
              <MessageSquareWarning className="w-5 h-5" />
            </Link>

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowUserMenu(false);
                }}
                className="p-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-slate-700 relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#7749BC] text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 sm:max-w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 py-3 z-50">
                  <div className="px-4 pb-2.5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">การแจ้งเตือน</h4>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 font-medium px-2 py-0.5 rounded-full border border-purple-200/50">
                        {unreadCount} ใหม่
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100/60 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-neutral-400">ไม่มีรายการแจ้งเตือนในขณะนี้</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 cursor-pointer transition-all ${
                            !n.read ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5 shrink-0">
                              <div className="w-7 h-7 rounded-xl bg-purple-100 text-[#7749BC] dark:bg-purple-950/80 dark:text-purple-300 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/60">
                                {n.message.includes('อนุมัติแล้ว') ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : n.message.includes('ไม่อนุมัติ') ? (
                                  <AlertCircle className="w-4 h-4" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-neutral-400">{formatThaiDate(n.createdAt)}</span>
                            </div>
                            {n.link && <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu((v) => !v);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 p-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors border border-neutral-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-[#7749BC] text-white flex items-center justify-center text-[11px] font-bold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[130px]">
                    {user.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{ROLE_LABEL[user.role]}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 p-5 z-50">
                  <div className="flex items-start space-x-3 pb-4 border-b border-neutral-100 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-[#7749BC] text-white flex items-center justify-center text-base font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{user.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                      <span className="inline-block mt-2 text-[11px] bg-purple-50 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 px-2.5 py-0.5 rounded-full font-medium border border-purple-200 dark:border-purple-800">
                        {ROLE_LABEL[user.role]}
                      </span>
                    </div>
                  </div>

                  {(user.faculty || user.major) && (
                    <div className="py-4 border-b border-neutral-100 dark:border-slate-800">
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500">สังกัด / คณะ</p>
                      {user.faculty && (
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 leading-snug">{user.faculty}</p>
                      )}
                      {user.major && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{user.major}</p>}
                    </div>
                  )}

                  <div className="py-3.5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">สถานะการเข้าสู่ระบบ</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full mt-4 flex items-center justify-center space-x-1.5 px-4 py-3 rounded-full text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 text-sm font-bold transition-colors cursor-pointer border border-rose-200/70 dark:border-rose-800"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ (Sign Out)</span>
                  </button>

                  <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-500 mt-3">{today}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {links.length > 0 && (
          <nav className="flex items-center gap-1.5 sm:gap-2 py-2.5 border-t border-neutral-100 dark:border-slate-800/80 overflow-x-auto">
            {links.map((l) => {
              const isHashLink = l.href.includes('#');
              const active = isHashLink ? false : pathname === l.href;
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={(e) => {
                    if (isHashLink && pathname === '/student') {
                      e.preventDefault();
                      const targetId = l.href.split('#')[1];
                      const el = document.getElementById(targetId);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? 'bg-[#7749BC] text-white shadow-sm shadow-purple-800/25'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-[#7749BC] dark:hover:text-purple-300'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
