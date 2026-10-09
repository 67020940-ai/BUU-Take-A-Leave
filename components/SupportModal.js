'use client';

import { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, LifeBuoy, ChevronDown } from 'lucide-react';

export default function SupportModal({ isOpen, onClose }) {
  const [category, setCategory] = useState('การอนุมัติคำขอลา');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) {
      setError('กรุณากรอกหัวข้อและรายละเอียดปัญหา');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const fullSubject = (category ? `[${category}] ${subject}` : subject).trim().slice(0, 150);
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: fullSubject,
          message: details.trim().slice(0, 500),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSubject('');
          setDetails('');
          onClose();
        }, 1200);
      } else {
        setError('ไม่สามารถส่งคำร้องได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">แจ้งปัญหาระบบ</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">ส่งรายงานปัญหาไปยังทีมงานผู้ดูแลระบบ มหาวิทยาลัยบูรพา</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">ส่งรายงานปัญหาเรียบร้อยแล้ว</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">ทีมงานจะดำเนินการตรวจสอบและแก้ไขโดยเร็วที่สุด</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-800 dark:text-neutral-200">หมวดหมู่ปัญหา</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:border-[#7749BC] appearance-none pr-10 cursor-pointer shadow-xs"
                >
                  <option value="การอนุมัติคำขอลา">การอนุมัติคำขอลา</option>
                  <option value="การแสดงผลข้อมูลนิสิตหรือรายวิชา">การแสดงผลข้อมูลนิสิตหรือรายวิชา</option>
                  <option value="สถิติและการคำนวณโควต้า">สถิติและการคำนวณโควต้า</option>
                  <option value="ไฟล์แนบหรือหลักฐานการลา">ไฟล์แนบหรือหลักฐานการลา</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-800 dark:text-neutral-200">หัวข้อปัญหา</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="ระบุหัวข้อปัญหาโดยย่อ..."
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-800 dark:text-neutral-200">รายละเอียดปัญหา</label>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="อธิบายอาการของปัญหา วันเวลา หรือรหัสนิสิตที่พบปัญหา..."
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#663ba8] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'กำลังส่ง...' : 'ส่งรายงานปัญหา'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
