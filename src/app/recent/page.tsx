"use client";

import { useState, useEffect } from "react";
import { usePlayer } from "@/context/player-context";
import { getGuestRecent } from "@/lib/guest";
import { convertYouTubeToSong } from "@/lib/youtube-player";
import { Play, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import type { YouTubeSearchResult } from "@/lib/youtube";

export default function RecentPage() {
  const [songs, setSongs] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { playQueue } = usePlayer();

  useEffect(() => {
    async function load() {
      const videoIds = getGuestRecent();
      if (videoIds.length > 0) {
        const results: YouTubeSearchResult[] = [];
        for (const id of videoIds) {
          try {
            const res = await fetch(`/api/youtube/video?id=${id}`);
            if (res.ok) {
              const d = await res.json();
              if (d.video) results.push(d.video);
            }
          } catch {}
        }
        setSongs(results);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass rounded-3xl p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="w-40 h-40 lg:w-52 lg:h-52 rounded-2xl bg-gradient-to-br from-accent to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-2xl">
            <Clock className="w-16 h-16 text-white" />
          </div>
          <div className="text-center lg:text-left">
            <p className="text-xs uppercase tracking-[0.15em] text-muted font-semibold mb-2">History</p>
            <h1 className="text-3xl lg:text-5xl font-extrabold mb-2">Recently Played</h1>
            <p className="text-muted mb-6">{songs.length} song{songs.length !== 1 ? "s" : ""}</p>
            {songs.length > 0 && (
              <button onClick={() => playQueue(songs.map(r => convertYouTubeToSong(r)) as any, 0)} className="btn-primary flex items-center gap-2.5">
                <Play className="w-4 h-4 fill-white" /> Play All
              </button>
            )}
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white/30 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-10 h-10 text-muted/50" />
          </div>
          <h3 className="text-xl font-bold mb-1">No recently played songs</h3>
          <p className="text-sm text-muted mb-6">Start listening to see your history</p>
          <Link href="/search" className="btn-primary inline-flex items-center gap-2">
            Discover Music
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {songs.map((result, i) => (
            <div
              key={result.id}
              className="glass-card p-3.5 cursor-pointer group hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => {
                const allSongs = songs.slice(i).map(r => convertYouTubeToSong(r));
                playQueue(allSongs as any, 0);
              }}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3 shadow-md bg-black/20">
                <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">{result.duration}</div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/50 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              </div>
              <p className="font-semibold text-sm truncate leading-tight">{result.title}</p>
              <p className="text-xs text-muted truncate">{result.channelTitle}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
