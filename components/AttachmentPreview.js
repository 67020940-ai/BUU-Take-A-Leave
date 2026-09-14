'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function AttachmentPreview({ src, label = 'ดูไฟล์แนบ', thumbClassName = 'w-6 h-6 rounded-md' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[#7749BC] dark:text-purple-300 hover:underline cursor-pointer"
      >
        <img src={src} alt="ไฟล์แนบ" className={`${thumbClassName} object-cover border border-neutral-200 dark:border-slate-700`} />
        <span>{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setOpen(false)}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 text-white/90 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={src} alt="ไฟล์แนบ" className="w-full h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
