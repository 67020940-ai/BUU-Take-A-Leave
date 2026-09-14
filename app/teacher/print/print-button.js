'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center space-x-1.5 text-xs font-semibold text-white bg-[#7749BC] hover:bg-[#653ba6] px-3.5 py-2 rounded-xl transition-colors"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>พิมพ์ / บันทึกเป็น PDF</span>
    </button>
  );
}
