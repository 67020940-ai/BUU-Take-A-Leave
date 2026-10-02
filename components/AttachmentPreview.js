'use client';

import { useState } from 'react';
import { X, FileText, ExternalLink, Download, Eye } from 'lucide-react';

export default function AttachmentPreview({ src, label = 'ดูไฟล์แนบ', thumbClassName = 'w-6 h-6 rounded-md' }) {
  const [open, setOpen] = useState(false);

  if (!src) return null;

  const isPdf = typeof src === 'string' && src.toLowerCase().includes('.pdf');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[#7749BC] dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 hover:underline cursor-pointer font-medium text-xs transition-colors"
        title={label}
      >
        {isPdf ? (
          <div className={`${thumbClassName} bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0`}>
            <FileText className="w-3.5 h-3.5" />
          </div>
        ) : (
          <img
            src={src}
            alt="ไฟล์แนบ"
            className={`${thumbClassName} object-cover border border-neutral-200 dark:border-slate-700 shrink-0`}
          />
        )}
        <span>{label}</span>
        {isPdf && (
          <span className="px-1 py-0.2 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
            PDF
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                {isPdf ? (
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                    <FileText className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#7749BC] dark:text-purple-300">
                    <Eye className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {isPdf ? 'เอกสารแนบประกอบการลา (PDF)' : 'รูปภาพแนบประกอบการลา'}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {isPdf ? 'ใบรับรองแพทย์ / หนังสือขออนุญาต' : 'หลักฐานภาพถ่าย'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  title="เปิดในแท็บใหม่"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">เปิดแท็บใหม่</span>
                </a>
                <a
                  href={src}
                  download
                  className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                  title="ดาวน์โหลดไฟล์"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ดาวน์โหลด</span>
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-xl bg-neutral-200/80 dark:bg-slate-700 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-neutral-900 flex items-center justify-center overflow-auto p-2">
              {isPdf ? (
                <iframe
                  src={src}
                  className="w-full h-full border-0 rounded-xl bg-white shadow-inner"
                  title="PDF Preview"
                />
              ) : (
                <img
                  src={src}
                  alt="หลักฐานแนบ"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
