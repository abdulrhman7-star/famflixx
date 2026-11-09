"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Film, Tv, Shield, Zap, Heart, Sparkles, Globe } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface FooterProps {
  lang?: any;
  onTabChange?: (tab: any) => void;
  onSelectGenre?: (genreId: any) => void;
}

export default function Footer({ lang: _propLang, onTabChange, onSelectGenre }: FooterProps = {}) {
  const pathname = usePathname();
  const { lang, dir, t } = useLanguage();

  // Do not render footer on embed player page
  if (pathname?.startsWith('/embed')) {
    return null;
  }

  return (
    <footer className="w-full bg-slate-950/90 border-t border-white/[0.08] text-slate-400 font-sans mt-16 backdrop-blur-xl" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          
          {/* Column 1: Brand & Overview */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 text-white group select-none">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform border border-blue-400/30">
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                Fam<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Flix</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              {t('footer_about_text', 'A sleek, modern streaming and download platform offering fast, high-quality media with no intrusive ads and minimal data overhead.')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></span>
              <span>{t('footer_servers_active', 'Live streaming clusters active and monitored 24/7')}</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('footer_sections', 'Platform Sections')}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors inline-flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('nav_home', 'Home')}</span>
                </Link>
              </li>
              <li>
                <Link href="/?tab=movies" className="hover:text-blue-400 transition-colors inline-flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('nav_movies', 'Movies')}</span>
                </Link>
              </li>
              <li>
                <Link href="/?tab=series" className="hover:text-purple-400 transition-colors inline-flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5 text-purple-500" />
                  <span>{t('nav_series', 'TV Series')}</span>
                </Link>
              </li>
              <li>
                <Link href="/falak" className="hover:text-rose-400 transition-colors inline-flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('nav_falak', 'Falak')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Features */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('footer_features', 'Streaming Highlights')}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t('footer_feature_1', 'Instant zero-buffer playback')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{t('footer_feature_2', 'CORS bypass & secure stream links')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-blue-400 font-bold text-xs font-mono shrink-0">1080p</span>
                <span>{t('footer_feature_3', 'Multi-bitrate 1080p, 720p, 480p support')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-400 font-bold text-xs font-mono shrink-0">Embed</span>
                <span>{t('footer_feature_4', 'Responsive embed code for publishers')}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Disclaimer & Legal */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('footer_disclaimer_title', 'Disclaimer')}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('footer_disclaimer_text', 'All media files and hyperlinks displayed on this site are automatically indexed from publicly available servers.')}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} FamFlix. {t('footer_copy', 'All rights reserved.')}
          </p>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{t('footer_crafted', 'Crafted for luxury streaming speed and cinematic fidelity')}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
