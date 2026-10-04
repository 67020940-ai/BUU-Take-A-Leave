'use client';
/* Hallmark · macrostructure: Minimal Focus · theme: BUU Utilitarian · pre-emit critique: P5 H5 E5 S5 R5 V5 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, ArrowRight, CalendarCheck, BellRing, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import BuuLogo from '@/components/BuuLogo';

const ROLE_HOME = { student: '/student', teacher: '/teacher', admin: '/admin' };

const FEATURES = [
  { icon: CalendarCheck, text: 'ยื่นใบลาออนไลน์ พร้อมแนบเอกสารประกอบ' },
  { icon: BellRing, text: 'แจ้งเตือนอาจารย์และนิสิตทันทีที่มีความเคลื่อนไหว' },
  { icon: FileSpreadsheet, text: 'สรุปเวลาเรียน โควต้าการลา และออกรายงานได้ทันที' },
  { icon: ShieldCheck, text: 'เข้าสู่ระบบปลอดภัยด้วยบัญชีมหาวิทยาลัยบูรพา' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }
      router.replace(ROLE_HOME[data.role] || '/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-950 relative">
      {/* Floating Dark/Light Mode Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle showLabel />
      </div>

      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl shadow-xs overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="hidden md:flex flex-col justify-between bg-[#7749BC] p-10 text-white border-r border-[#653ba6]">
          <div>
            <BuuLogo size={52} className="mb-6 drop-shadow-md" />
            <h2 className="text-xl font-bold tracking-tight leading-snug">
              ระบบบริหารจัดการ
              <br />
              การลาเรียนออนไลน์
            </h2>
            <p className="text-xs text-purple-100/80 mt-2 font-normal">Burapha University Online Student Leave Management System</p>
          </div>
          <ul className="space-y-3.5 mt-10">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs text-purple-50/95 leading-relaxed pt-1 font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 flex flex-col justify-center">
          <div className="px-6 pt-8 pb-3 text-center md:hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#7749BC]/30 bg-purple-50 dark:bg-purple-950/40 text-[#7749BC] dark:text-purple-300 font-bold text-base tracking-wider mb-2">
              <BuuLogo size={28} />
              <span>BUU TL · Take A Leave</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">ระบบบริหารจัดการการลาเรียน มหาวิทยาลัยบูรพา</p>
          </div>
          <div className="hidden md:block px-8 pt-8 pb-1">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">เข้าสู่ระบบ</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบ</p>
          </div>

          <div className="px-6 pb-6 pt-3 sm:px-8 sm:pb-8">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>E-mail</span>
                  <span className="text-[11px] text-slate-400 font-normal">นิสิต / อาจารย์</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="@go.buu.ac.th หรือ @buu.ac.th"
                  autoComplete="username"
                  disabled={loading}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#7749BC] focus:ring-1 focus:ring-[#7749BC] transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    รหัสผ่าน
                  </label>
                  <a
                    href="https://myid.buu.ac.th/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-medium text-[#7749BC] dark:text-purple-300 hover:underline"
                  >
                    ลืมรหัสผ่าน?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#7749BC] focus:ring-1 focus:ring-[#7749BC] transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60 mt-3 active:translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </div>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ (Login)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts Switcher */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  บัญชีทดสอบระบบ (Demo)
                </span>
                <span className="text-[10px] text-[#7749BC] dark:text-purple-300 font-mono">
                  รหัสผ่าน: 1234
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('66000001@go.buu.ac.th');
                    setPassword('1234');
                    setError('');
                  }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/40 text-left transition-all cursor-pointer group shadow-2xs"
                  title="คลิกเพื่อกรอกบัญชีนิสิต"
                >
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-[#7749BC]">
                    🎓 นิสิต
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">จุฑามาศ</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('teacher-teeradech@buu.ac.th');
                    setPassword('1234');
                    setError('');
                  }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/40 text-left transition-all cursor-pointer group shadow-2xs"
                  title="คลิกเพื่อกรอกบัญชีอาจารย์"
                >
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-[#7749BC]">
                    👨‍🏫 อาจารย์
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">ดร.ธีรเดช</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@buu.ac.th');
                    setPassword('1234');
                    setError('');
                  }}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/40 text-left transition-all cursor-pointer group shadow-2xs"
                  title="คลิกเพื่อกรอกบัญชีแอดมิน"
                >
                  <p className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-[#7749BC]">
                    🛡️ แอดมิน
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">ผู้ดูแลระบบ</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
