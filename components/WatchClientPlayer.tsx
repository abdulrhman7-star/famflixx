"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Download, 
  ArrowRight, 
  ArrowLeft,
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Code2, 
  Share2, 
  Zap, 
  Shield, 
  Copy, 
  Check 
} from 'lucide-react';
import EmbedModal from './EmbedModal';
import { addToWatchHistory } from '@/lib/history';
import { useLanguage } from '@/lib/LanguageContext';

interface VideoLink {
  quality: string;
  url: string;
}

interface WatchClientPlayerProps {
  initialUrl: string;
  title: string;
  image?: string;
}

export default function WatchClientPlayer({ initialUrl, title, image }: WatchClientPlayerProps) {
  const { dir, t } = useLanguage();
  const isRtl = dir === 'rtl';

  const [videoLinks, setVideoLinks] = useState<VideoLink[]>([]);
  const [selectedQualityIdx, setSelectedQualityIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(Boolean(initialUrl));
  const [error, setError] = useState<string>(!initialUrl ? t('player_error_proxy', 'Invalid media URL') : '');
  const [videoError, setVideoError] = useState<boolean>(false);
  const [streamMode, setStreamMode] = useState<'direct' | 'proxy'>('direct');
  
  const [isEmbedOpen, setIsEmbedOpen] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchLinks = (forceLoading = true) => {
    if (!initialUrl) {
      setError(t('player_error_proxy', 'Invalid media URL'));
      setLoading(false);
      return;
    }

    if (forceLoading) {
      setLoading(true);
    }
    setError('');
    setVideoError(false);

    fetch(`/api/get-link?url=${encodeURIComponent(initialUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setVideoLinks(data.data);
          addToWatchHistory({
            title: title || 'فيديو مباشر',
            url: initialUrl,
            image: image,
          });
        } else {
          setError(data.error || t('player_error_proxy', 'Failed to extract video stream links'));
        }
      })
      .catch(() => {
        setError(t('toast_data_error', 'Connection error while communicating with server'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isCancelled = false;
    if (!initialUrl) return;

    fetch(`/api/get-link?url=${encodeURIComponent(initialUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setVideoLinks(data.data);
            addToWatchHistory({
              title: title || 'فيديو مباشر',
              url: initialUrl,
              image: image,
            });
          } else {
            setError(data.error || 'Failed to extract video stream links');
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError('Connection error while communicating with server');
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [initialUrl, title, image]);

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

  const handleCopyShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const activeVideoUrl = videoLinks[selectedQualityIdx]?.url;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-screen" dir={dir}>
      {/* Top Action Breadcrumb */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-300 hover:text-white glass-card px-4 py-2 rounded-xl transition-all border border-white/10 text-xs sm:text-sm font-semibold active:scale-95"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{t('btn_back_catalog', 'Back to Catalog')}</span>
        </Link>

        <button
          onClick={handleCopyShare}
          className="flex items-center gap-2 px-4 py-2 glass-card hover:border-blue-400/40 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10 active:scale-95"
        >
          {copiedShare ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">{t('toast_link_copied', 'Link copied!')}</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>{t('btn_share', 'Share')}</span>
            </>
          )}
        </button>
      </div>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-8 text-center text-white tracking-tight text-balance">
        {title || t('card_watch_now', 'Watch Video')}
      </h1>

      {loading ? (
        <div className="aspect-video glass-panel rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-4 text-slate-400 shadow-2xl">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/30"></div>
          <span className="text-sm font-medium animate-pulse">{t('player_loading', 'Preparing high-speed stream...')}</span>
        </div>
      ) : error ? (
        <div className="glass-panel border-red-500/30 text-red-300 p-8 rounded-3xl text-center font-medium my-8 flex flex-col items-center gap-4 max-w-lg mx-auto shadow-2xl">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-base font-bold">{error}</p>
          <button
            onClick={() => fetchLinks()}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('player_retry', 'Retry')}</span>
          </button>
        </div>
      ) : videoLinks.length > 0 ? (
        <div className="space-y-6">
          {/* Main Video Element */}
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative border border-white/10">
            <video
              key={`${streamMode}-${activeVideoUrl}`}
              ref={videoRef}
              controls
              autoPlay
              playsInline
              poster={image || undefined}
              className="w-full h-full object-contain"
              src={streamMode === 'direct' ? activeVideoUrl : `/api/stream?url=${encodeURIComponent(activeVideoUrl)}`}
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
              <source src={activeVideoUrl} type="video/mp4" />
              Your browser does not support HTML5 video streaming.
            </video>
          </div>

          {/* Mode Switcher Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
              <span className="font-semibold text-slate-400">{t('player_title', 'Playback Mode')}:</span>
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
                  title={t('player_mode_direct_desc', 'Direct connection to source video server')}
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
                  title={t('player_mode_proxy_desc', 'Secure internal proxy')}
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{t('player_proxy_mode', 'Secure Proxy')}</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono dir-ltr truncate">
              {streamMode === 'direct' ? '⚡ Direct Source Mode (HTML5)' : '🛡️ Proxied Range Stream (/api/stream)'}
            </div>
          </div>

          {videoError && (
            <div className="glass-panel border-amber-500/30 text-amber-300 p-5 rounded-2xl text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="text-start">
                <p className="font-semibold">
                  {streamMode === 'direct'
                    ? t('player_error_direct', 'Direct stream could not load. Switch to proxy mode.')
                    : t('player_error_proxy', 'Stream error. Please refresh or try another quality.')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {streamMode === 'direct' ? (
                  <button
                    onClick={() => {
                      setStreamMode('proxy');
                      setVideoError(false);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors shadow-md shadow-blue-500/20 active:scale-95"
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
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{t('player_switch_direct', 'Try Direct Stream')}</span>
                  </button>
                )}
                <button
                  onClick={() => fetchLinks()}
                  className="px-3.5 py-2 glass-card hover:bg-white/10 text-white font-semibold rounded-xl flex items-center gap-1 text-xs transition-colors border border-white/10 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('player_retry', 'Retry')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Controls Bar: Quality Selector & Downloads */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-2xl">
            <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
              <span className="text-slate-400 text-xs sm:text-sm font-semibold">
                {t('player_quality_select', 'Select Resolution:')}
              </span>
              {videoLinks.map((link, idx) => (
                <button
                  key={`quality-${idx}`}
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
              <button
                onClick={() => setIsEmbedOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 glass-card hover:border-blue-400/40 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95"
              >
                <Code2 className="w-4 h-4 text-blue-400" />
                <span>{t('nav_embed', 'Embed Code')}</span>
              </button>

              {activeVideoUrl && (
                <a
                  href={activeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 glass-card hover:bg-white/10 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 transition-colors border border-white/10"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Direct Link</span>
                </a>
              )}

              <a
                href={`/api/download?url=${encodeURIComponent(activeVideoUrl || videoLinks[0].url)}&title=${encodeURIComponent(title)}`}
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
        </div>
      ) : null}

      <EmbedModal
        isOpen={isEmbedOpen}
        onClose={() => setIsEmbedOpen(false)}
        defaultVideoUrl={activeVideoUrl || initialUrl}
        defaultTitle={title}
      />
    </div>
  );
}
