"use client";

import { usePlayer } from "@/context/player-context";

export function PlayerControls() {
  const { isPlaying, playPause, next, prev, toggleShuffle, toggleRepeat, isShuffled, repeatMode } = usePlayer();

  return (
    <div className="flex items-center gap-4">
      <button onClick={toggleShuffle} className={`text-lg p-1.5 rounded-full transition-all ${isShuffled ? "text-[#6c5ce7]" : "text-[#888]"}`}>🔀</button>
      <button onClick={prev} className="text-xl p-1.5 text-[#555] hover:text-[#1a1a2e] dark:hover:text-white transition-all">⏮</button>
      <button onClick={playPause} className="w-12 h-12 rounded-full bg-[#6c5ce7] text-white flex items-center justify-center text-xl hover:bg-[#5a4bd1] transition-all shadow-lg shadow-[#6c5ce7]/30">
        {isPlaying ? "⏸" : "▶"}
      </button>
      <button onClick={next} className="text-xl p-1.5 text-[#555] hover:text-[#1a1a2e] dark:hover:text-white transition-all">⏭</button>
      <button onClick={toggleRepeat} className={`text-lg p-1.5 rounded-full transition-all ${repeatMode !== "none" ? "text-[#6c5ce7]" : "text-[#888]"}`}>
        {repeatMode === "one" ? "🔂" : "🔁"}
      </button>
    </div>
  );
}
