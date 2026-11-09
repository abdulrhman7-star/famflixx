"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Play, 
  Download, 
  Film, 
  Tv, 
  ArrowRight, 
  ArrowLeft,
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Code2, 
  Share2,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Trash2,
  Star,
  Check
} from 'lucide-react';
import EmbedModal from './EmbedModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HistoryItem, 
  useWatchHistory, 
  addToWatchHistory, 
  clearWatchHistory, 
  removeFromWatchHistory 
} from '@/lib/history';
import { useLanguage } from '@/lib/LanguageContext';

interface MediaItem {
  title: string;
  url: string;
  image: string;
  rating?: string;
  quality?: string;
}

interface VideoLink {
  quality: string;
  url: string;
}

function formatRelativeTime(timestamp: number, lang: string): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) {
    return lang === 'ar' ? 'منذ لحظات' : lang === 'fr' ? 'À l’instant' : lang === 'es' ? 'Hace un momento' : 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return lang === 'ar' ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return lang === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return lang === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
}

export default function AkwamApp() {
  const { lang, dir, t } = useLanguage();
  const isRtl = dir === 'rtl';

  const [view, setView] = useState<'home' | 'search' | 'series' | 'watch'>('home');
  const [homeTab, setHomeTab] = useState<'all' | 'movies' | 'series' | 'history'>('all');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const watchHistory = useWatchHistory();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);
  const effectiveHistory = mounted ? watchHistory : [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [episodes, setEpisodes] = useState<MediaItem[]>([]);
  const [videoLinks, setVideoLinks] = useState<VideoLink[]>([]);
  const [selectedQualityIdx, setSelectedQualityIdx] = useState<number>(0);
  const [videoError, setVideoError] = useState(false);
  const [streamMode, setStreamMode] = useState<'direct' | 'proxy'>('direct');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Embed Modal State
  const [isEmbedOpen, setIsEmbedOpen] = useState<boolean>(false);
  const [embedVideoUrl, setEmbedVideoUrl] = useState<string>('');
  const [embedTitle, setEmbedTitle] = useState<string>('FamFlix Embed Player');
  const [activeClickedId, setActiveClickedId] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState<boolean>(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const smoothScrollToViewer = () => {
    if (typeof window !== 'undefined') {
      if (viewerRef.current) {
        viewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    if (view === 'watch' || view === 'series' || view === 'home') {
      const timer = setTimeout(() => {
        smoothScrollToViewer();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [view]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchHomeData = async () => {
    setLoading(true);
    setError('');
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        fetch('/api/movies?page=1').then((res) => res.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/series?page=1').then((res) => res.json()).catch(() => ({ success: false, data: [] })),
      ]);
      if (moviesRes.success && Array.isArray(moviesRes.data) && moviesRes.data.length > 0) {
        setMovies(moviesRes.data);
      }
      if (seriesRes.success && Array.isArray(seriesRes.data) && seriesRes.data.length > 0) {
        setSeries(seriesRes.data);
      }
      if (!moviesRes.success && !seriesRes.success) {
        setError(moviesRes.error || seriesRes.error || t('toast_data_error', 'Failed to fetch data'));
      }
    } catch (e: any) {
      console.error(e);
      setError(t('toast_data_error', 'Error fetching data from server'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (view === 'home' && movies.length === 0 && series.length === 0) {
      const load = async () => {
        setLoading(true);
        try {
          const [moviesRes, seriesRes] = await Promise.all([
            fetch('/api/movies?page=1').then((res) => res.json()).catch(() => ({ success: false, data: [] })),
            fetch('/api/series?page=1').then((res) => res.json()).catch(() => ({ success: false, data: [] })),
          ]);
          if (!isCancelled) {
            if (moviesRes.success && Array.isArray(moviesRes.data) && moviesRes.data.length > 0) {
              setMovies(moviesRes.data);
            }
            if (seriesRes.success && Array.isArray(seriesRes.data) && seriesRes.data.length > 0) {
              setSeries(seriesRes.data);
            }
            if (!moviesRes.success && !seriesRes.success) {
              setError(moviesRes.error || seriesRes.error || t('toast_data_error', 'Failed to fetch data'));
            }
          }
        } catch (e) {
          if (!isCancelled) {
            setError(t('toast_data_error', 'Error loading media catalog'));
          }
        } finally {
          if (!isCancelled) {
            setLoading(false);
          }
        }
      };
      load();
    }
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    const onTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: 'all' | 'movies' | 'series' | 'history' }>;
      const tab = customEvent.detail?.tab;
      if (tab === 'movies' || tab === 'series' || tab === 'all' || tab === 'history') {
        setView('home');
        setHomeTab(tab);
        setError('');
      }
    };

    const onNavSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      const q = customEvent.detail?.query;
      if (q) {
        setQuery(q);
        setView('search');
        setLoading(true);
        fetch(`/api/search?q=${encodeURIComponent(q)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setResults(data.data || []);
            } else {
              setError(data.error || t('no_results', 'No results found'));
            }
          })
          .catch(() => {
            setError(t('toast_data_error', 'Search failed'));
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };

    window.addEventListener('nav-tab-change', onTabChange);
    window.addEventListener('nav-search', onNavSearch);

    return () => {
      window.removeEventListener('nav-tab-change', onTabChange);
      window.removeEventListener('nav-search', onNavSearch);
    };
  }, [t]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setView('search');
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data || []);
      } else {
        setError(data.error || t('no_results', 'No results found'));
      }
    } catch (e) {
      setError(t('toast_data_error', 'Search request failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleMediaClick = async (item: MediaItem) => {
    setActiveClickedId(item.url);
    setCurrentMedia(item);
    setError('');
    setVideoError(false);
    smoothScrollToViewer();

    if (item.url.includes('/search?q=')) {
      const q = decodeURIComponent(item.url.split('/search?q=')[1] || item.title);
      setQuery(q);
      setView('search');
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setResults(data.data);
          } else {
            setError(data.error || t('no_results', 'No results found'));
          }
        })
        .catch(() => {
          setError(t('toast_data_error', 'Search failed'));
        })
        .finally(() => {
          setLoading(false);
          setActiveClickedId(null);
        });
      return;
    }

    if (item.url.includes('/series/') || item.url.includes('series')) {
      setView('series');
      setMediaLoading(true);
      try {
        const res = await fetch(`/api/series-episodes?url=${encodeURIComponent(item.url)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setEpisodes(data.data);
        } else {
          setError(data.error || t('overview_unavailable', 'Episodes unavailable'));
        }
      } catch (e) {
        setError(t('toast_data_error', 'Failed to retrieve series episodes'));
      } finally {
        setMediaLoading(false);
        setActiveClickedId(null);
      }
    } else {
      // Movie
      setView('watch');
      addToWatchHistory({
        title: item.title,
        url: item.url,
        image: item.image,
      });
      fetchVideoLinks(item.url);
    }
  };

  const fetchVideoLinks = async (url: string) => {
    setView('watch');
    setMediaLoading(true);
    setError('');
    setVideoLinks([]);
    setSelectedQualityIdx(0);
    setVideoError(false);
    smoothScrollToViewer();

    try {
      const res = await fetch(`/api/get-link?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setVideoLinks(data.data);
        if (currentMedia) {
          addToWatchHistory({
            title: currentMedia.title,
            url: currentMedia.url,
            image: currentMedia.image,
          });
        }
      } else {
        setError(data.error || t('player_error_proxy', 'Unable to extract stream link'));
      }
    } catch (e) {
      setError(t('toast_data_error', 'Error extracting stream links'));
    } finally {
      setMediaLoading(false);
      setActiveClickedId(null);
    }
  };

  const switchQuality = (idx: number) => {
    if (!videoLinks[idx]) return;
    const currentTime = videoRef.current ? videoRef.current.currentTime : 0;
    const isPaused = videoRef.current ? videoRef.current.paused : false;
    
    setSelectedQualityIdx(idx);
    setVideoError(false);

    if (videoRef.current) {
      const targetUrl = streamMode === 'direct' 
        ? videoLinks[idx].url 
        : `/api/stream?url=${encodeURIComponent(videoLinks[idx].url)}`;
      videoRef.current.src = targetUrl;
      videoRef.current.currentTime = currentTime;
      if (!isPaused) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleShare = (title: string, url: string) => {
    const fullShareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/watch?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
      : url;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullShareUrl);
      showToast(t('toast_link_copied', 'Link copied!'));
    }
  };

  // Luxury Media Card Component
  const MediaCard = ({ item }: { item: MediaItem }) => {
    const isClicked = activeClickedId === item.url;
    return (
      <div 
        id={`media-card-${encodeURIComponent(item.url)}`}
        className={`group glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col relative select-none border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/10 ${
          isClicked 
            ? 'border-blue-400 ring-2 ring-blue-500/60 shadow-2xl shadow-blue-500/30 scale-[0.97] bg-blue-950/30' 
            : 'border-white/[0.07] hover:border-blue-400/50'
        }`}
        onClick={() => handleMediaClick(item)}
      >
      <div className="relative aspect-[2/3] w-full bg-slate-900/90 overflow-hidden">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-slate-800/80 flex items-center justify-center">
            <Film className="w-10 h-10 text-slate-600" />
          </div>
        )}
        
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-300" />

        {/* Quality Badge */}
        {item.quality && (
          <div className={`absolute top-2.5 ${isRtl ? 'right-2.5' : 'left-2.5'} bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-md border border-blue-400/30 uppercase tracking-wider`}>
            {item.quality}
          </div>
        )}

        {/* Star Rating */}
        {item.rating && (
          <div className={`absolute bottom-2.5 ${isRtl ? 'left-2.5' : 'right-2.5'} bg-black/70 backdrop-blur-md text-amber-400 text-xs px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 shadow-md border border-white/10`}>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] tabular-nums font-mono text-white">{item.rating}</span>
          </div>
        )}
        
        {/* Play Action Hover Reveal */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-slate-950/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/40 transform scale-75 group-hover:scale-100 transition-all duration-300 border border-white/20">
            <Play className={`w-5 h-5 fill-white text-white ${isRtl ? 'mr-0.5' : 'ml-0.5'}`} />
          </div>
        </div>
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <h3 
          className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-blue-300 line-clamp-2 transition-colors duration-200 leading-snug" 
          title={item.title}
        >
          {item.title}
        </h3>
        <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-blue-400/90 font-medium group-hover:underline flex items-center gap-1">
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{t('card_watch_now', 'Watch Now')}</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">1080p</span>
        </div>
      </div>
    </div>
    );
  };

  const activeVideoUrl = videoLinks[selectedQualityIdx]?.url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 min-h-screen" dir={dir}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass-dropdown px-4 py-3 rounded-2xl text-white text-xs font-semibold shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Home View */}
        {view === 'home' && (
          <motion.div
            key="home-view"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Hero Showcase */}
            <section className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-10 md:p-12 mb-10 md:mb-14 border border-white/10 shadow-2xl">
              {/* Subtle Accent Glows */}
              <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>{t('hero_badge', 'Luxury Cinema Streaming — Free & Unlimited')}</span>
                </div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4 text-balance">
                  {t('hero_title_1', 'Experience World Cinema')}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                    {t('hero_title_2', 'In Ultra HD Without Limits')}
                  </span>
                </h1>

                {/* Subheading */}
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8 max-w-2xl font-normal">
                  {t('hero_desc', 'Explore thousands of global movies and exclusive TV shows with high-speed direct servers, adaptive multi-resolution playback, and synced subtitles.')}
                </p>

                {/* Hero Quick Search Bar */}
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-xl mb-8">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder={t('search_placeholder', 'Search movies or series...')}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full glass-input rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-400/80 shadow-inner"
                    />
                    <Search className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2 shrink-0 border border-blue-400/30"
                  >
                    <Search className="w-4 h-4" />
                    <span>{t('search_btn', 'Search')}</span>
                  </button>
                </form>

                {/* Clean Value Propositions */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Film className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('hero_stat_movies', '10,000+ Titles')}</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('hero_stat_quality', 'Up to 4K / 1080p')}</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('hero_stat_speed', 'Zero-Latency Direct Stream')}</span>
                  </span>
                </div>
              </div>
            </section>

            {/* Tabs Navigation in Home */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-1.5 p-1 glass-panel rounded-2xl border border-white/10 shadow-sm">
                <button
                  id="tab-all"
                  onClick={() => setHomeTab('all')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    homeTab === 'all' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('tab_all', 'All')}
                </button>
                <button
                  id="tab-movies"
                  onClick={() => setHomeTab('movies')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    homeTab === 'movies' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Film className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('tab_movies', 'Movies')}</span>
                </button>
                <button
                  id="tab-series"
                  onClick={() => setHomeTab('series')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    homeTab === 'series' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t('tab_series', 'TV Series')}</span>
                </button>
                {effectiveHistory.length > 0 && (
                  <button
                    id="tab-history"
                    onClick={() => setHomeTab('history')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                      homeTab === 'history' 
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('tab_history', 'Watch History')}</span>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold text-cyan-200 tabular-nums">
                      {effectiveHistory.length}
                    </span>
                  </button>
                )}
              </div>

              {/* Quick Embed Generator Launch Button */}
              <button
                id="open-embed-generator-btn"
                onClick={() => {
                  setEmbedVideoUrl(movies[0]?.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                  setEmbedTitle('FamFlix Embed Player');
                  setIsEmbedOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 glass-card hover:border-blue-400/40 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-all shadow-md active:scale-95"
              >
                <Code2 className="w-4 h-4 text-blue-400" />
                <span>{t('nav_embed', 'Embed Code')}</span>
              </button>
            </div>

            {/* Error State */}
            {error && (
              <div className="glass-panel border-red-500/30 text-red-300 p-6 rounded-2xl text-center font-medium my-6 flex flex-col items-center gap-3 max-w-lg mx-auto shadow-2xl">
                <AlertCircle className="w-9 h-9 text-red-400" />
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchHomeData}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded-xl text-xs font-bold transition-colors mt-2 border border-red-500/30"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('player_retry', 'Retry')}</span>
                </button>
              </div>
            )}

            {/* Main Catalog Content */}
            <div className="space-y-14">
          
          {/* Watch History Section */}
          {(homeTab === 'all' || homeTab === 'history') && effectiveHistory.length > 0 && (
            <section id="watch-history-section" className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-2xl">
              <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                      <span>{t('history_title', 'Your Watch History')}</span>
                      <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full font-bold border border-cyan-500/30 tabular-nums font-mono">
                        {effectiveHistory.length}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('history_empty_desc', 'Movies and episodes you stream will automatically appear here.')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={clearWatchHistory}
                  className="flex items-center gap-1.5 px-3.5 py-2 glass-card hover:bg-red-600/20 hover:text-red-400 text-slate-400 rounded-xl text-xs font-semibold transition-all border border-white/5 cursor-pointer active:scale-95"
                  title={t('history_clear', 'Clear History')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('history_clear', 'Clear History')}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {effectiveHistory.map((item, i) => (
                  <div
                    key={`history-${item.url}-${i}`}
                    className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 shadow-md hover:shadow-xl group relative flex flex-col cursor-pointer border border-white/[0.06] hover:border-cyan-400/40"
                    onClick={() => {
                      handleMediaClick({
                        title: item.title,
                        url: item.url,
                        image: item.image || '',
                      });
                    }}
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                          <Film className="w-8 h-8" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Play className={`w-4 h-4 fill-white ${isRtl ? 'mr-0.5' : 'ml-0.5'}`} />
                        </div>
                      </div>

                      {/* Delete item button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchHistory(item.url);
                          showToast(t('history_removed', 'Removed from history'));
                        }}
                        className={`absolute top-2 ${isRtl ? 'left-2' : 'right-2'} p-1.5 bg-black/70 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 shadow-md`}
                        title={t('remove_from_history', 'Remove')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h3 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-2 transition-colors mb-2" title={item.title}>
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-auto pt-2 border-t border-white/[0.06]">
                        <span className="flex items-center gap-1 text-cyan-400 font-medium">
                          <Play className="w-3 h-3 fill-current" />
                          <span>{t('history_continue', 'Continue')}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatRelativeTime(item.watchedAt, lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty History State */}
          {homeTab === 'history' && mounted && effectiveHistory.length === 0 && (
            <div className="text-center py-20 glass-panel border border-white/10 rounded-3xl p-8">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-200 mb-1">{t('history_empty_title', 'Your Watch History is Empty')}</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
                {t('history_empty_desc', 'Movies and episodes you stream will automatically appear here.')}
              </p>
              <button
                onClick={() => setHomeTab('all')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 active:scale-95"
              >
                {t('btn_browse', 'Browse Catalog')}
              </button>
            </div>
          )}

          {/* Latest Movies Section */}
          {(homeTab === 'all' || homeTab === 'movies') && (
            <section id="movies-section">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {t('section_movies_title', 'Latest Added Movies')}
                    </h2>
                    <p className="text-xs text-slate-400 hidden sm:block">
                      {t('section_movies_desc', 'Freshly released blockbusters ready for instant stream')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchHomeData}
                  className="flex items-center gap-1.5 px-3 py-1.5 glass-card hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  title={t('btn_refresh_catalog', 'Refresh')}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">{t('btn_refresh_catalog', 'Refresh')}</span>
                </button>
              </div>
              {movies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {movies.map((m, i) => <MediaCard key={`movie-${i}`} item={m} />)}
                </div>
              ) : loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={`movie-skel-${idx}`} className="glass-card rounded-2xl overflow-hidden aspect-[2/3] animate-pulse bg-white/[0.03] border border-white/5 p-3 flex flex-col justify-end">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-panel rounded-2xl flex flex-col items-center gap-3">
                  <Film className="w-10 h-10 text-slate-500" />
                  <p className="text-slate-300 text-sm font-medium">{t('no_movies', 'No movies available.')}</p>
                  <button
                    onClick={fetchHomeData}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 mt-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('btn_refresh_catalog', 'Refresh Catalog')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Latest Series Section */}
          {(homeTab === 'all' || homeTab === 'series') && (
            <section id="series-section">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {t('section_series_title', 'Latest TV Shows')}
                    </h2>
                    <p className="text-xs text-slate-400 hidden sm:block">
                      {t('section_series_desc', 'Full seasons and episodes in pristine high definition')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchHomeData}
                  className="flex items-center gap-1.5 px-3 py-1.5 glass-card hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                  title={t('btn_refresh_catalog', 'Refresh')}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">{t('btn_refresh_catalog', 'Refresh')}</span>
                </button>
              </div>
              {series.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {series.map((s, i) => <MediaCard key={`series-${i}`} item={s} />)}
                </div>
              ) : loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={`series-skel-${idx}`} className="glass-card rounded-2xl overflow-hidden aspect-[2/3] animate-pulse bg-white/[0.03] border border-white/5 p-3 flex flex-col justify-end">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 glass-panel rounded-2xl flex flex-col items-center gap-3">
                  <Tv className="w-10 h-10 text-slate-500" />
                  <p className="text-slate-300 text-sm font-medium">{t('no_series', 'No series available.')}</p>
                  <button
                    onClick={fetchHomeData}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 mt-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('btn_refresh_catalog', 'Refresh Catalog')}</span>
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </motion.div>
    )}

        {/* Search Results View */}
        {view === 'search' && (
          <motion.div
            key="search-view"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {t('section_search_results', 'Search results for:')} <span className="text-blue-400">&ldquo;{query}&rdquo;</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {results.length} {t('section_results_count', 'titles found')}
                </p>
              </div>
              <button 
                onClick={() => { 
                  smoothScrollToViewer();
                  setView('home'); 
                  setQuery(''); 
                }} 
                className="text-xs sm:text-sm text-slate-300 hover:text-white flex items-center gap-2 glass-card px-4 py-2 rounded-xl transition-all border border-white/10 active:scale-95"
              >
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{t('nav_home', 'Home')}</span>
              </button>
            </div>
            {results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
                {results.map((r, i) => <MediaCard key={`search-${i}`} item={r} />)}
              </div>
            ) : (
              <div className="text-center py-20 glass-panel border border-white/10 rounded-3xl p-8">
                <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-medium text-base mb-1">{t('no_results', 'No results match your search.')}</p>
                <p className="text-slate-500 text-xs">{t('search_hint', 'Try searching for other titles or keywords.')}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Series Episodes List View */}
        {view === 'series' && currentMedia && (
          <motion.div
            key={`series-${currentMedia.url}`}
            ref={viewerRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="scroll-mt-24"
          >
            <button 
              id="back-to-home-btn"
              onClick={() => {
                smoothScrollToViewer();
                setView('home');
              }} 
              className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 glass-card px-4 py-2.5 rounded-xl transition-all border border-white/10 active:scale-95 text-xs sm:text-sm font-semibold"
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{t('btn_back_catalog', 'Back to Catalog')}</span>
            </button>
            
            <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 mb-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start shadow-2xl">
              {currentMedia.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={currentMedia.image} 
                  alt={currentMedia.title} 
                  className="w-44 md:w-56 rounded-2xl shadow-2xl border border-white/10 object-cover aspect-[2/3]" 
                  referrerPolicy="no-referrer" 
                />
              )}
              <div className="flex-1 text-center md:text-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-xs font-bold mb-3 border border-purple-500/30">
                  <Tv className="w-3.5 h-3.5" />
                  <span>{t('badge_tv', 'TV Series')}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
                  {currentMedia.title}
                </h1>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                  {t('section_series_desc', 'Full seasons and episodes in pristine high definition with flexible bitrates')}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <button
                    onClick={() => handleShare(currentMedia.title, currentMedia.url)}
                    className="flex items-center gap-2 px-4 py-2 glass-card hover:border-purple-400/40 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10 active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t('btn_share', 'Share')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <span>{t('player_episodes_list', 'Episodes List:')}</span>
                <span className="text-xs bg-white/10 text-slate-300 px-3 py-0.5 rounded-full border border-white/10 font-mono tabular-nums">
                  {mediaLoading ? '...' : episodes.length}
                </span>
              </h2>
            </div>

            {mediaLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div 
                    key={`ep-skeleton-${idx}`}
                    className="glass-card p-4 rounded-2xl flex justify-between items-center animate-pulse border border-white/5 bg-white/[0.02]"
                  >
                    <div className="h-4 bg-white/10 rounded-md w-32" />
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20" />
                  </div>
                ))}
              </div>
            ) : episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {episodes.map((ep, i) => (
                  <div 
                    key={`ep-${i}`} 
                    id={`episode-item-${i}`}
                    className={`glass-card hover:border-blue-400/50 p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all duration-200 group active:scale-[0.98] ${
                      activeClickedId === ep.url 
                        ? 'border-blue-400 ring-2 ring-blue-500/60 shadow-xl shadow-blue-500/20 bg-blue-950/40 scale-[0.99]' 
                        : 'border-white/5'
                    }`}
                    onClick={() => {
                      setActiveClickedId(ep.url);
                      const fullTitle = `${currentMedia.title} - ${ep.title}`;
                      setCurrentMedia({
                        ...currentMedia,
                        title: fullTitle,
                        url: ep.url,
                      });
                      addToWatchHistory({
                        title: fullTitle,
                        url: ep.url,
                        image: currentMedia.image,
                      });
                      fetchVideoLinks(ep.url);
                    }}
                  >
                    <span className="font-semibold text-xs sm:text-sm text-slate-200 group-hover:text-blue-300 truncate">
                      {ep.title}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shrink-0 border border-blue-400/20">
                      <Play className={`w-3.5 h-3.5 fill-current ${isRtl ? 'mr-0.5' : 'ml-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-panel rounded-2xl border border-white/10">
                <p className="text-slate-400 text-sm">{t('overview_unavailable', 'No episodes currently available.')}</p>
              </div>
            )}
          </motion.div>
        )}

      {/* Watch & Stream Player View */}
      {view === 'watch' && currentMedia && (
        <motion.div
          key={`watch-${currentMedia.url}`}
          ref={viewerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto scroll-mt-24"
        >
          <div className="flex items-center justify-between mb-6">
            <button 
              id="watch-back-btn"
              onClick={() => {
                smoothScrollToViewer();
                if (currentMedia.url.includes('series') || episodes.length > 0) {
                  setView('series');
                } else {
                  setView('home');
                }
              }} 
              className="flex items-center gap-2 text-slate-300 hover:text-white glass-card px-4 py-2 rounded-xl transition-all border border-white/10 text-xs sm:text-sm font-semibold active:scale-95"
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{t('btn_back', 'Back')}</span>
            </button>

            <button
              onClick={() => handleShare(currentMedia.title, currentMedia.url)}
              className="flex items-center gap-1.5 px-3.5 py-2 glass-card hover:border-blue-400/40 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('btn_share', 'Share')}</span>
            </button>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black mb-6 text-center text-white tracking-tight text-balance">
            {currentMedia.title}
          </h1>
          
          <div className="space-y-6">
            {/* Cinema Player Container with Soft Ambient Backdrop and Zero Layout Shifts */}
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl bg-black">
              <div className="aspect-video w-full relative flex items-center justify-center overflow-hidden">
                {/* Ambient Blurred Background from Movie Poster */}
                {currentMedia.image && (
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-25 scale-110 pointer-events-none transition-all duration-700"
                    style={{ backgroundImage: `url(${currentMedia.image})` }}
                  />
                )}
                
                {mediaLoading ? (
                  <div className="relative z-10 flex flex-col items-center justify-center gap-4 text-center px-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-6 h-6 text-blue-400 fill-blue-400/40 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-white text-base sm:text-lg font-bold animate-pulse">
                        {t('player_loading_stream', 'جاري تجهيز البث السينمائي بأعلى جودة...')}
                      </p>
                      <p className="text-slate-400 text-xs sm:text-sm">
                        {t('player_connecting_server', 'الاتصال بالسيرفر المباشر وفحص الجودات المتاحة...')}
                      </p>
                    </div>
                  </div>
                ) : videoLinks.length > 0 ? (
                  <video 
                    key={`${streamMode}-${activeVideoUrl || videoLinks[0]?.url}`}
                    ref={videoRef}
                    controls 
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain relative z-10 animate-in fade-in duration-500"
                    src={streamMode === 'direct' ? (activeVideoUrl || videoLinks[0]?.url) : `/api/stream?url=${encodeURIComponent(activeVideoUrl || videoLinks[0]?.url)}`}
                    controlsList="nodownload"
                    onError={() => {
                      if (streamMode === 'direct') {
                        console.warn('Direct stream failed, falling back to proxy...');
                        setStreamMode('proxy');
                      } else {
                        setVideoError(true);
                      }
                    }}
                    onPlay={() => setVideoError(false)}
                  >
                    <source src={activeVideoUrl || videoLinks[0]?.url} type="video/mp4" />
                    <source src={activeVideoUrl || videoLinks[0]?.url} type="video/x-matroska" />
                    Your browser does not support HTML5 video streaming.
                  </video>
                ) : (
                  <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
                    <p className="text-base text-slate-300 font-semibold mb-1">
                      {t('player_error_proxy', 'Unable to extract stream link for this title.')}
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      {t('toast_data_error', 'Content may be temporarily updating on upstream server.')}
                    </p>
                    <button
                      onClick={() => fetchVideoLinks(currentMedia.url)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('player_retry', 'Retry')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Streaming Mode Switcher Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-white/10 shadow-lg">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs sm:text-sm font-semibold text-slate-300">{t('player_title', 'Playback Mode')}:</span>
                <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => {
                      setStreamMode('direct');
                      setVideoError(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      streamMode === 'direct'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={t('player_mode_direct_desc', 'High-speed stream straight from original servers')}
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{t('player_direct_mode', 'Direct Stream')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setStreamMode('proxy');
                      setVideoError(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      streamMode === 'proxy'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title={t('player_mode_proxy_desc', 'Proxy stream through secure gateway to bypass CORS')}
                  >
                    <Shield className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{t('player_proxy_mode', 'Secure Proxy')}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono truncate">
                {streamMode === 'direct' ? '⚡ Direct Source Mode (HTML5)' : '🛡️ Proxied Range Stream (/api/stream)'}
              </div>
            </div>

            {/* Error Recovery Card */}
            {videoError && (
              <div className="glass-panel border-amber-500/30 text-amber-300 p-5 rounded-2xl text-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="text-start">
                  <p className="font-semibold">
                    {streamMode === 'direct'
                      ? t('player_error_direct', 'Direct link might be CORS-restricted. Switch to proxy mode.')
                      : t('player_error_proxy', 'Stream error. Try another resolution or refresh.')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {streamMode === 'direct' ? (
                    <button 
                      onClick={() => {
                        setStreamMode('proxy');
                        setVideoError(false);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors shadow-md shadow-blue-500/20"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{t('player_switch_proxy', 'Switch to Proxy')}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setStreamMode('direct');
                        setVideoError(false);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors shadow-md shadow-emerald-500/20"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{t('player_switch_direct', 'Try Direct Stream')}</span>
                    </button>
                  )}
                  <button 
                    onClick={() => fetchVideoLinks(currentMedia.url)}
                    className="px-3.5 py-2 glass-card hover:bg-white/10 text-white font-semibold rounded-xl flex items-center gap-1 text-xs transition-colors border border-white/10"
                    title={t('player_retry', 'Retry')}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('player_retry', 'Retry')}</span>
                  </button>
                  {activeVideoUrl && (
                    <a 
                      href={activeVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl flex items-center gap-1 text-xs transition-colors shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Controls Bar: Quality Selector, Embed & Download */}
            {videoLinks.length > 0 && (
              <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl">
                <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
                  <span className="text-slate-400 text-xs sm:text-sm font-semibold">
                    {t('player_quality_select', 'Select Resolution:')}
                  </span>
                  {videoLinks.map((link, idx) => (
                    <button 
                      key={`quality-${idx}`}
                      id={`quality-btn-${idx}`}
                      onClick={() => switchQuality(idx)}
                      className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer ${
                        selectedQualityIdx === idx
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 border border-blue-400/40'
                          : 'glass-card text-slate-300 hover:text-white border border-white/5'
                      }`}
                    >
                      {link.quality}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
                  {/* Embed Video Button */}
                  <button 
                    id="embed-video-btn"
                    onClick={() => {
                      setEmbedVideoUrl(activeVideoUrl || videoLinks[0]?.url || currentMedia.url);
                      setEmbedTitle(currentMedia.title);
                      setIsEmbedOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 glass-card hover:border-blue-400/40 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
                    title={t('nav_embed', 'Embed Code')}
                  >
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span>{t('nav_embed', 'Embed Code')}</span>
                  </button>

                  {/* Download Button */}
                  <a 
                    id="download-btn"
                    href={`/api/download?url=${encodeURIComponent(activeVideoUrl || videoLinks[0].url)}&title=${encodeURIComponent(currentMedia.title)}`}
                    download
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl font-bold text-xs sm:text-sm text-white transition-all shadow-lg shadow-emerald-600/25 active:scale-95 border border-emerald-400/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {t('player_btn_download', 'Download').replace('{q}', videoLinks[selectedQualityIdx]?.quality || 'HD')}
                    </span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Embed Code Modal */}
      <EmbedModal
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
        defaultVideoUrl={embedVideoUrl}
        defaultTitle={embedTitle}
      />
    </div>
  );
}
