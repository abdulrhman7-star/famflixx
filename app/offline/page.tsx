import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import OfflineRetryButton from './OfflineRetryButton';

export const metadata: Metadata = {
  title: 'أنت غير متصل بالإنترنت | FamFlix',
  description: 'لا يتوفر اتصال بالإنترنت حالياً.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center select-none" dir="rtl">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500">
        <WifiOff className="w-10 h-10" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
        أنت غير متصل بالإنترنت
      </h1>
      <p className="text-gray-400 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        يبدو أن اتصال الشبكة لديك مقطوع. يمكنك الاستمرار في تصفح الصفحات والمحتوى المحفوظ مؤقتاً، أو الضغط أدناه لإعادة المحاولة.
      </p>
      <OfflineRetryButton />
    </div>
  );
}
