export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function getThumbnailUrl(url: string): string | null {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return null;
}

export function getEmbedUrl(url: string): string {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  return url;
}

export function getSourceLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('vimeo')) return 'Vimeo';
    if (host.includes('twitch')) return 'Twitch';
    if (host.includes('dailymotion')) return 'Dailymotion';
    return host.split('.')[0].charAt(0).toUpperCase() + host.split('.')[0].slice(1);
  } catch {
    return 'Unknown';
  }
}

export async function fetchMetadata(url: string): Promise<{ title: string; thumbnail: string | null }> {
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || 'Untitled',
          thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
        };
      }
    } catch {}
    return {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    try {
      const res = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
      );
      if (res.ok) {
        const data = await res.json();
        return {
          title: data.title || 'Vimeo Video',
          thumbnail: data.thumbnail_url || null,
        };
      }
    } catch {}
    return { title: 'Vimeo Video', thumbnail: null };
  }

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || parsed.hostname;
    const title = decodeURIComponent(lastPart)
      .replace(/[-_.]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'Untitled';
    return { title, thumbnail: null };
  } catch {
    return { title: 'Untitled', thumbnail: null };
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export const TAG_COLORS = [
  '#0a84ff', '#30d158', '#ff9f0a', '#ff453a',
  '#5e5ce6', '#ff375f', '#64d2ff', '#ffd60a',
  '#bf5af2', '#ff6961', '#34c759', '#007aff',
];
