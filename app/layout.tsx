import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/lib/LanguageContext';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export const viewport: Viewport = {
  themeColor: '#07080b',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  applicationName: 'FamFlix',
  title: 'FamFlix — مشاهدة الأفلام والمسلسلات',
  description: 'منصة بث أفلام ومسلسلات بجودة عالية وبدون إعلانات مع ترجمة عربية احترافية.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FamFlix',
  },
  icons: {
    icon: [
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'FamFlix — مشاهدة الأفلام والمسلسلات',
    description: 'منصة بث أفلام ومسلسلات بجودة عالية وبدون إعلانات مع ترجمة عربية احترافية.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FamFlix — مشاهدة الأفلام والمسلسلات',
    description: 'منصة بث أفلام ومسلسلات بجودة عالية وبدون إعلانات مع ترجمة عربية احترافية.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col justify-between selection:bg-blue-600 selection:text-white" suppressHydrationWarning>
        <ServiceWorkerRegister />
        <OfflineIndicator />
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
