"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlayer } from "@/context/player-context";
import { Search, Play, Music, Mic2, Loader2, X, ArrowUpDown, Eye } from "lucide-react";
import { convertYouTubeToSong } from "@/lib/youtube-player";
import type { YouTubeSearchResult } from "@/lib/youtube";

interface Suggestion {
  type: "song" | "artist";
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const fetchRef = useRef<AbortController>();
  const { play, playQueue } = usePlayer();

  useEffect(() => {
    if (fetchRef.current) fetchRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setSuggestions([]);
      setShowSuggestions(false);
      setQuotaExceeded(false);
      return;
    }

    const q = query.trim();

    const ctrl = new AbortController();
    fetchRef.current = ctrl;
    fetch(`/api/youtube/suggestions?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.ok ? r.json() : { suggestions: [] })
      .then((d) => {
        if (!ctrl.signal.aborted) {
          setSuggestions(d.suggestions || []);
          setShowSuggestions(true);
        }
      })
      .catch(() => {});

    debounceRef.current = setTimeout(async () => {
      if (fetchRef.current) fetchRef.current.abort();
      const ctrl2 = new AbortController();
      fetchRef.current = ctrl2;

      setLoading(true);
      setSearched(true);
      setQuotaExceeded(false);
      try {
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q)}&maxResults=24`, {
          signal: ctrl2.signal,
        });
        if (ctrl2.signal.aborted) return;
        if (res.status === 429) { setQuotaExceeded(true); setResults([]); return; }
        if (!res.ok) { setResults([]); return; }
        const d = await res.json();
        if (!ctrl2.signal.aborted) setResults(d.results || []);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
      } finally {
        if (!ctrl2.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      ctrl.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handlePlay = useCallback((result: YouTubeSearchResult) => {
    const song = convertYouTubeToSong(result);
    play(song as any);
  }, [play]);

  const handlePlayAll = useCallback(() => {
    if (results.length > 0) {
      const songs = results.map(r => convertYouTubeToSong(r));
      playQueue(songs as any, 0);
    }
  }, [results, playQueue]);

  const submitSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "gi");
    return text.split(re).map((p, i) =>
      re.test(p) ? <span key={i} className="text-accent font-semibold">{p}</span> : p
    );
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter" && focusedIdx >= 0) {
      e.preventDefault();
      const s = suggestions[focusedIdx];
      setQuery(s.title);
      setShowSuggestions(false);
      setFocusedIdx(-1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setFocusedIdx(-1);
    }
  };

  const formatViews = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const q = query.trim().toLowerCase();

