// components/FalakClientPage.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import GenreChips from '@/components/GenreChips';
import DetailPanel from '@/components/DetailPanel';
import MediaCard from '@/components/MediaCard';
import UnauthorizedDomainModal from '@/components/UnauthorizedDomainModal';
import Hero from '@/components/Hero';
import FalakHeroSearch from '@/components/FalakHeroSearch';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// ✅ Player يُحمَّل فقط عند فتحه — يوفّر ~110 KB من الحزمة الأولية
const Player = dynamic(() => import('@/components/Player'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center text-white">
      <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
    </div>
  ),
});

import { fetchTMDB } from '@/lib/tmdb';
import { auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { Play, Bookmark, Search as SearchIcon, Film, Trash2, X } from 'lucide-react';
import { MediaItem, LangCode, ContinueWatchingItem } from '@/types';
import { T, LANGUAGES } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import {
  buildPermalink,
  parsePermalink,
  updateMediaMetadata,
  resetMediaMetadata,
} from '@/lib/permalink';

const LOCAL_FAVORITES_KEY = 'falak_favorites_guest';
const LOCAL_CONTINUE_WATCHING_KEY = 'falak_continue_watching';
const LOCAL_RECENT_SEARCHES_KEY = 'falak_recent_searches';
const MAX_SEARCH_CACHE = 50;

const getMediaKey = (item: any): string => {
  const type = item?.mediaType || item?.media_type || 'movie';
  return `${type}_${item?.id}`;
};

export interface FalakClientPageProps {
  initialSearchParams?: {
    type?: string;
    id?: string;
    title?: string;
    s?: string;
    e?: string;
    tab?: string;
  };
}

export default function FalakClientPage({ initialSearchParams }: FalakClientPageProps) {
  const { lang, setLang } = useLanguage();
  const t = T[lang] || T.ar;
  const tmdbLang = LANGUAGES.find((l) => l.code === lang)?.tmdb || 'ar-SA';

  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'favorites'>('home');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreLogic, setGenreLogic] = useState<'or' | 'and'>('or');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);

  const [isInitialPermalinkLoading, setIsInitialPermalinkLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);

  const selectedMediaRef = useRef<any>(selectedMedia);
  useEffect(() => {
    selectedMediaRef.current = selectedMedia;
  }, [selectedMedia]);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showAppToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchCacheRef = useRef<Map<string, MediaItem[]>>(new Map());
  const searchRequestIdRef = useRef(0);

  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<MediaItem[]>([]);

  const handleTabChange = useCallback((tab: 'home' | 'search' | 'favorites') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (tab === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, []);

  // ===== Auth listener + cloud/local favorites merge =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) return;
      try {
        const snapshot = await getDocs(collection(db, 'users', currentUser.uid, 'favorites'));
        const cloudFavs: MediaItem[] = [];
        snapshot.forEach((docSnap) => cloudFavs.push(docSnap.data() as MediaItem));

        let localFavs: MediaItem[] = [];
        try {
          const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localFavs = parsed;
          }
        } catch {}

        const cloudKeys = new Set(cloudFavs.map(getMediaKey));
        const merged: MediaItem[] = [...cloudFavs];
        const toUpload: MediaItem[] = [];

        localFavs.forEach((item) => {
          if (!cloudKeys.has(getMediaKey(item))) {
            merged.push(item);
            toUpload.push(item);
          }
        });

        toUpload.forEach((item) => {
          setDoc(
            doc(db, 'users', currentUser.uid, 'favorites', getMediaKey(item)),
            item
          ).catch(() => {});
        });

        setFavorites(merged);
        try {
          localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(merged));
        } catch {}
      } catch (e) {
        console.warn('Failed to fetch user favorites from cloud:', e);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleFavorite = useCallback(
    async (item: any) => {
      const mediaItem: MediaItem = {
        id: item.id,
        mediaType: item.mediaType || item.media_type || 'movie',
        title: item.title || item.name || '',
        poster_path: item.poster_path || '',
        vote_average: item.vote_average || 0,
        release_date: item.release_date || item.first_air_date || '',
      };

      const isFav = favorites.some((f) => getMediaKey(f) === getMediaKey(mediaItem));
      const updatedList = isFav
        ? favorites.filter((f) => getMediaKey(f) !== getMediaKey(mediaItem))
        : [mediaItem, ...favorites];

      setFavorites(updatedList);
      try {
        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updatedList));
      } catch {}

      if (user) {
        const favRef = doc(db, 'users', user.uid, 'favorites', getMediaKey(mediaItem));
        if (isFav) {
          deleteDoc(favRef).catch((e) => console.warn('fav delete failed:', e));
        } else {
          setDoc(favRef, mediaItem).catch((e) => console.warn('fav write failed:', e));
        }
      }
    },
    [favorites, user]
  );

  const updateContinueWatching = useCallback(
    (item: any, season?: number, episode?: number) => {
      setContinueWatching((prev) => {
        const newItem: ContinueWatchingItem = {
          id: item.id,
          mediaType: (item.mediaType || item.media_type || 'movie') as any,
          title: item.title || item.name || '',
          poster_path: item.poster_path || '',
          season,
          episode,
          lastUpdated: Date.now(),
        };
        const filtered = prev.filter((i) => getMediaKey(i) !== getMediaKey(item));
        const updated = [newItem, ...filtered].slice(0, 12);
        try {
          localStorage.setItem(LOCAL_CONTINUE_WATCHING_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    []
  );

  const removeFromHistory = useCallback((id: number, mediaType: string) => {
    setContinueWatching((prev) => {
      const updated = prev.filter(
        (i) => !(i.id === id && i.mediaType === mediaType)
      );
      try {
        localStorage.setItem(LOCAL_CONTINUE_WATCHING_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error?.code === 'auth/unauthorized-domain') {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
        setUnauthorizedDomain(currentHost || 'unknown-domain');
      } else if (error?.code === 'auth/popup-blocked') {
        showAppToast(
          lang === 'ar'
            ? 'تم حظر النافذة المنبثقة، يرجى السماح بالنوافذ لتسجيل الدخول'
            : 'Popup blocked, please allow popups to sign in'
        );
      } else if (
        error?.code !== 'auth/popup-closed-by-user' &&
        error?.code !== 'auth/cancelled-popup-request'
      ) {
        console.warn('Login warning:', error?.message || error);
        showAppToast(
          lang === 'ar' ? 'تعذر تسجيل الدخول، يرجى المحاولة لاحقاً' : 'Login failed, please try again'
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLanguageChange = (newLang: LangCode) => {
    setLang(newLang);
    try {
      localStorage.setItem('falak_lang', newLang);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
      const found = LANGUAGES.find((l) => l.code === newLang);
      document.documentElement.dir = found?.dir || (newLang === 'ar' ? 'rtl' : 'ltr');
    }
    searchCacheRef.current.clear();
    searchRequestIdRef.current++;
    const tNew = T[newLang] || T.ar;
    showAppToast(tNew.toast_lang_changed || '🌐 Language changed');
  };

  const handleToggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };
  const handleClearGenres = () => setSelectedGenres([]);

  useEffect(() => {
    let isCancelled = false;
    async function loadMovies() {
      setLoading(true);
      try {
        let endpoint = '/movie/popular';
        if (selectedGenres.length > 0) {
          const sep = genreLogic === 'and' ? ',' : '|';
          const genreParam = selectedGenres.join(sep);
          endpoint = `/discover/movie?with_genres=${genreParam}&sort_by=popularity.desc`;
        }
        const data = await fetchTMDB(endpoint, { lang: tmdbLang });
        if (!isCancelled) setMedia(data.results || []);
      } catch (error) {
        console.error('Error fetching movies:', error);
        if (!isCancelled) setMedia([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadMovies();
    return () => {
      isCancelled = true;
    };
  }, [selectedGenres, genreLogic, tmdbLang]);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    setSearchOpen(true);
    if (q.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchQuery.trim();

    if (q.length < 2) {
      queueMicrotask(() => {
        setSearchLoading(false);
        setSearchResults([]);
      });
      return;
    }

    const cacheKey = `${lang}_${q}`;
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      queueMicrotask(() => {
        setSearchResults(cached);
        setSearchLoading(false);
      });
      return;
    }

    queueMicrotask(() => {
      setSearchLoading(true);
    });
    const requestId = ++searchRequestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const data = await fetchTMDB(
          `/search/multi?query=${encodeURIComponent(q)}&include_adult=false`,
          { lang: tmdbLang }
        );

        if (requestId !== searchRequestIdRef.current) return;

        const filtered = (data.results || [])
          .filter(
            (item: any) =>
              (item.media_type === 'movie' || item.media_type === 'tv') &&
              item.poster_path
          )
          .slice(0, 10);

        if (searchCacheRef.current.size >= MAX_SEARCH_CACHE) {
          searchCacheRef.current.clear();
        }
        searchCacheRef.current.set(cacheKey, filtered);
        setSearchResults(filtered);
      } catch (e) {
        if (requestId !== searchRequestIdRef.current) return;
        console.error('Search error:', e);
        setSearchResults([]);
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setSearchLoading(false);
        }
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery, tmdbLang, lang]);

  const saveToRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((s) => s !== clean)].slice(0, 8);
      try {
        localStorage.setItem(LOCAL_RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(LOCAL_RECENT_SEARCHES_KEY);
    } catch {}
  }, []);

  const handleSelectRecentSearch = useCallback(
    (term: string) => {
      handleSearchChange(term);
    },
    [handleSearchChange]
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => {
            setFavorites(parsed);
          });
        }
      }
    } catch (e) {
      console.warn('Could not read guest favorites:', e);
    }

    try {
      const stored = localStorage.getItem(LOCAL_RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => {
            setRecentSearches(parsed);
          });
        }
      }
    } catch (e) {
      console.warn('Could not read recent searches:', e);
    }

    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    const tabParam = initialSearchParams?.tab || params.get('tab');
    if (tabParam === 'search' || tabParam === 'favorites') {
      queueMicrotask(() => {
        setActiveTab(tabParam);
      });
    }

    try {
      const stored = localStorage.getItem(LOCAL_CONTINUE_WATCHING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          queueMicrotask(() => {
            setContinueWatching(parsed);
          });
        }
      }
    } catch (e) {
      console.warn('Could not read continue watching history:', e);
    }

    const targetType = initialSearchParams?.type || params.get('type');
    const targetId = initialSearchParams?.id || params.get('id');
    const parsed =
      parsePermalink(search) ||
      (targetType && targetId
        ? {
            isValid: true,
            type: targetType as 'movie' | 'tv',
            id: parseInt(targetId, 10),
            season: initialSearchParams?.s ? parseInt(initialSearchParams.s, 10) : 1,
            episode: initialSearchParams?.e ? parseInt(initialSearchParams.e, 10) : 1,
            hasEpisodeParams: Boolean(initialSearchParams?.s || initialSearchParams?.e),
          }
        : null);

    if (parsed && parsed.isValid && !isNaN(parsed.id)) {
      let cancelled = false;
      queueMicrotask(() => {
        setIsInitialPermalinkLoading(true);
      });

      fetchTMDB(
        `/${parsed.type}/${parsed.id}?append_to_response=credits,videos,external_ids`,
        { lang: tmdbLang }
      )
        .then((details) => {
          if (cancelled) return;
          const fullItem = { ...details, mediaType: parsed.type };
          setSelectedMedia(fullItem);
          setCurrentSeason(parsed.season);
          setCurrentEpisode(parsed.episode);
          setShowPlayer(false);
          updateMediaMetadata(fullItem, parsed.season, parsed.episode);
        })
        .catch((err) => {
          if (cancelled) return;
          console.warn('Permalink item not found:', err);
          showAppToast(
            lang === 'ar'
              ? 'العنصر المطلوب غير موجود'
              : 'Requested item not found'
          );
          resetMediaMetadata();
          if (typeof window !== 'undefined') {
            const pathname = window.location.pathname || '/';
            const cleanUrl =
              tabParam && tabParam !== 'home' ? `${pathname}?tab=${tabParam}` : pathname;
            window.history.replaceState({ tab: tabParam || 'home' }, '', cleanUrl);
          }
        })
        .finally(() => {
          if (!cancelled) setIsInitialPermalinkLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = async () => {
      const search = window.location.search;
      const parsed = parsePermalink(search);
      const params = new URLSearchParams(search);
      const tabParam = params.get('tab');

      if (tabParam === 'search' || tabParam === 'favorites' || tabParam === 'home') {
        setActiveTab(tabParam);
      }

      if (parsed && parsed.isValid) {
        setCurrentSeason(parsed.season);
        setCurrentEpisode(parsed.episode);

        const current = selectedMediaRef.current;
        const sameMedia =
          current &&
          current.id === parsed.id &&
          (current.mediaType === parsed.type || current.media_type === parsed.type);

        if (sameMedia) {
          setShowPlayer(false);
          updateMediaMetadata(current, parsed.season, parsed.episode);
        } else {
          try {
            const details = await fetchTMDB(
              `/${parsed.type}/${parsed.id}?append_to_response=credits,videos,external_ids`,
              { lang: tmdbLang }
            );
            const fullItem = { ...details, mediaType: parsed.type };
            setSelectedMedia(fullItem);
            setShowPlayer(false);
            updateMediaMetadata(fullItem, parsed.season, parsed.episode);
          } catch {
            setSelectedMedia(null);
            setShowPlayer(false);
            resetMediaMetadata();
          }
        }
      } else {
        setSelectedMedia(null);
        setShowPlayer(false);
        resetMediaMetadata();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [tmdbLang]);

  const handleOpenDetail = useCallback(
    async (
      id: number,
      type?: 'movie' | 'tv' | string,
      initialTitle?: string,
      initialSeason = 1,
      initialEpisode = 1
    ) => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const resolvedType = String(type).toLowerCase() === 'tv' ? 'tv' : 'movie';

      let startS = initialSeason;
      let startE = initialEpisode;
      if (initialSeason === 1 && initialEpisode === 1) {
        const saved = continueWatching.find(
          (i) => i.id === id && i.mediaType === resolvedType
        );
        if (saved) {
          startS = saved.season || 1;
          startE = saved.episode || 1;
        }
      }

      const preliminaryUrl = buildPermalink({
        type: resolvedType,
        id,
        title: initialTitle,
        season: resolvedType === 'tv' ? startS : undefined,
        episode: resolvedType === 'tv' ? startE : undefined,
      });
      window.history.pushState(
        { type: resolvedType, id, season: startS, episode: startE, tab: activeTab },
        '',
        preliminaryUrl
      );

      try {
        const details = await fetchTMDB(
          `/${resolvedType}/${id}?append_to_response=credits,videos,external_ids`,
          { lang: tmdbLang }
        );
        const fullItem = { ...details, mediaType: resolvedType };
        setSelectedMedia(fullItem);
        setCurrentSeason(startS);
        setCurrentEpisode(startE);
        setShowPlayer(false);

        const finalUrl = buildPermalink({
          type: resolvedType,
          id,
          title: fullItem.title || fullItem.name || initialTitle,
          season: resolvedType === 'tv' ? startS : undefined,
          episode: resolvedType === 'tv' ? startE : undefined,
        });
        window.history.replaceState(
          { type: resolvedType, id, season: startS, episode: startE, tab: activeTab },
          '',
          finalUrl
        );
        updateMediaMetadata(fullItem, startS, startE);
      } catch {
        const fallbackItem = { id, mediaType: resolvedType, title: initialTitle };
        setSelectedMedia(fallbackItem);
        setCurrentSeason(startS);
        setCurrentEpisode(startE);
        setShowPlayer(false);
        updateMediaMetadata(fallbackItem, startS, startE);
      }
    },
    [continueWatching, activeTab, tmdbLang]
  );

  // ===== البحث من Header =====
  const handleSelectSearchResult = useCallback(
    (item: MediaItem) => {
      const type = (item as any).media_type || item.mediaType || 'movie';
      const title = item.title || item.name || '';
      saveToRecentSearch(title);
      setSearchOpen(false);
      setSearchQuery('');
      handleOpenDetail(item.id, type, title);
    },
    [saveToRecentSearch, handleOpenDetail]
  );

  // ===== البحث من Hero =====
  const handleSelectHeroResult = useCallback(
    (item: MediaItem) => {
      const type = (item as any).media_type || item.mediaType || 'movie';
      const title = item.title || item.name || '';
      saveToRecentSearch(title);
      handleOpenDetail(item.id, type, title);
    },
    [saveToRecentSearch, handleOpenDetail]
  );

  const handleQuickPlay = useCallback(
    async (item: any) => {
      const isTv = item.mediaType === 'tv' || item.media_type === 'tv';
      const resolvedType = isTv ? 'tv' : 'movie';
      const initialTitle = item.title || item.name;

      const saved = continueWatching.find((i) => getMediaKey(i) === getMediaKey(item));
      const startS = saved?.season || 1;
      const startE = saved?.episode || 1;

      const permalink = buildPermalink({
        type: resolvedType,
        id: item.id,
        title: initialTitle,
        season: resolvedType === 'tv' ? startS : undefined,
        episode: resolvedType === 'tv' ? startE : undefined,
      });
      window.history.pushState(
        {
          type: resolvedType,
          id: item.id,
          season: startS,
          episode: startE,
          tab: activeTab,
        },
        '',
        permalink
      );

      try {
        const details = await fetchTMDB(
          `/${resolvedType}/${item.id}?append_to_response=credits,videos,external_ids`,
          { lang: tmdbLang }
        );
        const fullItem = { ...details, mediaType: resolvedType };
        setSelectedMedia(fullItem);
        setCurrentSeason(startS);
        setCurrentEpisode(startE);
        setShowPlayer(true);
        updateMediaMetadata(fullItem, startS, startE);
        updateContinueWatching(fullItem, startS, startE);
      } catch {
        const fallbackItem = { ...item, mediaType: resolvedType };
        setSelectedMedia(fallbackItem);
        setCurrentSeason(startS);
        setCurrentEpisode(startE);
        setShowPlayer(true);
        updateMediaMetadata(fallbackItem, startS, startE);
        updateContinueWatching(fallbackItem, startS, startE);
      }
    },
    [continueWatching, activeTab, tmdbLang, updateContinueWatching]
  );

  const handleSelectEpisode = (season: number, episode: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
    if (selectedMedia) {
      const isTv = selectedMedia.mediaType === 'tv' || selectedMedia.media_type === 'tv';
      if (isTv) {
        const updatedPermalink = buildPermalink({
          type: 'tv',
          id: selectedMedia.id,
          title: selectedMedia.title || selectedMedia.name,
          season,
          episode,
        });
        window.history.replaceState(
          { ...window.history.state, season, episode },
          '',
          updatedPermalink
        );
        updateMediaMetadata(selectedMedia, season, episode);
        if (showPlayer) {
          updateContinueWatching(selectedMedia, season, episode);
        }
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
    setShowPlayer(false);
    resetMediaMetadata();

    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname || '/';
      const cleanUrl =
        activeTab && activeTab !== 'home' ? `${pathname}?tab=${activeTab}` : pathname;
      window.history.replaceState({ tab: activeTab }, '', cleanUrl);
    }
  };

  const handleClosePlayer = () => setShowPlayer(false);

  return (
    <div className="bg-[#07080b] text-white min-h-screen flex flex-col antialiased">
      <Header
        lang={lang}
        onLangChange={handleLanguageChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        favoritesCount={favorites.length}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSelectResult={handleSelectSearchResult}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        recentSearches={recentSearches}
        onSelectRecent={handleSelectRecentSearch}
        onClearRecent={clearRecentSearches}
      />

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#13151f]/95 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-full shadow-2xl border border-red-500/40 backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 pt-[72px] pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-0">
        {/* ================= HOME ================= */}
        {activeTab === 'home' && (
          <div>
            <Hero />

            <FalakHeroSearch
              lang={lang}
              onSelectMedia={handleSelectHeroResult}
            />

            {continueWatching.length > 0 && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      {t.continue_watching}
                      <span className="text-xs font-normal text-gray-400">
                        ({continueWatching.length})
                      </span>
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setContinueWatching([]);
                      try {
                        localStorage.removeItem(LOCAL_CONTINUE_WATCHING_KEY);
                      } catch {}
                    }}
                    className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.clear_history || 'مسح السجل'}
                  </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
                  {continueWatching.map((item) => (
                    <div
                      key={getMediaKey(item)}
                      className="group relative flex-shrink-0 w-36 sm:w-44 bg-[#13151f] rounded-xl overflow-hidden border border-white/5 hover:border-red-500/30 transition-all shadow-md"
                    >
                      <div
                        onClick={() =>
                          handleOpenDetail(
                            item.id,
                            item.mediaType,
                            item.title,
                            item.season,
                            item.episode
                          )
                        }
                        className="cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
                          {item.poster_path ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                              alt={item.title}
                              fill
                              sizes="(max-width: 640px) 144px, 176px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600">
                              <Film className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                          {item.season && item.episode && (
                            <span className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-400 px-2 py-0.5 rounded-md border border-white/10">
                              S{item.season} E{item.episode}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-red-400 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-between">
                            <span>
                              {item.mediaType === 'tv'
                                ? t.series_label || 'مسلسل'
                                : t.movie_label || 'فيلم'}
                            </span>
                            <span className="text-red-400 font-semibold">
                              {t.btn_resume || 'استئناف'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.id, item.mediaType);
                        }}
                        title={t.remove || 'إزالة'}
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="movies-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-6">
                <GenreChips
                  lang={lang}
                  selectedGenres={selectedGenres}
                  onToggleGenre={handleToggleGenre}
                  onClearGenres={handleClearGenres}
                  genreLogic={genreLogic}
                  onChangeLogic={(newLogic) => setGenreLogic(newLogic)}
                />
              </div>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {selectedGenres.length > 0 ? t.filtered_results : t.latest_movies}
                  </h2>
                </div>
                {media.length > 0 && (
                  <span className="text-xs text-gray-400 font-medium">
                    {media.length} {t.results_count_label}
                  </span>
                )}
              </div>

              {loading || isInitialPermalinkLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse bg-[#13151f] rounded-xl aspect-[2/3] border border-white/5"
                    />
                  ))}
                </div>
              ) : media.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                  {media.map((item) => (
                    <MediaCard
                      key={getMediaKey(item)}
                      item={item}
                      isFavorite={favorites.some(
                        (f) => getMediaKey(f) === getMediaKey(item)
                      )}
                      onToggleFavorite={toggleFavorite}
                      onOpenDetail={(mediaItem) =>
                        handleOpenDetail(
                          mediaItem.id,
                          mediaItem.mediaType || mediaItem.media_type || 'movie',
                          mediaItem.title || mediaItem.name
                        )
                      }
                      onQuickPlay={handleQuickPlay}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-4 bg-[#13151f] rounded-2xl border border-white/5 my-6">
                  <Film className="w-14 h-14 text-gray-600 mx-auto mb-3" />
                  <h3 className="font-bold text-base text-gray-200 mb-1">
                    {t.no_movies_found}
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5 leading-relaxed">
                    {t.no_movies_desc}
                  </p>
                  <button
                    type="button"
                    onClick={handleClearGenres}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-lg shadow-red-600/30 transition cursor-pointer"
                  >
                    {t.clear_filters}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= SEARCH ================= */}
        {activeTab === 'search' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh]">
            <div className="max-w-2xl mx-auto mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">{t.search_title}</h2>
              <p className="text-xs sm:text-sm text-gray-400 mb-6">{t.search_subtitle}</p>

              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t.search_placeholder}
                  className="w-full bg-[#13151f] border border-white/10 focus:border-red-500 rounded-full py-3.5 pr-12 pl-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 shadow-xl transition"
                />
                <SearchIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {searchLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-[#13151f] rounded-xl aspect-[2/3] border border-white/5"
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {searchResults.map((item) => (
                  <MediaCard
                    key={getMediaKey(item)}
                    item={item}
                    isFavorite={favorites.some(
                      (f) => getMediaKey(f) === getMediaKey(item)
                    )}
                    onToggleFavorite={toggleFavorite}
                    onOpenDetail={(mediaItem) => handleSelectSearchResult(mediaItem)}
                    onQuickPlay={handleQuickPlay}
                  />
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="text-center py-16 px-4 bg-[#13151f] rounded-2xl border border-white/5">
                <SearchIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="font-bold text-base text-gray-200 mb-1">
                  {t.search_no_results}
                </h3>
                <p className="text-xs text-gray-400">{t.search_try_different}</p>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-xs">{t.search_initial_prompt}</p>
              </div>
            )}
          </section>
        )}

        {/* ================= FAVORITES ================= */}
        {activeTab === 'favorites' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-red-600 rounded-full" />
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {t.my_favorites}
                </h2>
                <span className="text-xs bg-red-600/20 text-red-400 font-bold px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              </div>

              {!user && (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium underline cursor-pointer"
                >
                  {t.login_to_sync}
                </button>
              )}
            </div>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {favorites.map((item) => (
                  <MediaCard
                    key={getMediaKey(item)}
                    item={item}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                    onOpenDetail={(mediaItem) =>
                      handleOpenDetail(
                        mediaItem.id,
                        mediaItem.mediaType || mediaItem.media_type || 'movie',
                        mediaItem.title || mediaItem.name
                      )
                    }
                    onQuickPlay={handleQuickPlay}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-4 bg-[#13151f] rounded-2xl border border-white/5 my-6">
                <Bookmark className="w-14 h-14 text-gray-600 mx-auto mb-3" />
                <h3 className="font-bold text-base text-gray-200 mb-1">
                  {t.favorites_empty}
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5 leading-relaxed">
                  {t.fav_guest_note}
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange('home')}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-lg shadow-red-600/30 transition cursor-pointer"
                >
                  {t.btn_browse}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      <MobileNav
        lang={lang}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        favoritesCount={favorites.length}
        hidden={showPlayer}
      />

      {selectedMedia && !showPlayer && (
        <DetailPanel
          media={selectedMedia}
          lang={lang}
          isFavorite={favorites.some(
            (f) => getMediaKey(f) === getMediaKey(selectedMedia)
          )}
          onToggleFavorite={toggleFavorite}
          onClose={handleCloseModal}
          onWatch={() => {
            setShowPlayer(true);
            updateContinueWatching(selectedMedia, currentSeason, currentEpisode);
          }}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onSelectEpisode={handleSelectEpisode}
        />
      )}

      {showPlayer && selectedMedia && (
        <Player
          media={selectedMedia}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onClose={handleClosePlayer}
          onSelectEpisode={handleSelectEpisode}
          lang={lang}
        />
      )}

      {unauthorizedDomain && (
        <UnauthorizedDomainModal
          domain={unauthorizedDomain}
          lang={lang}
          onClose={() => setUnauthorizedDomain(null)}
        />
      )}
    </div>
  );
}