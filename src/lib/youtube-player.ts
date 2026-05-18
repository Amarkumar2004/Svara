export function isYouTubeTrack(src: string): boolean {
  return src.startsWith('yt:');
}

export function getYouTubeVideoId(src: string): string | null {
  if (!isYouTubeTrack(src)) return null;
  return src.slice(3);
}

export function makeYouTubeSrc(videoId: string): string {
  return `yt:${videoId}`;
}

export function convertYouTubeToSong(video: {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  durationSeconds?: number;
}): import('@/types').Song & { __youtube: boolean } {
  return {
    id: `yt:${video.id}`,
    title: video.title,
    artistId: video.channelId,
    src: makeYouTubeSrc(video.id),
    cover: video.thumbnail,
    duration: video.durationSeconds || 0,
    plays: 0,
    __youtube: true,
    artist: {
      id: video.channelId,
      name: video.channelTitle,
      image: video.thumbnail,
    },
  } as any;
}
