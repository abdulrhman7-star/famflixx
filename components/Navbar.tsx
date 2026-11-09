"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Play, 
  Film, 
  Tv, 
  Search, 
  Code2, 
  Menu, 
  X, 
  Zap,
  Clock,
  Globe,
  ChevronDown,
  Check,
  Sparkles
} from 'lucide-react';
import EmbedModal from './EmbedModal';
import { useLanguage } from '@/lib/LanguageContext';
import { LangCode } from '@/types';
import { PWAInstallButton } from './PWAInstallButton';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, dir, languages, currentLangInfo, t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const mobileLangMenuRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        langMenuRef.current && 
        !langMenuRef.current.contains(event.target as Node)
      ) {
        setLangDropdownOpen(false);
      }
    }
    if (langDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [langDropdownOpen]);

  // If in /embed, do not render navbar
  if (pathname?.startsWith('/embed')) {
    return null;
  }

  const handleNavClick = (tab: 'all' | 'movies' | 'series' | 'history') => {
    setMobileMenuOpen(false);
    if (pathname !== '/') {
      router.push(`/?tab=${tab}`);
    } else {
      window.dispatchEvent(new CustomEvent('nav-tab-change', { detail: { tab } }));
      if (tab === 'movies') {
        const el = document.getElementById('movies-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'series') {
        const el = document.getElementById('series-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      } else if (tab === 'history') {
        const el = document.getElementById('watch-history-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setMobileMenuOpen(false);
    if (pathname !== '/') {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      window.dispatchEvent(new CustomEvent('nav-search', { detail: { query: searchQuery.trim() } }));
    }
  };

  const selectLanguage = (code: LangCode) => {
    setLang(code);
    setLangDropdownOpen(false);
  };

  return (
    <>
      <header 
        className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl shadow-xl shadow-black/30 transition-all"
        dir={dir}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Zone 1: Single Brand element */}
          <Link 
            href="/"
            onClick={() => handleNavClick('all')}
            className="flex items-center gap-3 text-white hover:opacity-95 transition-all whitespace-nowrap shrink-0 group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 group-hover:shadow-blue-500/50 transition-all border border-blue-400/30">
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                Fam<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Flix</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
                {t('site_tagline', 'Stream & Download')}
              </span>
            </div>
          </Link>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('all')}
              className="hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative group"
            >
              <span>{t('nav_home', 'Home')}</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </button>
            <button
              onClick={() => handleNavClick('movies')}
              className="flex items-center gap-2 hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative group"
            >
              <Film className="w-4 h-4 text-blue-400" />
              <span>{t('nav_movies', 'Movies')}</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </button>
            <button
              onClick={() => handleNavClick('series')}
              className="flex items-center gap-2 hover:text-purple-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative group"
            >
              <Tv className="w-4 h-4 text-purple-400" />
              <span>{t('nav_series', 'TV Series')}</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </button>
            <Link
              href="/falak"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-rose-400 transition-colors whitespace-nowrap shrink-0 py-1 relative group"
            >
              <span>{t('nav_falak', 'Falak')}</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </Link>
            <button
              onClick={() => handleNavClick('history')}
              className="flex items-center gap-2 hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative group"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{t('nav_history', 'Watch History')}</span>
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
            </button>
          </nav>

          {/* Zone 3: Quick Search, Embed, & Language Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Inline Quick Search Form on desktop */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
              <input
                type="text"
                placeholder={t('search_quick', 'Quick search...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 xl:w-52 glass-input rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:w-60 transition-all duration-300"
              />
              <button 
                type="submit" 
                className={`absolute ${dir === 'rtl' ? 'left-2.5' : 'right-2.5'} text-slate-400 hover:text-white transition-colors`}
                title={t('search_btn', 'Search')}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Embed Generator Trigger */}
            <button
              onClick={() => setIsEmbedOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 border border-blue-400/20 whitespace-nowrap shrink-0 active:scale-95"
              title={t('nav_embed', 'Embed Code')}
            >
              <Code2 className="w-3.5 h-3.5 text-blue-200" />
              <span className="hidden md:inline">{t('nav_embed', 'Embed Code')}</span>
            </button>

            {/* PWA Install Button */}
            <div className="hidden sm:flex items-center">
              <PWAInstallButton />
            </div>

            {/* Modern Glassmorphic Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 glass-card hover:text-white border border-white/10 hover:border-blue-400/40 transition-all duration-200 shadow-sm active:scale-95 select-none"
                aria-expanded={langDropdownOpen}
                aria-haspopup="true"
                title={t('nav_language', 'Language')}
              >
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm shrink-0">{currentLangInfo.flag}</span>
                <span className="font-medium hidden sm:inline">{currentLangInfo.nativeLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${langDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              {/* Luxury Dropdown Menu */}
              {langDropdownOpen && (
                <div 
                  className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} mt-2 w-48 py-2 glass-dropdown rounded-2xl border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150`}
                  role="menu"
                >
                  <div className="px-3 py-1.5 border-b border-white/5 mb-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-blue-400" />
                      {t('nav_language', 'Language')}
                    </span>
                  </div>

                  {languages.map((l) => {
                    const isSelected = l.code === lang;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => selectLanguage(l.code)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-all ${
                          isSelected 
                            ? 'bg-blue-600/20 text-blue-300 font-bold border-r-2 border-blue-500' 
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{l.flag}</span>
                          <span className="text-sm">{l.nativeLabel}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-mono">({l.code})</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white glass-card rounded-xl border border-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('search_placeholder', 'Search movies or series...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button 
                type="submit" 
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm flex items-center justify-center shadow-md shadow-blue-600/30 transition-all"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-col gap-1.5 pt-1">
              <button
                onClick={() => handleNavClick('all')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all text-start"
              >
                <Play className="w-4 h-4 text-blue-400" />
                <span>{t('nav_home', 'Home')}</span>
              </button>
              <button
                onClick={() => handleNavClick('movies')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all text-start"
              >
                <Film className="w-4 h-4 text-blue-400" />
                <span>{t('nav_movies', 'Movies')}</span>
              </button>
              <button
                onClick={() => handleNavClick('series')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all text-start"
              >
                <Tv className="w-4 h-4 text-purple-400" />
                <span>{t('nav_series', 'TV Series')}</span>
              </button>
              <Link
                href="/falak"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-300 hover:bg-white/5 hover:text-white transition-all text-start"
              >
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>{t('nav_falak', 'Falak')}</span>
              </Link>
              <button
                onClick={() => handleNavClick('history')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5 hover:text-white transition-all text-start"
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{t('nav_history', 'Watch History')}</span>
              </button>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  {t('nav_language', 'Language')}
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => selectLanguage(l.code)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                        l.code === lang 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {l.flag} {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-center">
                <PWAInstallButton />
              </div>
            </div>
          </div>
        )}
      </header>

      <EmbedModal
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
        defaultVideoUrl="https://akwam.ss/movies"
        defaultTitle="FamFlix Player"
      />
    </>
  );
}