  return (
    <div className="space-y-8 animate-fade-in" onKeyDown={onKeyDown}>
      <form onSubmit={submitSearch} className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocusedIdx(-1); }}
          onFocus={() => { if (query.trim() && suggestions.length > 0) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search millions of songs on YouTube..."
          className="w-full pl-12 pr-12 py-4 rounded-2xl glass text-lg focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all border border-white/70 dark:border-white/[0.08]"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSearched(false); setResults([]); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestRef}
            className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-2xl overflow-hidden shadow-2xl border border-white/80 dark:border-white/[0.08] z-50 animate-slide-up"
          >
            {suggestions.map((s, i) => (
              <div
                key={`${s.type}-${s.id}`}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                  i === focusedIdx
                    ? "bg-accent/15 dark:bg-accent/20"
                    : "hover:bg-white/40 dark:hover:bg-white/[0.06]"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(s.title);
                  setShowSuggestions(false);
                }}
                onMouseEnter={() => setFocusedIdx(i)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                  s.type === "song" ? "bg-accent/10" : "bg-purple-500/10"
                }`}>
                  {s.image ? (
                    <img src={s.image} alt="" className="w-full h-full object-cover" />
                  ) : s.type === "song" ? (
                    <Music className="w-5 h-5 text-accent" />
                  ) : (
                    <Mic2 className="w-5 h-5 text-purple-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{highlight(s.title, query)}</p>
                  <p className="text-xs text-muted truncate">{highlight(s.subtitle, query)}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted font-medium flex-shrink-0 ml-2">
                  {s.type}
                </span>
              </div>
            ))}
            <div className="px-4 py-2.5 border-t border-white/50 dark:border-white/[0.04] flex items-center justify-between">
              <span className="text-xs text-muted">
                <ArrowUpDown className="w-3 h-3 inline mr-1" />
                Navigate
              </span>
              <span className="text-xs text-muted">
                <kbd className="px-1.5 py-0.5 rounded bg-white/30 dark:bg-white/10 text-[10px] font-mono">Enter</kbd> Select
              </span>
            </div>
          </div>
        )}
      </form>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      )}

      {quotaExceeded && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white/30 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Search className="w-10 h-10 text-muted/50" />
          </div>
          <h3 className="text-xl font-bold mb-1">YouTube API quota exceeded</h3>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            The daily free quota for YouTube API has been reached. Please try again tomorrow or add a billing account.
          </p>
        </div>
      )}

      {!loading && searched && query.trim() && results.length === 0 && !quotaExceeded && (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-white/30 dark:bg-white/5 flex items-center justify-center mx-auto mb-5">
            <Search className="w-10 h-10 text-muted/50" />
          </div>
          <h3 className="text-xl font-bold mb-1">No results found</h3>
          <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
            We couldn&apos;t find anything for &ldquo;{query}&rdquo; on YouTube Music. Try a different search term.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["Electronic", "Ambient", "Pop", "Lo-fi", "Rock", "Hip-hop", "Jazz", "Classical"].map((genre) => (
              <button
                key={genre}
                onClick={() => setQuery(genre)}
                className="px-4 py-2 rounded-xl bg-white/40 dark:bg-white/10 text-sm font-medium hover:bg-white/60 dark:hover:bg-white/20 transition-all"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length > 0 && searched && (
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">
              Results for &ldquo;{query}&rdquo;
              <span className="text-sm font-normal text-muted ml-2">({results.length} videos)</span>
            </h2>
            <button onClick={handlePlayAll} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-white" />
              Play All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {results.map((result, i) => (
              <div
                key={result.id}
                className="glass-card p-3.5 cursor-pointer group hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${i * 0.03}s` }}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/50 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
                <p className="font-semibold text-sm truncate leading-tight" title={result.title}>
                  {highlight(result.title, query)}
                </p>
                <p className="text-xs text-muted truncate mt-0.5">
                  {highlight(result.channelTitle, query)}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted">
                  <Eye className="w-3 h-3" />
                  <span>{formatViews(result.views)} views</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!query.trim() && !searched && (
        <div className="space-y-10 animate-fade-in">
          <section>
            <div className="section-header">
              <h2 className="section-title">Browse Music</h2>
              <p className="text-xs text-muted">Powered by YouTube Music</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: "Electronic", icon: "🎛", color: "from-purple-500/20 to-blue-500/20" },
                { name: "Ambient", icon: "🌊", color: "from-cyan-500/20 to-teal-500/20" },
                { name: "Pop", icon: "🎤", color: "from-pink-500/20 to-rose-500/20" },
                { name: "Rock", icon: "🎸", color: "from-amber-500/20 to-orange-500/20" },
                { name: "Lo-fi", icon: "☕", color: "from-emerald-500/20 to-teal-500/20" },
                { name: "Hip-hop", icon: "🎧", color: "from-yellow-500/20 to-orange-500/20" },
                { name: "Jazz", icon: "🎷", color: "from-indigo-500/20 to-purple-500/20" },
                { name: "Classical", icon: "🎻", color: "from-amber-500/20 to-yellow-500/20" },
              ].map((genre, i) => (
                <div
                  key={genre.name}
                  className={`glass-card p-6 text-center cursor-pointer group bg-gradient-to-br ${genre.color} hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => setQuery(genre.name)}
                >
                  <p className="text-4xl mb-3">{genre.icon}</p>
                  <p className="font-semibold text-lg">{genre.name}</p>
                  <p className="text-xs text-muted mt-1">Search YouTube Music</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
