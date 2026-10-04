'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileEdit,
  History,
  CalendarDays,
  BarChart3,
  HelpCircle,
  Settings,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import BuuLogo from '@/components/BuuLogo';
import SettingsModal from '@/components/SettingsModal';
import SupportModal from '@/components/SupportModal';

export default function StudentSidebar({
  activeTab = 'home', // 'home' | 'leave' | 'history' | 'schedule' | 'stats'
  onSelectTab,
  pendingCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
    router.refresh();
  }

  const navItems = [
    {
      key: 'home',
      label: 'หน้าหลัก',
      href: '/student',
      icon: LayoutDashboard,
    },
    {
      key: 'leave',
      label: 'ยื่นคำขอลาเรียน',
      href: '/student/leave',
      icon: FileEdit,
    },
    {
      key: 'stats',
      label: 'สถิติเวลาเรียน',
      href: '/student/stats',
      icon: BarChart3,
    },
    {
      key: 'history',
      label: 'ประวัติการลา',
      href: '/student/history',
      icon: History,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      key: 'schedule',
      label: 'ตารางเรียน',
      href: '/student/schedule',
      icon: CalendarDays,
    },
  ];

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-neutral-200/80 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64 sm:w-68'}`}
      >
        {/* Top Header: Logo + Take A Leave + Collapse Button */}
        <div>
          <div className="h-20 px-4 sm:px-5 flex items-center justify-between border-b border-neutral-100 dark:border-slate-800/80">
            <Link
              href="/student"
              onClick={onCloseMobile}
              className="flex items-center gap-3 group min-w-0"
              title="หน้าแรกนิสิต Take A Leave"
            >
              <BuuLogo size={36} className="shrink-0 group-hover:scale-105 transition-transform" />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight text-base leading-none group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors truncate">
                    Take A Leave
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-medium truncate">
                    นิสิตมหาวิทยาลัยบูรพา
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop collapse toggle / Mobile close */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="ปิดเมนู"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Links Body */}
          <div className="p-3 sm:p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            <div className="space-y-1.5">
              {!collapsed ? (
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
                  <span className="text-[#7749BC] dark:text-purple-400">Menu :</span>
                </h3>
              ) : (
                <div className="h-4" />
              )}

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.key ||
                    pathname === item.href ||
                    (item.key === 'home' && pathname === '/student');

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => {
                        if (onCloseMobile) onCloseMobile();
                        if (onSelectTab) onSelectTab(item.key);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                      }`}
                      title={item.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ──────── Help & Setting Section ──────── */}
            <div className="pt-3 border-t border-neutral-100 dark:border-slate-800/80 space-y-1.5">
              {!collapsed && (
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Help & Setting :
                </h3>
              )}

              <nav className="flex flex-col gap-1">
                {/* แจ้งปัญหาระบบ */}
                <button
                  type="button"
                  onClick={() => setShowSupport(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  title="แจ้งปัญหาระบบ"
                >
                  <HelpCircle className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  {!collapsed && <span className="truncate">แจ้งปัญหาระบบ</span>}
                </button>

                {/* การตั้งค่า */}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  title="การตั้งค่า"
                >
                  <Settings className="w-4 h-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                  {!collapsed && <span className="truncate">การตั้งค่า</span>}
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Section: Log out Button */}
        <div className="p-3 sm:p-4 border-t border-neutral-100 dark:border-slate-800/80 bg-neutral-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 transition-all cursor-pointer text-left shadow-xs"
            title="Log out (ออกจากระบบ)"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate font-sans font-bold">Log out</span>}
          </button>
        </div>
      </aside>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Support Modal */}
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </>
  );
}
