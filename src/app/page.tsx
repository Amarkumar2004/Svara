"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePlayer } from "@/context/player-context";
import { Play, Shuffle, ChevronRight, Music, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { convertYouTubeToSong } from "@/lib/youtube-player";
import type { YouTubeSearchResult } from "@/lib/youtube";

export default function HomePage() {
  const [trending, setTrending] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const { play, playQueue } = usePlayer();

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const trendingRes = await fetch("/api/youtube/trending");
        if (cancelled) return;
        if (trendingRes.status === 429) {
          setQuotaExceeded(true);
        } else if (trendingRes.ok) {
          const d = await trendingRes.json();
          if (!cancelled) setTrending(d.results || []);
        }
      } catch (err) {
        console.error("Failed to load trending", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handlePlay = (result: YouTubeSearchResult) => {
    const song = convertYouTubeToSong(result);
    play(song as any);
  };

  const handlePlayAllTrending = () => {
    if (trending.length > 0) {
      const songs = trending.map(r => convertYouTubeToSong(r));
      playQueue(songs as any, 0);
      toast.success("Playing trending music");
    }
  };

  const handleShuffleTrending = () => {
    if (trending.length > 0) {
      const songs = trending
        .map(r => convertYouTubeToSong(r))
        .sort(() => Math.random() - 0.5);
      playQueue(songs as any, 0);
      toast.success("Shuffle play trending");
    }
  };

  const formatViews = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <section className="glass rounded-3xl p-6 lg:p-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="relative w-44 h-44 lg:w-60 lg:h-60 flex-shrink-0">
          <img
            src={trending[0]?.thumbnail || "https://images.pexels.com/photos/3721941/pexels-photo-3721941.jpeg?auto=compress&cs=tinysrgb&w=400"}
            alt="Hero"
            className="w-full h-full rounded-2xl object-cover shadow-2xl"
          />
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20 dark:ring-white/5" />
          <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-accent shadow-lg shadow-accent/50 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="text-center lg:text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">
            Trending Now on YouTube
          </p>
          <h1 className="text-3xl lg:text-5xl font-extrabold mb-2 leading-tight text-balance">
            {trending[0]?.title || "Svara Music"}
          </h1>
          <p className="text-secondary dark:text-white/60 mb-8 text-balance">
            {trending[0]?.channelTitle || "Premium Music Streaming"} &middot;{" "}
            {trending.length > 0 ? `${formatViews(trending[0].views)} views` : "Discover new music"}
          </p>
          <div className="flex items-center gap-4 justify-center lg:justify-start">
            <button onClick={handlePlayAllTrending} className="btn-primary flex items-center gap-2.5">
              <Play className="w-4 h-4 fill-white" />
              Play All
            </button>
            <button onClick={handleShuffleTrending} className="btn-secondary flex items-center gap-2.5">
              <Shuffle className="w-4 h-4" />
              Shuffle
            </button>
          </div>
        </div>
      </section>

      {/* Trending Now */}
      <section>
        <div className="section-header">
          <h2 className="section-title">Trending Now</h2>
          <Link href="/search" className="text-sm text-accent font-medium hover:opacity-80 transition-opacity flex items-center gap-1">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="glass-card p-3.5 animate-pulse">
                  <div className="aspect-video rounded-xl bg-white/30 dark:bg-white/10 mb-3" />
                  <div className="h-4 bg-white/30 dark:bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/20 dark:bg-white/5 rounded w-1/2" />
                </div>
              ))
            : quotaExceeded
            ? null
            : trending.slice(0, 10).map((result, i) => (
                <div
                  key={result.id}
                  className="glass-card p-3.5 cursor-pointer group hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => handlePlay(result)}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3 shadow-md bg-black/20">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {result.duration}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/50 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="font-semibold text-sm truncate leading-tight">{result.title}</p>
                  <p className="text-xs text-muted truncate">{result.channelTitle}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted">
                    <Eye className="w-3 h-3" />
                    <span>{formatViews(result.views)} views</span>
                  </div>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
}
