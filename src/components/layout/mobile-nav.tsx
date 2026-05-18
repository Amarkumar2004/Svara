"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/player-context";
import { Home, Search, Heart, Clock, PlayCircle } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { currentTrack } = usePlayer();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/liked", label: "Liked", icon: Heart },
    { href: "/recent", label: "Recent", icon: Clock },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-strong border-t border-white/70 dark:border-white/10 safe-area-bottom">
      {currentTrack && (
        <div className="h-1 bg-accent/20">
          <div className="h-full bg-accent transition-all duration-300" style={{ width: "0%" }} />
        </div>
      )}
      <div className="flex items-center justify-around py-2 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 min-w-0",
                isActive
                  ? "text-accent"
                  : "text-muted hover:text-text dark:hover:text-white/80"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
