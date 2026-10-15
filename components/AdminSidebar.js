'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LifeBuoy,
  BookOpen,
  ClipboardCheck,
  Settings,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeft,
  ShieldCheck,
  Database,
  User,
  Camera,
} from 'lucide-react';
import BuuLogo from '@/components/BuuLogo';
import SettingsModal from '@/components/SettingsModal';
import { getUserAvatarKey } from '@/lib/ui';
import { useSidebarCollapsed } from '@/lib/useSidebarCollapsed';

export default function AdminSidebar({
  user,
  activeTab = 'overview', // 'overview' | 'tickets' | 'courses' | 'leaves' | 'backup'
  onSelectTab,
  openTicketsCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
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

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {}
    router.replace('/login');
    router.refresh();
  }

  const navItems = [
    {
      key: 'overview',
      label: 'ภาพรวมระบบ',
      icon: LayoutDashboard,
    },
    {
      key: 'tickets',
      label: 'แจ้งปัญหาระบบ',
      icon: LifeBuoy,
      badge: openTicketsCount > 0 ? openTicketsCount : null,
      badgeColor: 'rose',
    },
    {
      key: 'courses',
      label: 'รายวิชาที่เปิดสอน',
      icon: BookOpen,
    },
    {
      key: 'leaves',
      label: 'คำร้องลาทั้งระบบ',
      icon: ClipboardCheck,
    },
    {
      key: 'backup',
      label: 'สำรองข้อมูล (Backup)',
      icon: Database,
    },
  ];

  function handleItemClick(e, item) {
    if (onCloseMobile) onCloseMobile();
    if (onSelectTab) {
      e.preventDefault();
      onSelectTab(item.key);
      const newUrl = item.key === 'overview' ? '/admin' : `/admin?tab=${item.key}`;
      window.history.pushState(null, '', newUrl);
    }
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
              href="/admin"
              onClick={(e) => {
                if (onCloseMobile) onCloseMobile();
                if (onSelectTab) {
                  e.preventDefault();
                  onSelectTab('overview');
                  window.history.pushState(null, '', '/admin');
                }
              }}
              className={`flex items-center gap-3 group min-w-0 ${collapsed ? 'justify-center' : ''}`}
              title="ภาพรวมผู้ดูแลระบบ Take A Leave"
            >
              <BuuLogo size={collapsed ? 32 : 36} className="shrink-0 group-hover:scale-105 transition-transform" />
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight text-base leading-none group-hover:text-[#7749BC] dark:group-hover:text-purple-300 transition-colors truncate">
                    Take A Leave
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-medium truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#7749BC] dark:text-purple-400" />
                    <span>ผู้ดูแลระบบ (Admin)</span>
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

          {/* Admin Profile Card when not collapsed */}
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
                  (user.name || 'ผู้ดูแลระบบ')
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
                  {user.name || 'ผู้ดูแลระบบ'}
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#7749BC] dark:text-purple-400" />
                  <span>ผู้ดูแลระบบ (Admin)</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links Body */}
        <div className="p-3 sm:p-4 space-y-6 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-1.5">
              {!collapsed ? (
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
                  <span className="text-[#7749BC] dark:text-purple-400">Admin Menu :</span>
                </h3>
              ) : (
                <div className="h-4" />
              )}

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={(e) => handleItemClick(e, item)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer text-left ${
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
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ──────── Settings Section ──────── */}
            <div className="pt-3 border-t border-neutral-100 dark:border-slate-800/80 space-y-1.5">
              {!collapsed && (
                <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Settings :
                </h3>
              )}

              <nav className="flex flex-col gap-1">
                {/* การตั้งค่าระบบ */}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                  title="การตั้งค่าระบบ"
                >
                  <Settings className="w-4 h-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
                  {!collapsed && <span className="truncate">การตั้งค่าระบบ</span>}
                </button>
              </nav>
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
    </>
  );
}
