'use client';

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X, Share2, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallButton: React.FC = () => {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (canInstall) {
    return (
      <button
        onClick={() => promptInstall()}
        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        title="تثبيت التطبيق على جهازك"
      >
        <Download className="w-4 h-4" />
        <span>تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/10 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          title="تثبيت التطبيق على آيفون / آيباد"
        >
          <Download className="w-4 h-4" />
          <span>تثبيت التطبيق</span>
        </button>

        <AnimatePresence>
          {showIOSGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
              onClick={() => setShowIOSGuide(false)}
              dir="rtl"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-sm rounded-3xl bg-[#12151e] p-6 shadow-2xl border border-white/15 text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Download className="w-5 h-5 text-red-500" />
                    <span>تثبيت على آيفون / آيباد</span>
                  </h3>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6 text-sm text-gray-300">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">1. اضغط على زر المشاركة</p>
                      <p className="text-xs text-gray-400 mt-0.5">في شريط أدوات Safari أسفل الشاشة</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                      <PlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">2. اختر إضافة إلى الصفحة الرئيسية</p>
                      <p className="text-xs text-gray-400 mt-0.5">Add to Home Screen لتشغيله كتطبيق مستقل</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer"
                >
                  حسناً، فهمت
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
};

export default PWAInstallButton;
