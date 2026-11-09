'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (!navigator.onLine) {
      queueMicrotask(() => {
        setIsOffline(true);
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 inset-x-0 z-[9999] bg-red-600 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-lg select-none"
          dir="rtl"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>لا يوجد اتصال بالإنترنت</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default OfflineIndicator;
