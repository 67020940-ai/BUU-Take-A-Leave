'use client';

import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  Download,
  Eye,
  Loader2,
  FileCheck,
} from 'lucide-react';

export default function AttachmentPreview({
  src,
  url,
  attachment,
  leaveId,
  title,
  label = 'ดูไฟล์แนบ',
  alt = 'หลักฐานประกอบการลา',
  thumbClassName = 'w-7 h-7 rounded-lg',
  showLabel = true,
}) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const raw = src || url || attachment;
  if (!raw) return null;

  const resolvedSrc =
    typeof raw === 'string' &&
    (raw.startsWith('/') ||
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('blob:') ||
      raw.startsWith('data:'))
      ? raw
      : `/api/leaves/attachment/${raw}`;

  const resolvedLabel = label || title || 'ดูไฟล์แนบ';
  const fileName =
    typeof raw === 'string'
      ? raw.split('/').pop()?.split('?')[0] || 'attachment'
      : 'attachment';

  const isPdf =
    typeof resolvedSrc === 'string' &&
    (resolvedSrc.toLowerCase().includes('.pdf') ||
      resolvedSrc.toLowerCase().endsWith('.pdf'));

  // Close modal on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Robust download handler for cross-origin blob & local attachments
  const handleDownload = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setDownloading(true);

    try {
      // 1. First attempt: fetch blob directly in browser
      const res = await fetch(resolvedSrc);
      if (!res.ok) throw new Error('Direct fetch failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      // 2. Fallback: stream through server-side /api/download with Content-Disposition
      const proxyUrl = `/api/download?url=${encodeURIComponent(resolvedSrc)}&name=${encodeURIComponent(fileName)}`;
      const a = document.createElement('a');
      a.href = proxyUrl;
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Trigger Button / Thumbnail */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[#7749BC] dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 hover:underline cursor-pointer font-medium text-xs transition-colors group"
        title={`คลิกเพื่อดู ${resolvedLabel}`}
      >
        {isPdf ? (
          <div
            className={`${thumbClassName} bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
          >
            <FileText className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div
            className={`${thumbClassName} relative overflow-hidden border border-neutral-200 dark:border-slate-700 bg-neutral-100 dark:bg-slate-800 shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
          >
            {!imgError ? (
              <img
                src={resolvedSrc}
                alt={alt}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                <FileCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}

        {showLabel && <span className="font-semibold">{resolvedLabel}</span>}

        {isPdf && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
            PDF
          </span>
        )}
      </button>

      {/* Lightbox / Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-slate-800 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/90">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {isPdf ? (
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-[#7749BC] dark:text-purple-300 shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                    {isPdf ? 'เอกสารแนบประกอบการลา (PDF)' : 'รูปภาพหลักฐานประกอบการลา'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
                    {fileName}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Open in new tab, Download, Close */}
              <div className="flex items-center gap-2 shrink-0">
                {/* 1. ปุ่มเปิดในแท็บใหม่ */}
                <a
                  href={resolvedSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="เปิดในแท็บใหม่ (Open in new tab)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#7749BC] dark:text-purple-400" />
                  <span className="hidden sm:inline">เปิดในแท็บใหม่</span>
                </a>

                {/* 2. ปุ่มดาวน์โหลดไฟล์ */}
                <button
                  type="button"
                  disabled={downloading}
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl bg-[#7749BC] hover:bg-[#663ba8] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  title="ดาวน์โหลดไฟล์ (Download)"
                >
                  {downloading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">ดาวน์โหลดไฟล์</span>
                </button>

                {/* 3. ปุ่มปิดหน้าต่าง */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl bg-neutral-200/80 dark:bg-slate-700 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer"
                  title="ปิดหน้าต่าง (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body / Preview Viewport */}
            <div className="flex-1 bg-neutral-950 flex items-center justify-center overflow-auto p-3 sm:p-6 relative">
              {isPdf ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-2xl overflow-hidden shadow-inner">
                  <iframe
                    src={resolvedSrc}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <img
                    src={resolvedSrc}
                    alt={alt}
                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Bar */}
            <div className="px-4 py-2 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50/80 dark:bg-slate-900/80 flex items-center justify-between text-[11px] text-neutral-500">
              <span>มหาวิทยาลัยบูรพา • BUU Take A Leave Attachment Viewer</span>
              <span>กด Esc เพื่อปิด</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
