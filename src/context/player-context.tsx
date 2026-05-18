"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { isYouTubeTrack, getYouTubeVideoId } from "@/lib/youtube-player";
import { addGuestRecent } from "@/lib/guest";
import type { Song } from "@/types";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type RepeatMode = "none" | "one" | "all";

interface PlayerContextType {
  currentTrack: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  play: (track: Song) => void;
  playPause: () => void;
  playQueue: (tracks: Song[], startIndex?: number) => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setQueue: (tracks: Song[], index?: number) => void;
  isYouTubeTrack: (src: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

let ytAPIReady = false;
let ytAPILoading = false;
let ytInitQueue: Array<() => void> = [];

function loadYouTubeAPI() {
  if (ytAPIReady || ytAPILoading) return;
  ytAPILoading = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const first = document.getElementsByTagName('script')[0];
  first?.parentNode?.insertBefore(tag, first);
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== "undefined") return parseFloat(localStorage.getItem("player-volume") || "0.7");
    return 0.7;
  });
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    ytContainerRef.current = document.createElement('div');
    ytContainerRef.current.id = 'youtube-player';
    ytContainerRef.current.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px';
    document.body.appendChild(ytContainerRef.current);
    loadYouTubeAPI();

    window.onYouTubeIframeAPIReady = () => {
      ytAPIReady = true;
      ytAPILoading = false;
      ytInitQueue.forEach(fn => fn());
      ytInitQueue = [];
    };

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
      if (ytContainerRef.current) {
        ytContainerRef.current.remove();
        ytContainerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  const createYTPlayer = useCallback((videoId: string): Promise<any> => {
    return new Promise((resolve) => {
      const init = () => {
        if (ytPlayerRef.current) {
          ytPlayerRef.current.destroy();
        }
        ytPlayerRef.current = new window.YT.Player('youtube-player', {
          height: '1',
          width: '1',
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(volume * 100);
              resolve(event.target);
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                const dur = event.target.getDuration();
                if (isFinite(dur)) setDuration(dur);
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = setInterval(() => {
                  try {
                    const t = event.target.getCurrentTime();
                    if (isFinite(t)) setCurrentTime(t);
                  } catch {}
                }, 250);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                handleEnded();
              } else if (event.data === window.YT.PlayerState.CUED) {
                const dur = event.target.getDuration();
                if (isFinite(dur)) setDuration(dur);
              }
            },
            onError: () => {
              setIsPlaying(false);
            },
          },
        });
      };

      if (ytAPIReady) {
        init();
      } else {
        ytInitQueue.push(init);
      }
    });
  }, [volume]);

  const handleEnded = useCallback(() => {
    if (repeatMode === "one") {
      ytPlayerRef.current?.seekTo(0);
      ytPlayerRef.current?.playVideo();
      return;
    }
    if (queue.length > 0) {
      let nextIdx: number;
      if (isShuffled) {
        const curShuffleIdx = shuffleOrder.indexOf(currentIndex);
        nextIdx = shuffleOrder[(curShuffleIdx + 1) % queue.length];
      } else {
        nextIdx = (currentIndex + 1) % queue.length;
      }
      if (repeatMode === "none" && nextIdx === 0 && currentIndex === queue.length - 1) {
        setIsPlaying(false);
        return;
      }
      setCurrentIndex(nextIdx);
      loadTrack(nextIdx);
    }
  }, [queue, currentIndex, isShuffled, shuffleOrder, repeatMode]);

  const stopProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  const trackRecent = useCallback((track: Song) => {
    const videoId = isYouTubeTrack(track.src) ? getYouTubeVideoId(track.src) : null;
    if (!videoId) return;
    addGuestRecent(videoId);
  }, []);

  const loadTrack = useCallback((index: number) => {
    if (index < 0 || index >= queue.length) return;
    const track = queue[index];
    setCurrentTrack(track);

    stopProgressInterval();
    setCurrentTime(0);
    setDuration(0);

    trackRecent(track);

    if (isYouTubeTrack(track.src)) {
      const videoId = getYouTubeVideoId(track.src);
      if (videoId) {
        createYTPlayer(videoId).then((player) => {
          player.playVideo();
        }).catch(() => {});
      }
    } else {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.stopVideo();
      }
      const audio = audioRef.current;
      if (audio) {
        audio.src = track.src;
        audio.load();
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [queue, createYTPlayer, stopProgressInterval, trackRecent]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMeta = () => setDuration(audio.duration);
    const onEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } else if (queue.length > 0) {
        let nextIdx: number;
        if (isShuffled) {
          const curShuffleIdx = shuffleOrder.indexOf(currentIndex);
          nextIdx = shuffleOrder[(curShuffleIdx + 1) % queue.length];
        } else {
          nextIdx = (currentIndex + 1) % queue.length;
        }
        if (repeatMode === "none" && nextIdx === 0 && currentIndex === queue.length - 1) {
          setIsPlaying(false);
          return;
        }
        setCurrentIndex(nextIdx);
        loadTrack(nextIdx);
      }
    };
    const onError = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [queue, currentIndex, isShuffled, shuffleOrder, repeatMode, loadTrack]);

  const play = useCallback((track: Song) => {
    setQueueState([track]);
    setCurrentIndex(0);
    setCurrentTrack(track);
    stopProgressInterval();
    setCurrentTime(0);
    setDuration(0);

    trackRecent(track);

    if (isYouTubeTrack(track.src)) {
      const videoId = getYouTubeVideoId(track.src);
      if (videoId) {
        createYTPlayer(videoId).then((player) => {
          player.playVideo();
        }).catch(() => {});
      }
    } else {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.stopVideo();
      }
      const audio = audioRef.current;
      if (audio) {
        audio.src = track.src;
        audio.load();
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [createYTPlayer, stopProgressInterval, trackRecent]);

  const playPause = useCallback(() => {
    if (!currentTrack) return;

    if (isYouTubeTrack(currentTrack.src)) {
      const player = ytPlayerRef.current;
      if (!player) return;
      try {
        const state = player.getPlayerState?.();
        if (state === window.YT.PlayerState.PLAYING) {
          player.pauseVideo();
          setIsPlaying(false);
        } else {
          player.playVideo();
          setIsPlaying(true);
        }
      } catch {
        setIsPlaying(false);
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    }
  }, [currentTrack]);

  const playQueue = useCallback((tracks: Song[], startIndex = 0) => {
    setQueueState(tracks);
    setCurrentIndex(startIndex);
    loadTrack(startIndex);
  }, [loadTrack]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    if (repeatMode === "one") {
      if (currentTrack && isYouTubeTrack(currentTrack.src)) {
        ytPlayerRef.current?.seekTo(0);
        ytPlayerRef.current?.playVideo();
      } else {
        const audio = audioRef.current;
        if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
      }
      return;
    }
    let nextIdx: number;
    if (isShuffled) {
      const curShuffleIdx = shuffleOrder.indexOf(currentIndex);
      nextIdx = shuffleOrder[(curShuffleIdx + 1) % queue.length];
    } else {
      nextIdx = (currentIndex + 1) % queue.length;
    }
    setCurrentIndex(nextIdx);
    loadTrack(nextIdx);
  }, [queue, currentIndex, isShuffled, shuffleOrder, repeatMode, loadTrack, currentTrack]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    if (currentTrack && isYouTubeTrack(currentTrack.src)) {
      const player = ytPlayerRef.current;
      if (player) {
        try {
          const ct = player.getCurrentTime?.();
          if (ct > 3) { player.seekTo(0); player.playVideo(); return; }
        } catch {}
      }
    } else {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
    }
    let prevIdx: number;
    if (isShuffled) {
      const curShuffleIdx = shuffleOrder.indexOf(currentIndex);
      prevIdx = shuffleOrder[(curShuffleIdx - 1 + queue.length) % queue.length];
    } else {
      prevIdx = (currentIndex - 1 + queue.length) % queue.length;
    }
    setCurrentIndex(prevIdx);
    loadTrack(prevIdx);
  }, [queue, currentIndex, isShuffled, shuffleOrder, loadTrack, currentTrack]);

  const seek = useCallback((time: number) => {
    if (!currentTrack || !isFinite(time)) return;
    if (isYouTubeTrack(currentTrack.src)) {
      ytPlayerRef.current?.seekTo(time);
    } else {
      const audio = audioRef.current;
      if (audio) audio.currentTime = time;
    }
  }, [currentTrack]);

  const setVolume = useCallback((vol: number) => {
    const v = Math.max(0, Math.min(1, vol));
    setVolumeState(v);
    localStorage.setItem("player-volume", String(v));
  }, []);

  const setQueue = useCallback((tracks: Song[], index = 0) => {
    setQueueState(tracks);
    setCurrentIndex(index);
    loadTrack(index);
  }, [loadTrack]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      if (next) {
        const order = queue.map((_, i) => i);
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        const curIdx = order.indexOf(currentIndex);
        if (curIdx > 0) {
          [order[0], order[curIdx]] = [order[curIdx], order[0]];
        }
        setShuffleOrder(order);
      }
      return next;
    });
  }, [queue, currentIndex]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const modes: RepeatMode[] = ["none", "one", "all"];
      const i = modes.indexOf(prev);
      const next = modes[(i + 1) % modes.length];
      if (!currentTrack || !isYouTubeTrack(currentTrack.src)) {
        if (audioRef.current) audioRef.current.loop = next === "one";
      }
      return next;
    });
  }, [currentTrack]);

  const checkIsYouTube = useCallback((src: string) => isYouTubeTrack(src), []);

  return (
    <PlayerContext.Provider value={{
      currentTrack, queue, isPlaying, currentTime, duration, volume,
      isShuffled, repeatMode,
      play, playPause, playQueue, next, prev, seek, setVolume,
      toggleShuffle, toggleRepeat, setQueue,
      isYouTubeTrack: checkIsYouTube,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
