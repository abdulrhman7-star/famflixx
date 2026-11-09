"use client";

import { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  X, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultVideoUrl?: string;
  defaultTitle?: string;
}

export default function EmbedModal({
  isOpen,
  onClose,
  defaultVideoUrl = '',
  defaultTitle = 'Responsive Video Player'
}: EmbedModalProps) {
  const { dir, t } = useLanguage();
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoTitle, setCustomVideoTitle] = useState<string | null>(null);
  const [formatType, setFormatType] = useState<'modern' | 'classic' | 'tailwind' | 'directVideo'>('modern');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [autoplay, setAutoplay] = useState(false);
  const [muted, setMuted] = useState(false);
  const [roundedCorners, setRoundedCorners] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const videoUrl = customVideoUrl !== null ? customVideoUrl : defaultVideoUrl;
  const videoTitle = customVideoTitle !== null ? customVideoTitle : defaultTitle;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Build the embed iframe source URL
  const embedBase = origin ? `${origin}/embed` : '/embed';
  const targetEmbedSrc = `${embedBase}?src=${encodeURIComponent(videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')}${videoTitle ? `&title=${encodeURIComponent(videoTitle)}` : ''}${autoplay ? '&autoplay=1' : ''}${muted ? '&muted=1' : ''}`;

  // Generated code snippets
  const getEmbedCode = () => {
    const br = roundedCorners ? '16px' : '0px';

    if (formatType === 'modern') {
      return `<!-- FamFlix Responsive Embed (Modern CSS 16:9) -->
<div style="position: relative; width: 100%; max-width: 100%; aspect-ratio: 16 / 9; background: #000; border-radius: ${br}; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.4);">
  <iframe 
    src="${targetEmbedSrc}" 
    title="${videoTitle}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
    allowfullscreen>
  </iframe>
</div>`;
    }

    if (formatType === 'classic') {
      return `<!-- FamFlix Classic Responsive Embed (WordPress, Blogger, HTML) -->
<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: ${br}; background: #000;">
  <iframe 
    src="${targetEmbedSrc}" 
    title="${videoTitle}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
    allowfullscreen>
  </iframe>
</div>`;
    }

    if (formatType === 'tailwind') {
      return `<!-- FamFlix Responsive Embed with Tailwind CSS -->
<div class="relative w-full aspect-video ${roundedCorners ? 'rounded-2xl' : ''} overflow-hidden shadow-2xl bg-black border border-white/10">
  <iframe 
    src="${targetEmbedSrc}" 
    title="${videoTitle}"
    class="absolute inset-0 w-full h-full border-0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
    allowfullscreen>
  </iframe>
</div>`;
    }

    // Direct Video Tag (HTML5 responsive 16:9)
    return `<!-- HTML5 Direct Responsive Video -->
<div style="position: relative; width: 100%; max-width: 900px; margin: 0 auto; aspect-ratio: 16 / 9; background: #000; border-radius: ${br}; overflow: hidden; box-shadow: 0 12px 36px rgba(0,0,0,0.4);">
  <video 
    controls 
    playsinline 
    preload="metadata"
    ${autoplay ? 'autoplay ' : ''}${muted ? 'muted ' : ''}
    style="width: 100%; height: 100%; object-fit: contain; display: block;"
  >
    <source src="${videoUrl || 'https://example.com/video.mp4'}" type="video/mp4">
    <source src="${videoUrl || 'https://example.com/video.mkv'}" type="video/x-matroska">
    Your browser does not support HTML5 video.
  </video>
</div>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] glass-dropdown border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-start"
        dir={dir}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-slate-950/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{t('embed_modal_title', 'Generate Embed Code')}</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30">
                  100% Responsive
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('embed_modal_desc', 'Copy the responsive iframe snippet to embed this video player on your website or blog.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white glass-card border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 glass-panel p-4 rounded-2xl border border-white/5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Source Stream URL:
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setCustomVideoUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-400 outline-none dir-ltr font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Title:
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setCustomVideoTitle(e.target.value)}
                placeholder="Video Title"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white focus:border-blue-400 outline-none"
              />
            </div>
          </div>

          {/* Format selector & toggles */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-1.5 glass-panel p-1 rounded-2xl border border-white/5 flex-wrap">
              <button
                onClick={() => setFormatType('modern')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formatType === 'modern' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Modern CSS (16:9)
              </button>
              <button
                onClick={() => setFormatType('classic')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formatType === 'classic' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Classic (WordPress)
              </button>
              <button
                onClick={() => setFormatType('tailwind')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formatType === 'tailwind' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tailwind CSS
              </button>
              <button
                onClick={() => setFormatType('directVideo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formatType === 'directVideo' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                HTML5 &lt;video&gt;
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={autoplay}
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Autoplay</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={(e) => setMuted(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Muted</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={roundedCorners}
                  onChange={(e) => setRoundedCorners(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span>Rounded</span>
              </label>
            </div>
          </div>

          {/* Generated Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Embed Code Snippet:</span>
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('embed_copied', 'Copied!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('embed_copy_btn', 'Copy Code')}</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative group">
              <pre className="bg-slate-950 border border-white/10 p-4 rounded-2xl text-xs text-blue-300 font-mono overflow-x-auto dir-ltr max-h-44 leading-relaxed selection:bg-blue-900 selection:text-white">
                {getEmbedCode()}
              </pre>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span>Live Responsive Preview:</span>
              </span>

              {/* Device Selector */}
              <div className="flex items-center gap-1 glass-panel p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    previewDevice === 'desktop' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    previewDevice === 'tablet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tablet (540px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    previewDevice === 'mobile' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile (340px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>

            {/* Live responsive container box */}
            <div className="bg-slate-950/80 p-4 sm:p-6 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden min-h-[260px]">
              <div
                className="transition-all duration-300 mx-auto"
                style={{
                  width:
                    previewDevice === 'mobile'
                      ? '340px'
                      : previewDevice === 'tablet'
                      ? '540px'
                      : '100%',
                  maxWidth: '100%'
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    background: '#000',
                    borderRadius: roundedCorners ? '16px' : '0px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
                  }}
                >
                  <iframe
                    src={targetEmbedSrc}
                    title={videoTitle}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('embed_responsive_note', 'Fully responsive embed that adapts smoothly to all screens.')}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 glass-card hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-white/10"
            >
              {t('btn_close', 'Close')}
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-1.5 active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{t('embed_copy_btn', 'Copy Code')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
