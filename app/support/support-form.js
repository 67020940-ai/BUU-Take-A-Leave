'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock3, LifeBuoy, MessageSquareText, Send, Tag } from 'lucide-react';
import { formatThaiDate } from '@/lib/ui';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-[#7749BC] focus:ring-2 focus:ring-[#7749BC]/20 transition-all shadow-xs';
const labelCls = 'text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5 flex items-center gap-1.5';

const QUICK_TOPICS = ['เข้าสู่ระบบไม่ได้', 'ยื่นใบลาไม่ได้', 'ไฟล์แนบมีปัญหา', 'ข้อมูลเวลาเรียนไม่ถูกต้อง', 'อื่นๆ'];
const MESSAGE_LIMIT = 500;

export default function SupportForm({ initialTickets, homePath = '/' }) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ส่งคำร้องไม่สำเร็จ');
        return;
      }
      setTickets((prev) => [data.ticket, ...prev]);
      setSubject('');
      setMessage('');
      setSuccess('ส่งคำร้องเรียบร้อยแล้ว ทีมงานจะตอบกลับผ่านหน้านี้ กำลังกลับไปหน้าหลัก...');
      setTimeout(() => {
        router.push(homePath);
        router.refresh();
      }, 1200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>
            <Tag className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
            <span>หัวข้อ</span>
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="สรุปปัญหาสั้นๆ เช่น เข้าสู่ระบบไม่ได้"
            className={inputCls}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSubject(topic)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-[#7749BC] dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>
            <MessageSquareText className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
            <span>รายละเอียดปัญหา</span>
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_LIMIT))}
            required
            placeholder="อธิบายปัญหาที่พบ เช่น ขั้นตอนที่ทำ, ข้อความ error ที่เจอ..."
            className={inputCls}
          />
          <p className="text-[11px] text-neutral-400 mt-1 text-right">
            {message.length}/{MESSAGE_LIMIT}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-[#7749BC] hover:bg-[#653ba6] text-white text-sm font-bold shadow-md shadow-purple-700/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>กำลังส่ง...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ส่งคำร้อง</span>
            </>
          )}
        </button>
      </form>

      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-3">คำร้องของฉัน</h3>
      {tickets.length === 0 ? (
        <div className="bg-neutral-50 dark:bg-slate-800/60 rounded-2xl p-8 text-center">
          <LifeBuoy className="w-8 h-8 text-neutral-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-neutral-500">ยังไม่มีคำร้อง</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => {
            const answered = t.status === 'ตอบกลับแล้ว';
            return (
              <div key={t.id} className="bg-neutral-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-neutral-200/60 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <strong className="text-sm text-neutral-900 dark:text-neutral-100 min-w-0 truncate">{t.subject}</strong>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      answered
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {answered ? <CheckCircle2 className="w-3 h-3" /> : <Clock3 className="w-3 h-3" />}
                    {t.status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mb-1.5">{formatThaiDate(t.createdAt)}</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{t.message}</p>
                {t.reply && (
                  <p className="mt-2 text-sm bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-neutral-800 dark:text-neutral-200 p-3 rounded-2xl">
                    <strong className="text-[#7749BC] dark:text-purple-300">ตอบกลับ:</strong> {t.reply}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
