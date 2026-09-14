'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, History, RotateCcw, X } from 'lucide-react';
import { STATUS_DETAILS, LEAVE_TYPE_DETAILS, LEAVE_TYPE_DEFAULT, formatThaiDate } from '@/lib/ui';
import AttachmentPreview from '@/components/AttachmentPreview';

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

// initialLeaves: เฉพาะคำร้องที่ตัดสินใจแล้ว (สถานะ 'อนุมัติ' หรือ 'ไม่อนุมัติ')
export default function HistoryList({ leaves: initialLeaves }) {
  const router = useRouter();
  const [leaves, setLeaves] = useState(initialLeaves);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'อนุมัติ' | 'ไม่อนุมัติ'
  const [revertTarget, setRevertTarget] = useState(null); // leave กำลังจะยกเลิกการอนุมัติ
  const [reverting, setReverting] = useState(false);
  const [error, setError] = useState('');

  async function handleRevert() {
    if (!revertTarget) return;
    const leave = revertTarget;
    setReverting(true);
    setError('');
    try {
      // ใบลาตัวอย่าง (mock) ไม่มีอยู่จริงใน DB จึงอัปเดตแค่ในหน้าจอ ไม่ยิง API จริง
      if (String(leave.id).startsWith('mock-')) {
        setLeaves((prev) => prev.filter((l) => l.id !== leave.id));
        setRevertTarget(null);
        return;
      }
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leave.id, status: 'รออนุมัติ' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ยกเลิกการอนุมัติไม่สำเร็จ');
        return;
      }
      setLeaves((prev) => prev.filter((l) => l.id !== leave.id));
      setRevertTarget(null);
      router.refresh();
    } finally {
      setReverting(false);
    }
  }

  const filtered = leaves.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (l.studentName || '').toLowerCase().includes(q) ||
      (l.studentCode || '').includes(search) ||
      (l.courseName || '').toLowerCase().includes(q);
    const matchesStatus = filter === 'all' || l.status === filter;
    return matchesSearch && matchesStatus;
  });

  if (leaves.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 p-8 text-center shadow-xs">
        <History className="w-10 h-10 text-neutral-300 dark:text-slate-700 mx-auto mb-2" />
        <p className="text-sm text-neutral-500">ยังไม่มีคำร้องที่เคยพิจารณา</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-neutral-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารหัสนิสิต ชื่อ หรือ รายวิชา..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7749BC]/20 focus:border-[#7749BC] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#7749BC] text-white'
                : 'bg-white dark:bg-slate-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-700 border border-neutral-200 dark:border-slate-700'
            }`}
          >
            ทั้งหมด ({leaves.length})
          </button>
          <button
            onClick={() => setFilter('อนุมัติ')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filter === 'อนุมัติ'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
          >
            อนุมัติแล้ว ({leaves.filter((l) => l.status === 'อนุมัติ').length})
          </button>
          <button
            onClick={() => setFilter('ไม่อนุมัติ')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filter === 'ไม่อนุมัติ'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
            }`}
          >
            ไม่อนุมัติ ({leaves.filter((l) => l.status === 'ไม่อนุมัติ').length})
          </button>
        </div>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-neutral-500">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
        ) : (
          filtered.map((leave) => {
            const status = STATUS_DETAILS[leave.status];
            const typeCls = LEAVE_TYPE_DETAILS[leave.type] || LEAVE_TYPE_DEFAULT;
            return (
              <div key={leave.id} className="p-4 sm:p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-200 dark:border-purple-800 shrink-0">
                      {initials(leave.studentName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {leave.studentName}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{leave.studentCode}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span>{status.label}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {leave.courseCode} {leave.courseName}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg font-medium border ${typeCls}`}>{leave.type}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#7749BC] dark:text-purple-400" />
                    <span>
                      {formatThaiDate(leave.startDate)}
                      {leave.endDate && leave.endDate !== leave.startDate ? ` - ${formatThaiDate(leave.endDate)}` : ''}
                    </span>
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300">เหตุผลการลา: {leave.reason}</p>

                {leave.teacherComment && (
                  <div
                    className={`text-xs px-3 py-2 rounded-xl border ${
                      leave.status === 'อนุมัติ'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <span className="font-semibold mr-1">หมายเหตุที่ให้ไว้:</span>
                    <span>{leave.teacherComment}</span>
                  </div>
                )}

                {leave.attachment && (
                  <AttachmentPreview src={`/api/leaves/attachment/${leave.attachment}`} label="ดูเอกสารแนบ" />
                )}

                <div className="pt-1">
                  <button
                    onClick={() => setRevertTarget(leave)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 border border-neutral-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ยกเลิกการอนุมัติ / พิจารณาใหม่</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="px-4 sm:px-5 pb-4 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}

      {revertTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">ยืนยันยกเลิกการอนุมัติ</h3>
              </div>
              <button
                onClick={() => setRevertTarget(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-slate-800 border border-neutral-200/80 dark:border-slate-700 text-xs space-y-1">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {revertTarget.studentName} ({revertTarget.studentCode})
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                {revertTarget.courseCode} {revertTarget.courseName}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400">
                สถานะปัจจุบัน: {STATUS_DETAILS[revertTarget.status]?.label}
              </p>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              คำร้องนี้จะกลับไปเป็นสถานะ <strong>&quot;รออนุมัติ&quot;</strong> และย้ายไปแสดงในคิวคำร้องรอพิจารณาที่หน้าหลักอีกครั้ง
              เพื่อให้คุณพิจารณาและตัดสินใจใหม่ได้
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                onClick={() => setRevertTarget(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700 text-xs text-neutral-600 dark:text-neutral-300 font-medium cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRevert}
                disabled={reverting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors ring-1 ring-white/30 cursor-pointer bg-amber-600 hover:bg-amber-700 disabled:opacity-60"
              >
                {reverting ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิกการอนุมัติ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
