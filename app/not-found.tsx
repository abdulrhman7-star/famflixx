import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6" dir="rtl">
      <h2 className="text-3xl font-bold text-white mb-3">الصفحة غير موجودة (404)</h2>
      <p className="text-gray-400 mb-6">عذراً، لم نتمكن من العثور على الصفحة المطلوبة.</p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all"
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
