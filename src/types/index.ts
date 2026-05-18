export interface Song {
  id: string;
  title: string;
  artistId: string;
  duration: number;
  src: string;
  cover: string;
  artist?: {
    id: string;
    name: string;
    image?: string | null;
  };
}

export type YouTubeVideo = {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  views: number;
  source: 'youtube';
};
