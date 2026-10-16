'use client';

import { useState, useEffect } from 'react';
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
  LayoutDashboard,
  User,
  ArrowLeft,
  Camera,
} from 'lucide-react';
import BuuLogo from '@/components/BuuLogo';
import SettingsModal from '@/components/SettingsModal';
import SupportModal from '@/components/SupportModal';
import { getUserAvatarKey } from '@/lib/ui';
import { useSidebarCollapsed } from '@/lib/useSidebarCollapsed';

export default function TeacherSidebar({
  user,
  mode = 'menu', // 'menu' for Teacher Home, 'stats' for Leave Statistics
  activeTab = 'requests', // 'home' | 'requests' | 'stats' | 'history' | 'schedule'
  onSelectTab, // callback for in-page navigation (e.g. scrollTo or switch view)
  subjects = [], // for stats mode: [{ key: 'SA', name: '...', code: '...' }, { key: 'OSS', ... }]
  selectedSubjectKey = 'SA',
  onSelectSubject,
  activeStatsView = 'current', // 'current' | 'archive'
  onSelectArchive,
  pendingCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const currentTab = (() => {
    if (pathname.startsWith('/teacher/requests')) return 'requests';
    if (pathname.startsWith('/teacher/stats')) return 'stats';
    if (pathname.startsWith('/teacher/history')) return 'history';
    if (pathname.startsWith('/teacher/schedule')) return 'schedule';
    if (pathname === '/teacher' || pathname.startsWith('/teacher/archive')) return 'home';
    return activeTab || 'home';
  })();
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

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

  const [avatar, setAvatar] = useState(user?.avatar || null);
  const storageKey = getUserAvatarKey(user);

  useEffect(() => {
    function loadAvatar() {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setAvatar(stored);
        else if (user?.avatar) setAvatar(user.avatar);
        else setAvatar(null);
      } catch {}
    }
    loadAvatar();
    const handleAvatarUpdate = (e) => {
      if (!e.detail?.key || e.detail.key === storageKey) {
        if (e.detail?.avatar !== undefined) {
          setAvatar(e.detail.avatar);
        } else {
          loadAvatar();
        }
      }
    };
    window.addEventListener('buu_avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('buu_avatar_updated', handleAvatarUpdate);
  }, [storageKey, user]);

  function handleNavClick(e, tabKey) {
    if (currentTab === tabKey) {
      e.preventDefault();
      if (onCloseMobile) onCloseMobile();
      return;
    }
    if (onCloseMobile) onCloseMobile();
  }

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 lg:z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-neutral-200/80 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-20' : 'w-64 sm:w-68'}`}
      >
        {/* Top Header: Logo + Take A Leave + Collapse Button */}
        <div className="shrink-0">
          <div className={`border-b border-neutral-100 dark:border-slate-800/80 transition-all ${
            collapsed
              ? 'py-3 px-2 flex flex-col items-center justify-center gap-1.5'
              : 'h-20 px-4 sm:px-5 flex items-center justify-between'
          }`}>
            <Link
              href="/teacher"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 group min-w-0 ${collapsed ? 'justify-center' : ''}`}
              title="หน้าแรกอาจารย์ Take A Leave"
            >
              <BuuLogo size={collapsed ? 32 : 36} className="shrink-0 group-hover:scale-105 transition-transform" />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium truncate leading-tight">
                    ระบบลาเรียนออนไลน์
                  </span>
                  <span className="font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight text-base leading-snug group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors truncate">
                    Take A Leave
                  </span>
                  <span className="text-[10px] text-[#7749BC] dark:text-purple-300 font-semibold truncate leading-tight">
                    อาจารย์ผู้สอน
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop collapse toggle / Mobile close */}
            <div className={`flex items-center ${collapsed ? 'justify-center mt-0.5' : 'gap-1'}`}>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden lg:flex p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
              >
                {collapsed ? <PanelLeft className="w-4 h-4 text-[#7749BC] dark:text-purple-300" /> : <PanelLeftClose className="w-4 h-4" />}
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

          {/* Teacher Profile Card when not collapsed */}
          {!collapsed && user && (
            <div className="mx-3 mt-3 p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('buu_open_avatar_upload'))}
                className="relative group w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7749BC] to-[#582B9E] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 overflow-hidden cursor-pointer"
                title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
              >
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                ) : (
                  (user.name || 'อาจารย์')
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('') || <User className="w-4 h-4" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {user.name || 'อาจารย์ผู้สอน'}
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                  {user.faculty || 'คณะวิทยาการสารสนเทศ'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links Body */}
        <div className="p-3 sm:p-4 space-y-6 overflow-y-auto flex-1 min-h-0">
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
                  {/* หน้าหลัก */}
                  <Link
                    href="/teacher"
                    onClick={(e) => handleNavClick(e, 'home')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'home'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="หน้าหลัก"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">หน้าหลัก</span>}
                    </div>
                  </Link>

                  {/* คำขอร้องลาเรียน */}
                  <Link
                    href="/teacher/requests"
                    onClick={(e) => handleNavClick(e, 'requests')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'requests'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="คำขอร้องลาเรียน"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ClipboardCheck className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">คำขอร้องลาเรียน</span>}
                    </div>
                    {!collapsed && pendingCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          currentTab === 'requests'
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </Link>

                  {/* สถิติการลา */}
                  <Link
                    href="/teacher/stats"
                    onClick={(e) => handleNavClick(e, 'stats')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'stats'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="สถิติการลา"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">สถิติการลา</span>}
                    </div>
                  </Link>

                  {/* ประวัติการอนุมัติ */}
                  <Link
                    href="/teacher/history"
                    onClick={(e) => handleNavClick(e, 'history')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'history'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="ประวัติการอนุมัติ"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <History className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">ประวัติการอนุมัติ</span>}
                    </div>
                  </Link>

                  {/* ตารางสอน */}
                  <Link
                    href="/teacher/schedule"
                    onClick={(e) => handleNavClick(e, 'schedule')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      currentTab === 'schedule'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="ตารางสอน"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">ตารางสอน</span>}
                    </div>
                  </Link>
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
                  {/* กลับไปหน้าหลัก (Teacher Home) */}
                  <Link
                    href="/teacher"
                    onClick={onCloseMobile}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors mb-1.5"
                    title="กลับไปหน้าหลักอาจารย์"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ArrowLeft className="w-4 h-4 shrink-0 text-[#7749BC] dark:text-purple-400" />
                      {!collapsed && <span className="truncate font-bold">กลับไปหน้าหลัก</span>}
                    </div>
                  </Link>

                  {/* รายวิชาที่สอน (Dropdown/Toggleable) */}
                  <div className="rounded-2xl border border-neutral-200/80 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/40 p-1.5">
                    <button
                      type="button"
                      onClick={() => setCoursesDropdownOpen(!coursesDropdownOpen)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="รายวิชาที่สอน"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-[#7749BC] dark:text-purple-400 shrink-0" />
                        {!collapsed && <span className="truncate">รายวิชาที่สอน</span>}
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
                          const isSelected = activeStatsView === 'current' && selectedSubjectKey === sub.key;
                          const codeDigits = String(sub.code || '').replace(/\D/g, '');
                          const threeDigits = codeDigits.length >= 6
                            ? codeDigits.slice(3, 6)
                            : (sub.acronym || 'SUB');

                          return (
                            <button
                              key={sub.key}
                              type="button"
                              onClick={() => {
                                if (onSelectSubject) onSelectSubject(sub.key);
                                if (onCloseMobile) onCloseMobile();
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                                isSelected
                                  ? 'bg-[#7749BC] text-white shadow-xs font-bold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-slate-700/60'
                              }`}
                              title={`${sub.code} ${sub.name}`}
                            >
                              <span
                                className={`w-9 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[11px] shrink-0 ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300'
                                }`}
                              >
                                {threeDigits}
                              </span>
                              <span className="truncate text-[11px] flex-1 min-w-0">
                                {sub.shortName || sub.name}
                              </span>
                              <span className="text-[10px] opacity-75 font-mono shrink-0 ml-auto">
                                {sub.code}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* คลังสถิติย้อนหลัง */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectArchive) onSelectArchive();
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      activeStatsView === 'archive'
                        ? 'bg-[#7749BC] text-white shadow-md shadow-purple-900/20'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                    title="คลังสถิติย้อนหลัง"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Archive className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">คลังสถิติย้อนหลัง</span>}
                    </div>
                  </button>

                  {/* Back to Teacher Home */}
                  <Link
                    href="/teacher"
                    onClick={onCloseMobile}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                      {!collapsed && <span className="truncate">กลับไปหน้าหลัก</span>}
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

        {/* Bottom Section: Log out Button */}
        <div className="shrink-0 p-3 sm:p-4 pb-6 sm:pb-4 border-t border-neutral-100 dark:border-slate-800/80 bg-neutral-50/50 dark:bg-slate-900/50">
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
