'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, ArrowRight, CalendarCheck, BellRing, FileSpreadsheet, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl shadow-xl shadow-purple-900/10 overflow-hidden border border-neutral-200/90 dark:border-slate-800">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-[#7749BC] to-[#5a3690] p-10 text-white">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center font-extrabold text-lg mb-6">
              BUU
            </div>
            <h2 className="text-2xl font-bold tracking-tight leading-snug">
              ระบบบริหารจัดการ
              <br />
              การลาเรียนออนไลน์
            </h2>
            <p className="text-sm text-purple-100/90 mt-2">Burapha University Online Student Leave Management System</p>
          </div>
          <ul className="space-y-4 mt-12">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm text-purple-50/95 leading-relaxed pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900">
          <div className="px-6 pt-8 pb-5 text-center md:hidden">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-2xl border-2 border-[#7749BC] bg-purple-50/70 dark:bg-purple-950/40 text-[#7749BC] dark:text-purple-300 font-extrabold text-xl tracking-wider shadow-xs mb-3">
              BUU Take-A-Leave
            </div>
            <div className="flex items-center justify-center space-x-2 text-neutral-500 dark:text-neutral-400 text-xs font-medium">
              <span className="h-px w-6 bg-neutral-300 dark:bg-slate-700" />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">ระบบบริหารจัดการการลาเรียน มหาวิทยาลัยบูรพา</span>
              <span className="h-px w-6 bg-neutral-300 dark:bg-slate-700" />
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1.5">
              Burapha University Online Student Leave Management System
            </p>
          </div>
          <div className="hidden md:block px-8 pt-8 pb-2">
            <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">เข้าสู่ระบบ</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">กรอกอีเมลและรหัสผ่านของคุณเพื่อเข้าใช้งาน</p>
          </div>

          <div className="px-6 pb-7 pt-4 sm:px-8 sm:pb-8">
            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>E-mail</span>
                  <span className="text-[11px] text-neutral-400 font-normal">นิสิต / อาจารย์</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="@go.buu.ac.th"
                  autoComplete="username"
                  disabled={loading}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 transition-all shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Password
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
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-sm font-bold shadow-md shadow-purple-700/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 mt-4 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </div>
                ) : (
                  <>
                    <span>เข้าสู่ระบบ (Login)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
