'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  BarChart3,
  History,
  CalendarDays,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Archive,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import BuuLogo from '@/components/BuuLogo';
import SettingsModal from '@/components/SettingsModal';
import SupportModal from '@/components/SupportModal';

export default function TeacherSidebar({
  mode = 'menu', // 'menu' for Teacher Home, 'stats' for Leave Statistics
  activeTab = 'requests', // 'requests' | 'stats' | 'history' | 'schedule'
  onSelectTab, // callback for in-page navigation (e.g. scrollTo or switch view)
  subjects = [], // for stats mode: [{ key: 'SA', name: '...', code: '...' }, { key: 'OSS', ... }]
  selectedSubjectKey = 'SA',
  onSelectSubject,
  pendingCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(true);
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

  function handleTabClick(tabKey, targetHref) {
    if (onCloseMobile) onCloseMobile();
    if (onSelectTab) {
      onSelectTab(tabKey);
    }
    const targetBase = targetHref ? targetHref.split('?')[0] : '';
    if (targetHref && pathname !== targetBase) {
      router.push(targetHref);
    }
  }

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
              href="/teacher"
              onClick={onCloseMobile}
              className="flex items-center gap-3 group min-w-0"
              title="หน้าแรกอาจารย์ Take A Leave"
            >
              <BuuLogo size={36} className="shrink-0 group-hover:scale-105 transition-transform" />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight text-base leading-none group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors truncate">
                    Take A Leave
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-medium truncate">
                    อาจารย์ผู้สอน
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
            {/* ──────── MODE 1: MENU (Dashboard/Home) ──────── */}
            {mode === 'menu' && (
              <div className="space-y-1.5">
                {!collapsed ? (
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
                    <span className="text-[#7749BC] dark:text-purple-400">Menu :</span>
                  </h3>
                ) : (
                  <div className="h-4" />
                )}

                <nav className="flex flex-col gap-1">
                  {/* 1. คำขอร้องลาเรียน */}
                  <button
                    type="button"
                    onClick={() => handleTabClick('requests', '/teacher')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      activeTab === 'requests' && pathname === '/teacher'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="1. คำขอร้องลาเรียน"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ClipboardCheck className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">1. คำขอร้องลาเรียน</span>}
                    </div>
                    {!collapsed && pendingCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeTab === 'requests' && pathname === '/teacher'
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  {/* 2. สถิติการลา */}
                  <Link
                    href="/teacher/stats"
                    onClick={onCloseMobile}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      pathname === '/teacher/stats'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="2. สถิติการลา"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">2. สถิติการลา</span>}
                    </div>
                  </Link>

                  {/* 3. ประวัติการอนุมัติ */}
                  <button
                    type="button"
                    onClick={() => handleTabClick('history', '/teacher?status=' + encodeURIComponent('ประวัติการอนุมัติ'))}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      activeTab === 'history'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="3. ประวัติการอนุมัติ"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <History className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">3. ประวัติการอนุมัติ</span>}
                    </div>
                  </button>

                  {/* 4. ตารางสอน */}
                  <button
                    type="button"
                    onClick={() => handleTabClick('schedule', '/teacher')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      activeTab === 'schedule'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="4. ตารางสอน"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">4. ตารางสอน</span>}
                    </div>
                  </button>
                </nav>
              </div>
            )}

            {/* ──────── MODE 2: STATS (Leave Statistics Page) ──────── */}
            {mode === 'stats' && (
              <div className="space-y-2">
                {!collapsed ? (
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <span className="text-[#7749BC] dark:text-purple-400">สถิติการลา :</span>
                  </h3>
                ) : (
                  <div className="h-4" />
                )}

                <div className="space-y-1">
                  {/* 1. รายวิชาที่สอน (Dropdown/Toggleable) */}
                  <div className="rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/40 p-1.5">
                    <button
                      type="button"
                      onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="1. รายวิชาที่สอน"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0" />
                        {!collapsed && <span className="truncate">1. รายวิชาที่สอน</span>}
                      </div>
                      {!collapsed && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                            coursesDropdownOpen ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Expandable Course List (SA, OSS, etc.) */}
                    {!collapsed && coursesDropdownOpen && (
                      <div className="mt-1 pt-1 border-t border-neutral-200/60 dark:border-slate-700/60 space-y-1 pl-2">
                        {subjects.map((sub) => {
                          const isSelected = selectedSubjectKey === sub.key;
                          return (
                            <button
                              key={sub.key}
                              type="button"
                              onClick={() => {
                                if (onSelectSubject) onSelectSubject(sub.key);
                                if (onCloseMobile) onCloseMobile();
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[#7749BC] text-white shadow-xs font-bold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-slate-700/60'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-8 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300'
                                  }`}
                                >
                                  {sub.acronym}
                                </span>
                                <span className="truncate text-[11px]">{sub.shortName || sub.name}</span>
                              </div>
                              <span className="text-[10px] opacity-75 font-mono">{sub.code}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. คลังสถิติย้อนหลัง */}
                  <Link
                    href="/teacher/archive"
                    onClick={onCloseMobile}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      pathname === '/teacher/archive'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="2. คลังสถิติย้อนหลัง"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Archive className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">2. คลังสถิติย้อนหลัง</span>}
                    </div>
                  </Link>

                  {/* Back to Teacher Home */}
                  <Link
                    href="/teacher"
                    onClick={onCloseMobile}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                      {!collapsed && <span className="truncate">กลับไปหน้าคำขอลา</span>}
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* ──────── Help & Setting Section ──────── */}
            <div className="pt-3 border-t border-neutral-100 dark:border-slate-800/80 space-y-1.5">
              {!collapsed && (
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Help & Setting :
                </h3>
              )}

              <nav className="flex flex-col gap-1">
                {/* 1. แจ้งปัญหาระบบ */}
                <button
                  type="button"
                  onClick={() => setShowSupport(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  title="1. แจ้งปัญหาระบบ"
                >
                  <HelpCircle className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                  {!collapsed && <span className="truncate">1. แจ้งปัญหาระบบ</span>}
                </button>

                {/* 2. การตั้งค่า */}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  title="2. การตั้งค่า"
                >
                  <Settings className="w-4 h-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                  {!collapsed && <span className="truncate">2. การตั้งค่า</span>}
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
