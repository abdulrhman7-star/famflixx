import { useState, useEffect } from 'react';

export interface HistoryItem {
  title: string;
  url: string;
  image?: string;
  watchedAt: number;
}

const STORAGE_KEY = 'famflix_watch_history_v1';
const LEGACY_STORAGE_KEY = 'moviey_watch_history_v1';
const MAX_HISTORY_ITEMS = 10;

const EMPTY_HISTORY: HistoryItem[] = [];
let lastRaw: string | null = null;
let lastParsed: HistoryItem[] = EMPTY_HISTORY;

export function getWatchHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return EMPTY_HISTORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return EMPTY_HISTORY;
    if (raw === lastRaw) return lastParsed;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      lastRaw = raw;
      lastParsed = parsed.slice(0, MAX_HISTORY_ITEMS);
      return lastParsed;
    }
    return EMPTY_HISTORY;
  } catch (error) {
    console.warn('Failed to read watch history from localStorage:', error);
    return EMPTY_HISTORY;
  }
}

/**
 * Hydration-safe React hook for watch history
 */
export function useWatchHistory(): HistoryItem[] {
  const [history, setHistory] = useState<HistoryItem[]>(EMPTY_HISTORY);

  useEffect(() => {
    // Read from localStorage asynchronously after client hydration completes
    const timer = setTimeout(() => {
      setHistory(getWatchHistory());
    }, 0);

    const handleUpdate = () => {
      setHistory(getWatchHistory());
    };

    window.addEventListener('watch-history-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('watch-history-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return history;
}

export function addToWatchHistory(item: { title: string; url: string; image?: string }) {
  if (typeof window === 'undefined' || !item.url) return;
  try {
    const existing = getWatchHistory();
    // Deduplicate: remove any previous entry with the same url
    const filtered = existing.filter((h) => h.url !== item.url);

    const newItem: HistoryItem = {
      title: item.title,
      url: item.url,
      image: item.image || '',
      watchedAt: Date.now(),
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Update in-memory cache
    lastRaw = JSON.stringify(updated);
    lastParsed = updated;

    // Dispatch an event so components re-render immediately
    window.dispatchEvent(new CustomEvent('watch-history-updated', { detail: updated }));
  } catch (error) {
    console.warn('Failed to save to watch history:', error);
  }
}

export function removeFromWatchHistory(url: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getWatchHistory();
    const updated = existing.filter((h) => h.url !== url);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    lastRaw = JSON.stringify(updated);
    lastParsed = updated;

    window.dispatchEvent(new CustomEvent('watch-history-updated', { detail: updated }));
  } catch (error) {
    console.warn('Failed to remove from watch history:', error);
  }
}

export function clearWatchHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);

    lastRaw = null;
    lastParsed = EMPTY_HISTORY;

    window.dispatchEvent(new CustomEvent('watch-history-updated', { detail: [] }));
  } catch (error) {
    console.warn('Failed to clear watch history:', error);
  }
}
