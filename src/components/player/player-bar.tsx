"use client";

import { usePlayer } from "@/context/player-context";
import { formatTime } from "@/lib/utils";
import { isYouTubeTrack, getYouTubeVideoId } from "@/lib/youtube-player";
import { getGuestLikes, setGuestLikes, isGuestLiked } from "@/lib/guest";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume1,
  Volume2,
  VolumeX,
  Music,
  ListMusic,
} from "lucide-react";

export function PlayerBar() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    isShuffled, repeatMode,
    playPause, next, prev, seek, setVolume,
    toggleShuffle, toggleRepeat,
  } = usePlayer();
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [showVolume, setShowVolume] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLikedSongs(getGuestLikes());
  }, []);

  const getVideoId = (): string | null => {
    if (!currentTrack) return null;
    if (isYouTubeTrack(currentTrack.src)) return getYouTubeVideoId(currentTrack.src);
    return currentTrack.id;
  };

  const toggleLike = () => {
    if (!currentTrack) return;
    const videoId = getVideoId();
    if (!videoId) return;

    const newState = !isGuestLiked(videoId);
    if (newState) {
      const likes = getGuestLikes();
      likes.push(videoId);
      setGuestLikes(likes);
      setLikedSongs([...likes]);
    } else {
      const likes = getGuestLikes().filter(id => id !== videoId);
      setGuestLikes(likes);
      setLikedSongs(likes);
    }
    toast.success(newState ? "Added to likes" : "Removed from likes");
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(pct * duration);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isYT = currentTrack ? isYouTubeTrack(currentTrack.src) : false;

  if (!currentTrack) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-50 bottom-14 lg:bottom-0">
        <div className="mx-2 lg:mx-4 mb-2 lg:mb-3">
          <div className="max-w-[1400px] mx-auto glass-strong rounded-2xl px-6 py-4 flex items-center justify-center shadow-2xl">
            <Music className="w-5 h-5 text-muted mr-3" />
            <p className="text-muted text-sm">Select a song to start playing</p>
          </div>
        </div>
      </footer>
    );
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.3 ? Volume1 : Volume2;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bottom-14 lg:bottom-0">
      <div className="mx-2 lg:mx-4 mb-2 lg:mb-3">
        <div className="max-w-[1400px] mx-auto glass-strong rounded-2xl px-3 lg:px-5 py-3 shadow-2xl border border-white/80 dark:border-white/[0.08] relative">
          <div
            ref={progressRef}
            className="absolute top-0 left-3 lg:left-5 right-3 lg:right-5 h-1 bg-white/20 dark:bg-white/10 rounded-full cursor-pointer group overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-accent to-purple-400 rounded-full relative transition-all duration-100"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity border-2 border-accent" />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 pt-3">
            {/* Left - Song Info */}
            <div className="flex items-center gap-3 w-48 lg:w-64 min-w-0 flex-shrink-0">
              <div className="relative w-11 h-11 lg:w-14 lg:h-14 flex-shrink-0">
                <img
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  className={`w-full h-full rounded-xl object-cover shadow-lg ${
                    isPlaying ? "animate-spin-slow" : ""
                  }`}
                  style={!isPlaying ? { animationPlayState: "paused" } : {}}
                />
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 dark:ring-white/5" />
                {isYT && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF0000] flex items-center justify-center shadow">
                    <span className="text-[6px] font-bold text-white">YT</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
                <p className="text-xs text-muted truncate mt-0.5">
                  {currentTrack.artist?.name || "Unknown"}
                  {isYT && <span className="ml-1 text-[10px] text-[#FF0000]">YouTube</span>}
                </p>
              </div>
              <button
                onClick={toggleLike}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 dark:hover:bg-white/10 transition-all hidden sm:flex"
              >
                <Heart
                  className={`w-4 h-4 transition-all ${
                    likedSongs.includes(getVideoId() || '')
                      ? "fill-[#e17055] text-[#e17055] scale-110"
                      : "text-muted hover:text-text"
                  }`}
                />
              </button>
            </div>

            {/* Center - Controls */}
            <div className="flex-1 flex flex-col items-center gap-1 max-w-xl mx-auto">
              <div className="flex items-center gap-1.5 lg:gap-3">
                <button
                  onClick={toggleShuffle}
                  className={`p-1.5 lg:p-2 rounded-full transition-all ${
                    isShuffled
                      ? "text-accent bg-accent/10"
                      : "text-muted hover:text-text hover:bg-white/20 dark:hover:bg-white/10"
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
                <button
                  onClick={prev}
                  className="p-1.5 lg:p-2 rounded-full text-muted hover:text-text hover:bg-white/20 dark:hover:bg-white/10 transition-all"
                >
                  <SkipBack className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
                <button
                  onClick={playPause}
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover active:scale-95 transition-all shadow-lg shadow-accent/30 hover:shadow-glow-strong"
                >
                  {isPlaying ? <Pause className="w-4 h-4 lg:w-5 lg:h-5 fill-white" /> : <Play className="w-4 h-4 lg:w-5 lg:h-5 fill-white ml-0.5" />}
                </button>
                <button
                  onClick={next}
                  className="p-1.5 lg:p-2 rounded-full text-muted hover:text-text hover:bg-white/20 dark:hover:bg-white/10 transition-all"
                >
                  <SkipForward className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`p-1.5 lg:p-2 rounded-full transition-all ${
                    repeatMode !== "none"
                      ? "text-accent bg-accent/10"
                      : "text-muted hover:text-text hover:bg-white/20 dark:hover:bg-white/10"
                  }`}
                >
                  {repeatMode === "one" ? (
                    <Repeat1 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  ) : (
                    <Repeat className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  )}
                </button>
              </div>

              {/* Progress bar - desktop only */}
              <div className="hidden lg:flex items-center gap-2.5 w-full">
                <span className="text-[11px] text-muted tabular-nums min-w-[2.5rem] text-right">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-1 bg-white/20 dark:bg-white/10 rounded-full cursor-pointer group relative"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-gradient-to-r from-accent to-purple-400 rounded-full relative transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md border-2 border-accent" />
                  </div>
                </div>
                <span className="text-[11px] text-muted tabular-nums min-w-[2.5rem]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right - Volume & Queue */}
            <div className="hidden lg:flex items-center gap-2 w-48 justify-end flex-shrink-0">
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`p-2 rounded-full transition-all ${
                  showQueue ? "text-accent bg-accent/10" : "text-muted hover:text-text hover:bg-white/20 dark:hover:bg-white/10"
                }`}
              >
                <ListMusic className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                  className="p-1.5 rounded-full text-muted hover:text-text transition-all"
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <div
                  className="relative group cursor-pointer"
                  onMouseEnter={() => setShowVolume(true)}
                  onMouseLeave={() => setShowVolume(false)}
                >
                  <div className="w-24 h-1 bg-white/20 dark:bg-white/10 rounded-full">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                  {(showVolume || volume > 0) && (
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 opacity-0 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
