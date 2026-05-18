"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/player-context";
import { convertYouTubeToSong } from "@/lib/youtube-player";
import { Menu, Search, Moon, Sun, Music } from "lucide-react";

interface Suggestion {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  videoId: string;
}

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { play } = usePlayer();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.suggestions?.length) {
          setSuggestions(data.suggestions.map((s: any) => ({
            id: s.id,
            title: s.title,
            subtitle: s.subtitle,
            image: s.image,
            videoId: s.id,
          })));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (s: Suggestion) => {
    const song = convertYouTubeToSong({
      id: s.videoId,
      title: s.title,
      channelId: s.id,
      channelTitle: s.subtitle,
      thumbnail: s.image,
      durationSeconds: 0,
    });
    play(song as any);
    setQuery("");
    setShowSuggestions(false);
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    html.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "light" : "dark");
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase()
        ? <span key={i} className="text-accent font-semibold">{part}</span>
        : part
    );
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 bg-white/50 dark:bg-black/30 backdrop-blur-2xl border-b border-white/70 dark:border-white/[0.06]">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo on mobile */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-pink-400 flex items-center justify-center">
          <Music className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-lg relative">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search YouTube Music..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/60 dark:bg-white/10 border border-white/70 dark:border-white/20 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-muted/60"
            />
          </div>
        </form>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 glass-strong rounded-xl shadow-2xl border border-white/70 dark:border-white/[0.08] overflow-hidden animate-slide-up z-50">
            <div className="p-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/[0.06] transition-all text-left group"
                >
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {highlightMatch(s.title, query)}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {highlightMatch(s.subtitle, query)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleSearchSubmit}
              className="w-full p-2.5 text-center text-xs text-accent font-medium border-t border-white/50 dark:border-white/[0.06] hover:bg-white/30 dark:hover:bg-white/[0.03] transition-all"
            >
              See all results on YouTube
            </button>
          </div>
        )}

        {showSuggestions && query && suggestions.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 glass-strong rounded-xl shadow-2xl border border-white/70 dark:border-white/[0.08] p-6 text-center animate-slide-up z-50">
            <Search className="w-8 h-8 text-muted/40 mx-auto mb-2" />
            <p className="text-sm font-medium">No results found</p>
            <p className="text-xs text-muted mt-0.5">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/20 transition-all"
        aria-label="Toggle theme"
      >
        <Sun className="w-4 h-4 hidden dark:block" />
        <Moon className="w-4 h-4 block dark:hidden" />
      </button>
    </header>
  );
}
