const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const apiKey = () => process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';

interface YouTubeSearchResult {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  views: number;
}

interface YouTubeChannelResult {
  id: string;
  name: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  description: string;
}

const parseDuration = (iso: string): { label: string; seconds: number } => {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { label: '0:00', seconds: 0 };
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  const seconds = h * 3600 + m * 60 + s;
  const label = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  return { label, seconds };
};

const formatNumber = (n: number): string => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const fetchJSON = async (endpoint: string, params: Record<string, string>) => {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set('key', apiKey());
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 403) throw new Error('YouTube API quota exceeded');
    throw new Error(`YouTube API error: ${res.status}`);
  }
  return res.json();
};

export async function searchYouTube(query: string, maxResults = 20): Promise<YouTubeSearchResult[]> {
  const data = await fetchJSON('search', {
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '10',
    maxResults: maxResults.toString(),
  });

  if (!data.items?.length) return [];

  const videoIds = data.items.map((i: any) => i.id.videoId).join(',');
  const details = await fetchJSON('videos', {
    part: 'contentDetails,statistics',
    id: videoIds,
  });

  const detailsMap = new Map<string, any>();
  if (details.items) {
    details.items.forEach((item: any) => detailsMap.set(item.id, item));
  }

  return data.items.map((item: any): YouTubeSearchResult => {
    const detail = detailsMap.get(item.id.videoId);
    const dur = detail ? parseDuration(detail.contentDetails.duration) : { label: '0:00', seconds: 0 };
    const views = detail ? parseInt(detail.statistics?.viewCount || '0') : 0;
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      duration: dur.label,
      durationSeconds: dur.seconds,
      views,
    };
  });
}

export async function getTrending(maxResults = 20): Promise<YouTubeSearchResult[]> {
  const data = await fetchJSON('videos', {
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    videoCategoryId: '10',
    maxResults: maxResults.toString(),
    regionCode: 'US',
  });

  if (!data.items?.length) return [];

  return data.items.map((item: any): YouTubeSearchResult => {
    const dur = parseDuration(item.contentDetails.duration);
    return {
      id: item.id,
      title: item.snippet.title,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      duration: dur.label,
      durationSeconds: dur.seconds,
      views: parseInt(item.statistics?.viewCount || '0'),
    };
  });
}

export async function getChannelInfo(channelId: string): Promise<YouTubeChannelResult | null> {
  const data = await fetchJSON('channels', {
    part: 'snippet,statistics',
    id: channelId,
  });

  if (!data.items?.length) return null;

  const ch = data.items[0];
  return {
    id: ch.id,
    name: ch.snippet.title,
    thumbnail: ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url || '',
    subscriberCount: parseInt(ch.statistics?.subscriberCount || '0'),
    videoCount: parseInt(ch.statistics?.videoCount || '0'),
    description: ch.snippet.description,
  };
}

export async function getVideoDetails(videoId: string): Promise<YouTubeSearchResult | null> {
  const data = await fetchJSON('videos', {
    part: 'snippet,contentDetails,statistics',
    id: videoId,
  });

  if (!data.items?.length) return null;

  const item = data.items[0];
  const dur = parseDuration(item.contentDetails.duration);
  return {
    id: item.id,
    title: item.snippet.title,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    duration: dur.label,
    durationSeconds: dur.seconds,
    views: parseInt(item.statistics?.viewCount || '0'),
  };
}

export type { YouTubeSearchResult, YouTubeChannelResult };
export { formatNumber };
