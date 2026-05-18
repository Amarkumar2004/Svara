const GUEST_LIKES_KEY = 'guest_likes';
const GUEST_RECENT_KEY = 'guest_recent';
const GUEST_PLAYLISTS_KEY = 'guest_playlists';

export interface GuestPlaylist {
  id: string;
  name: string;
  youtubeVideoIds: string[];
  createdAt: string;
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function getGuestLikes(): string[] {
  return getItem<string[]>(GUEST_LIKES_KEY, []);
}

export function setGuestLikes(ids: string[]) {
  setItem(GUEST_LIKES_KEY, ids);
}

export function toggleGuestLike(videoId: string): boolean {
  const likes = getGuestLikes();
  const idx = likes.indexOf(videoId);
  if (idx >= 0) {
    likes.splice(idx, 1);
    setGuestLikes(likes);
    return false;
  } else {
    likes.push(videoId);
    setGuestLikes(likes);
    return true;
  }
}

export function isGuestLiked(videoId: string): boolean {
  return getGuestLikes().includes(videoId);
}

export function getGuestRecent(): string[] {
  return getItem<string[]>(GUEST_RECENT_KEY, []);
}

export function addGuestRecent(videoId: string) {
  const recent = getGuestRecent();
  const filtered = recent.filter(id => id !== videoId);
  filtered.unshift(videoId);
  if (filtered.length > 50) filtered.length = 50;
  setItem(GUEST_RECENT_KEY, filtered);
}

export function getGuestPlaylists(): GuestPlaylist[] {
  return getItem<GuestPlaylist[]>(GUEST_PLAYLISTS_KEY, []);
}

export function setGuestPlaylists(playlists: GuestPlaylist[]) {
  setItem(GUEST_PLAYLISTS_KEY, playlists);
}

export function createGuestPlaylist(name: string): GuestPlaylist {
  const playlists = getGuestPlaylists();
  const newPlaylist: GuestPlaylist = {
    id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    youtubeVideoIds: [],
    createdAt: new Date().toISOString(),
  };
  playlists.push(newPlaylist);
  setGuestPlaylists(playlists);
  return newPlaylist;
}

export function addToGuestPlaylist(playlistId: string, videoId: string) {
  const playlists = getGuestPlaylists();
  const pl = playlists.find(p => p.id === playlistId);
  if (pl && !pl.youtubeVideoIds.includes(videoId)) {
    pl.youtubeVideoIds.push(videoId);
    setGuestPlaylists(playlists);
  }
}

export function removeFromGuestPlaylist(playlistId: string, videoId: string) {
  const playlists = getGuestPlaylists();
  const pl = playlists.find(p => p.id === playlistId);
  if (pl) {
    pl.youtubeVideoIds = pl.youtubeVideoIds.filter(id => id !== videoId);
    setGuestPlaylists(playlists);
  }
}

export function deleteGuestPlaylist(playlistId: string) {
  const playlists = getGuestPlaylists().filter(p => p.id !== playlistId);
  setGuestPlaylists(playlists);
}

export function clearGuestData() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_LIKES_KEY);
    localStorage.removeItem(GUEST_RECENT_KEY);
    localStorage.removeItem(GUEST_PLAYLISTS_KEY);
  } catch {}
}

export function hasGuestData(): boolean {
  return getGuestLikes().length > 0 || getGuestRecent().length > 0 || getGuestPlaylists().length > 0;
}
