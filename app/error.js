'use client';

import { useEffect } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('App Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
        เกิดข้อผิดพลาดในการโหลดข้อมูล
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        ระบบไม่สามารถประมวลผลคำขอได้ในขณะนี้ อาจเกิดจากปัญหาการเชื่อมต่อเครือข่าย กรุณาลองใหม่อีกครั้ง
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-2xl bg-[#7749BC] hover:bg-[#6338a1] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-900/20 active:scale-95"
      >
        <RotateCcw className="w-4 h-4" />
        <span>ลองใหม่อีกครั้ง</span>
      </button>
    </div>
  );
}
