import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaItem, Tag, HistoryEntry } from '@/types';
import { generateId } from '@/lib/utils';

const MEDIA_KEY = '@vault/media';
const TAGS_KEY = '@vault/tags';
const HISTORY_KEY = '@vault/history';

interface MediaContextValue {
  items: MediaItem[];
  tags: Tag[];
  history: HistoryEntry[];
  isLoading: boolean;
  addItem: (data: Omit<MediaItem, 'id' | 'createdAt' | 'viewCount' | 'lastViewedAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  bulkImport: (items: MediaItem[]) => Promise<void>;
  addTag: (data: Omit<Tag, 'id'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  recordView: (mediaId: string, title: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  exportData: () => string;
  importData: (json: string) => Promise<{ count: number }>;
  nukeAll: () => Promise<void>;
}

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [rawItems, rawTags, rawHistory] = await Promise.all([
        AsyncStorage.getItem(MEDIA_KEY),
        AsyncStorage.getItem(TAGS_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
      ]);
      if (rawItems) setItems(JSON.parse(rawItems));
      if (rawTags) setTags(JSON.parse(rawTags));
      if (rawHistory) setHistory(JSON.parse(rawHistory));
    } catch {}
    setIsLoading(false);
  }

  async function saveItems(data: MediaItem[]) {
    await AsyncStorage.setItem(MEDIA_KEY, JSON.stringify(data));
    setItems(data);
  }

  async function saveTags(data: Tag[]) {
    await AsyncStorage.setItem(TAGS_KEY, JSON.stringify(data));
    setTags(data);
  }

  async function saveHistory(data: HistoryEntry[]) {
    const trimmed = data.slice(0, 200);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    setHistory(trimmed);
  }

  async function addItem(data: Omit<MediaItem, 'id' | 'createdAt' | 'viewCount' | 'lastViewedAt'>) {
    const newItem: MediaItem = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      viewCount: 0,
      lastViewedAt: null,
    };
    await saveItems([newItem, ...items]);
  }

  async function updateItem(id: string, updates: Partial<MediaItem>) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    await saveItems(updated);
  }

  async function deleteItem(id: string) {
    await saveItems(items.filter((item) => item.id !== id));
  }

  async function bulkImport(newItems: MediaItem[]) {
    const existingIds = new Set(items.map((i) => i.id));
    const toAdd = newItems.filter((i) => !existingIds.has(i.id));
    await saveItems([...toAdd, ...items]);
  }

  async function addTag(data: Omit<Tag, 'id'>) {
    const newTag: Tag = { ...data, id: generateId() };
    await saveTags([...tags, newTag]);
  }

  async function updateTag(id: string, updates: Partial<Tag>) {
    await saveTags(tags.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  async function deleteTag(id: string) {
    await saveTags(tags.filter((t) => t.id !== id));
    const updatedItems = items.map((item) => ({
      ...item,
      tags: item.tags.filter((tid) => tid !== id),
    }));
    await saveItems(updatedItems);
  }

  async function recordView(mediaId: string, title: string) {
    const entry: HistoryEntry = {
      id: generateId(),
      mediaId,
      mediaTitle: title,
      viewedAt: Date.now(),
    };
    const updated = [entry, ...history];
    await saveHistory(updated);
    await updateItem(mediaId, {
      lastViewedAt: Date.now(),
      viewCount: (items.find((i) => i.id === mediaId)?.viewCount ?? 0) + 1,
    });
  }

  async function clearHistory() {
    await saveHistory([]);
  }

  function exportData(): string {
    return JSON.stringify({ items, tags, history, exportedAt: Date.now() }, null, 2);
  }

  async function importData(json: string): Promise<{ count: number }> {
    const parsed = JSON.parse(json);
    const importedItems: MediaItem[] = parsed.items ?? [];
    const importedTags: Tag[] = parsed.tags ?? [];

    const existingTagIds = new Set(tags.map((t) => t.id));
    const newTags = importedTags.filter((t) => !existingTagIds.has(t.id));
    const mergedTags = [...tags, ...newTags];

    const existingIds = new Set(items.map((i) => i.id));
    const newItems = importedItems.filter((i) => !existingIds.has(i.id));
    const mergedItems = [...newItems, ...items];

    await saveTags(mergedTags);
    await saveItems(mergedItems);

    return { count: newItems.length };
  }

  async function nukeAll() {
    await Promise.all([
      AsyncStorage.removeItem(MEDIA_KEY),
      AsyncStorage.removeItem(TAGS_KEY),
      AsyncStorage.removeItem(HISTORY_KEY),
    ]);
    setItems([]);
    setTags([]);
    setHistory([]);
  }

  const value = useMemo<MediaContextValue>(() => ({
    items,
    tags,
    history,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    bulkImport,
    addTag,
    updateTag,
    deleteTag,
    recordView,
    clearHistory,
    exportData,
    importData,
    nukeAll,
  }), [items, tags, history, isLoading]);

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia(): MediaContextValue {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error('useMedia must be used within MediaProvider');
  return ctx;
}
