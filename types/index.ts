export interface MediaItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  tags: string[];
  rating: number;
  isFavorite: boolean;
  notes: string;
  createdAt: number;
  lastViewedAt: number | null;
  viewCount: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface HistoryEntry {
  id: string;
  mediaId: string;
  mediaTitle: string;
  viewedAt: number;
}

export type ViewMode = 'grid' | 'compact' | 'list';
export type SortBy = 'dateAdded' | 'rating' | 'title' | 'lastViewed';
