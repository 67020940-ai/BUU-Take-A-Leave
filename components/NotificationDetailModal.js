'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Bell, ArrowRight, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { resolveNotificationLink } from '@/lib/ui';

export default function NotificationDetailModal({ isOpen, onClose, notification, userRole = 'teacher' }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !notification || !mounted) return null;

  const targetLink = resolveNotificationLink(notification.link, userRole);

  const formattedDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  function handleGoToTarget() {
    onClose();
    if (targetLink) {
      router.push(targetLink);
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">รายละเอียดการแจ้งเตือน</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">เนื้อหาและกิจกรรมที่เกิดขึ้นในระบบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-neutral-700 dark:text-neutral-300">
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/80 space-y-2">
            <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
              {notification.message || notification.title}
            </p>
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 pt-1">
                <Calendar className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50/50 dark:bg-slate-900/50 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs"
          >
            ปิด
          </button>
          {targetLink && (
            <button
              type="button"
              onClick={handleGoToTarget}
              className="px-4 py-2 rounded-xl bg-[#7749BC] hover:bg-[#653ba6] text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-900/20 transition-all cursor-pointer text-xs"
            >
              <span>ไปยังหน้ารายการคำร้อง</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
