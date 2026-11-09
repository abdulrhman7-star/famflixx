'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, Film, Tv } from 'lucide-react';
import { fetchTMDB } from '@/lib/tmdb';
import { MediaItem, LangCode } from '@/types';
import { T, LANGUAGES } from '@/lib/i18n';

const MAX_CACHE = 50;

interface FalakHeroSearchProps {
  lang: LangCode;
  onSelectMedia: (item: MediaItem) => void;
}

export default function FalakHeroSearch({ lang, onSelectMedia }: FalakHeroSearchProps) {
  const t = T[lang] || T.ar;
  const tmdbLang = LANGUAGES.find((l) => l.code === lang)?.tmdb || 'ar-SA';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Map<string, MediaItem[]>>(new Map());
  const reqIdRef = useRef(0);

  // Debounced TMDB search + cache + stale-response protection
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      queueMicrotask(() => {
        setLoading(false);
        setResults([]);
      });
      return;
    }

    const cacheKey = `${lang}_${q}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      queueMicrotask(() => {
        setResults(cached);
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      setLoading(true);
    });
    const reqId = ++reqIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const data = await fetchTMDB(
          `/search/multi?query=${encodeURIComponent(q)}&include_adult=false`,
          { lang: tmdbLang }
        );

        if (reqId !== reqIdRef.current) return;

        const filtered = (data.results || [])
          .filter(
            (i: any) =>
              (i.media_type === 'movie' || i.media_type === 'tv') &&
              i.poster_path
          )
          .slice(0, 8);

        if (cacheRef.current.size >= MAX_CACHE) cacheRef.current.clear();
        cacheRef.current.set(cacheKey, filtered);
        setResults(filtered);
      } catch {
        if (reqId === reqIdRef.current) setResults([]);
      } finally {
        if (reqId === reqIdRef.current) setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, lang, tmdbLang]);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleSelect = useCallback(
    (item: MediaItem) => {
      setIsOpen(false);
      setQuery('');
      setResults([]);
      onSelectMedia(item);
    },
    [onSelectMedia]
  );

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-12 sm:-mt-14 relative z-20">
      <div ref={containerRef} className="relative">
        {/* Search input */}
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={t.search_placeholder || 'ابحث عن فيلم أو مسلسل...'}
            className="w-full bg-[#13151f]/95 backdrop-blur-xl border-2 border-white/10 focus:border-red-500 rounded-full py-4 sm:py-5 pr-14 pl-14 text-sm sm:text-base text-white placeholder-gray-500 outline-none focus:ring-4 focus:ring-red-500/20 shadow-2xl shadow-black/60 transition-all"
          />
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-focus-within:text-red-500 absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none" />

          {loading ? (
            <Loader2 className="w-5 h-5 text-red-500 absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 animate-spin pointer-events-none" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* Live dropdown */}
        {isOpen && (query.trim().length >= 2 || loading) && (
          <div className="absolute top-full inset-x-0 mt-3 bg-[#0e1017]/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl max-h-[480px] overflow-y-auto p-2 z-30">
            {loading && results.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-xs">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-red-500" />
                {t.search_searching || 'جاري البحث...'}
              </div>
            )}

            {!loading && results.length === 0 && query.trim().length >= 2 && (
              <div className="py-8 text-center text-gray-400 text-xs">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {t.search_no_results || 'لا توجد نتائج'}
              </div>
            )}

            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-gray-500 uppercase">
                  <span>{t.search_instant || 'النتائج'}</span>
                  <span>{results.length}</span>
                </div>
                {results.map((item) => {
                  const title = item.title || item.name || '—';
                  const year =
                    (item.release_date || item.first_air_date || '').substring(0, 4) || '—';
                  const rating = Number(item.vote_average || 0).toFixed(1);
                  const isTv = item.media_type === 'tv';
                  return (
                    <button
                      key={`${item.media_type || 'movie'}_${item.id}`}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                          alt={title}
                          className="w-11 h-16 object-cover rounded-lg bg-gray-800 shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-11 h-16 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                          {isTv ? (
                            <Tv className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Film className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          <span className="px-1.5 py-0.5 rounded bg-white/10 font-bold text-gray-300">
                            {isTv
                              ? `📺 ${t.series_label || 'مسلسل'}`
                              : `🎬 ${t.movie_label || 'فيلم'}`}
                          </span>
                          <span>{year}</span>
                          <span className="text-amber-400 font-bold">★ {rating}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}