'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, Loader2 } from 'lucide-react';

export default function CancelLeaveButton({ leaveId }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCancel() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leaves', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leaveId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ยกเลิกไม่สำเร็จ');
        setConfirming(false);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">ยืนยันยกเลิกใบลานี้?</span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>ยืนยันยกเลิก</span>
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 px-3 py-1.5 rounded-xl transition-colors"
        >
          ไม่ยกเลิก
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl transition-colors"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>ยกเลิกใบลา</span>
      </button>
      {error && <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
