'use client';

import { useState, useEffect } from 'react';
import { X, Moon, Sun, Bell, Volume2, Save, Check, ChevronDown } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, user }) {
  const [emailNotify, setEmailNotify] = useState(true);
  const [lineNotify, setLineNotify] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [defaultSemester, setDefaultSemester] = useState('1/2569');
  const [saved, setSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState(user || null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      return;
    }
    try {
      const stored = localStorage.getItem('buu_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        fetch('/api/profile')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            if (d?.user) setCurrentUser(d.user);
          })
          .catch(() => {});
      }
    } catch {}
  }, [user, isOpen]);

  const isYear1 = Boolean(
    currentUser?.role === 'student' &&
    (String(currentUser?.studentId || currentUser?.studentCode || '').startsWith('69') ||
     currentUser?.academicYear === 'ชั้นปีที่ 1' ||
     String(currentUser?.email || '').startsWith('69'))
  );

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('buu_teacher_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.emailNotify !== undefined) setEmailNotify(parsed.emailNotify);
        if (parsed.lineNotify !== undefined) setLineNotify(parsed.lineNotify);
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
        if (parsed.defaultSemester) setDefaultSemester(parsed.defaultSemester);
      }
    } catch {}
    if (isYear1) {
      setDefaultSemester('1/2569');
    }
  }, [isOpen, isYear1]);

  if (!isOpen) return null;

  function handleSave() {
    try {
      localStorage.setItem(
        'buu_teacher_settings',
        JSON.stringify({ emailNotify, lineNotify, soundEnabled, defaultSemester })
      );
      if (typeof window !== 'undefined' && defaultSemester) {
        window.dispatchEvent(
          new CustomEvent('buu_semester_updated', { detail: { semester: defaultSemester } })
        );
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 700);
    } catch {
      onClose();
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">การตั้งค่าระบบ</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">ปรับแต่งการแสดงผลและการแจ้งเตือนส่วนบุคคล</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-neutral-700 dark:text-neutral-300">
          {/* Default Semester */}
          <div className="space-y-1.5">
            <label className="font-bold text-neutral-900 dark:text-neutral-100 block">ภาคเรียนเริ่มต้น</label>
            <div className="relative">
              <select
                value={defaultSemester}
                onChange={(e) => setDefaultSemester(e.target.value)}
                disabled={isYear1}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-[#7749BC] appearance-none pr-10 shadow-xs ${
                  isYear1 ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                }`}
              >
                <option value="1/2569">ภาคเรียนที่ 1/2569 (ปัจจุบัน)</option>
                {!isYear1 && (
                  <>
                    <option value="2/2568">ภาคเรียนที่ 2/2568</option>
                    <option value="1/2568">ภาคเรียนที่ 1/2568</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {isYear1 && (
              <p className="text-[11px] text-neutral-400 mt-1">
                * นิสิตชั้นปีที่ 1 มีเฉพาะภาคเรียนปัจจุบันเนื่องจากเข้าศึกษาในปี 2569
              </p>
            )}
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <p className="font-bold text-neutral-900 dark:text-neutral-100">การแจ้งเตือน</p>
            
            <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/60 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#7749BC]" />
                <span>แจ้งเตือนคำขอลาใหม่ทางอีเมล</span>
              </span>
              <input
                type="checkbox"
                checked={emailNotify}
                onChange={(e) => setEmailNotify(e.target.checked)}
                className="w-4 h-4 rounded text-[#7749BC] focus:ring-[#7749BC] accent-[#7749BC]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-200/60 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>เสียงแจ้งเตือนเมื่อมีคำขอใหม่</span>
              </span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#7749BC] focus:ring-[#7749BC] accent-[#7749BC]"
              />
            </label>
          </div>
        </div>

        <div className="p-4 bg-neutral-50/80 dark:bg-slate-900/60 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 font-semibold cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#663ba8] text-white font-bold shadow-xs cursor-pointer transition-colors"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>บันทึกแล้ว!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
