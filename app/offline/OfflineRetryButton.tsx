'use client';

import { RefreshCw } from 'lucide-react';

export default function OfflineRetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
    >
      <RefreshCw className="w-4 h-4" />
      <span>إعادة المحاولة</span>
    </button>
  );
}
