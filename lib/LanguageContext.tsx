"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LangCode } from '@/types';
import { T, LANGUAGES, LanguageInfo } from '@/lib/i18n';

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  dir: 'rtl' | 'ltr';
  languages: readonly LanguageInfo[];
  currentLangInfo: LanguageInfo;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'falak_lang';
const LEGACY_STORAGE_KEY = 'famflix_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always initialize as 'ar' so SSR and client initial hydration match 100% without error #418
  const [lang, setLangState] = useState<LangCode>('ar');

  // Restore saved language in useEffect after client-side hydration completes safely
  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as LangCode | null;
      if (saved && (saved === 'ar' || saved === 'en' || saved === 'fr' || saved === 'es' || saved === 'tr')) {
        if (saved !== 'ar') {
          setTimeout(() => {
            setLangState(saved);
          }, 0);
        }
        const info = LANGUAGES.find((l) => l.code === saved);
        const dir = info?.dir || (saved === 'ar' ? 'rtl' : 'ltr');
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved;
          document.documentElement.dir = dir;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync document element attributes whenever lang changes
  useEffect(() => {
    const info = LANGUAGES.find((l) => l.code === lang);
    const dir = info?.dir || (lang === 'ar' ? 'rtl' : 'ltr');
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang]);

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    const info = LANGUAGES.find((l) => l.code === newLang);
    const dir = info?.dir || (newLang === 'ar' ? 'rtl' : 'ltr');

    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
      document.documentElement.dir = dir;
    }

    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      localStorage.setItem(LEGACY_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }

    // Broadcast event for any legacy / independent listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('famflix-lang-change', { detail: { lang: newLang, dir } }));
    }
  }, []);

  const currentLangInfo = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const dir: 'rtl' | 'ltr' = currentLangInfo.dir;

  const t = useCallback((key: string, fallback?: string): string => {
    const dict = T[lang] || T.ar;
    return dict[key] || fallback || T.en[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        dir,
        languages: LANGUAGES,
        currentLangInfo,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return fallback if called outside provider (e.g. during edge renders)
    const fallbackInfo = LANGUAGES[0];
    return {
      lang: 'ar',
      setLang: () => {},
      dir: 'rtl',
      languages: LANGUAGES,
      currentLangInfo: fallbackInfo,
      t: (key: string, fallback?: string) => T.ar[key] || fallback || key,
    };
  }
  return context;
}
