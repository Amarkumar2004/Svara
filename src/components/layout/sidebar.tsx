"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Search, Heart, Clock, Music } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/liked", label: "Liked Songs", icon: Heart },
  { href: "/recent", label: "Recently Played", icon: Clock },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 flex flex-col",
          "bg-white/60 dark:bg-black/40 backdrop-blur-2xl",
          "border-r border-white/70 dark:border-white/[0.06]",
          "lg:flex lg:flex-col",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-6 pb-4 border-b border-white/50 dark:border-white/[0.04]">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-pink-400 flex items-center justify-center text-white shadow-lg shadow-accent/30 group-hover:shadow-accent/50 transition-shadow">
              <Music className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-accent to-pink-400 bg-clip-text text-transparent">
              Svara
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent dark:text-accent shadow-sm"
                    : "text-secondary dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/[0.06] hover:text-text dark:hover:text-white/90"
                )}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}

          <div className="my-4 mx-3 h-px bg-white/40 dark:bg-white/[0.04]" />

          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted mb-2">
            Library
          </p>
          <Link
            href="/liked"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === "/liked"
                ? "bg-accent/10 text-accent dark:text-accent shadow-sm"
                : "text-secondary dark:text-white/60 hover:bg-white/50 dark:hover:bg-white/[0.06] hover:text-text dark:hover:text-white/90"
            )}
          >
            <Heart className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Liked Songs</span>
          </Link>
        </nav>

        {/* Bottom branding */}
        <div className="p-4 border-t border-white/50 dark:border-white/[0.04]">
          <p className="text-[10px] text-muted text-center">Powered by YouTube Music</p>
        </div>
      </aside>
    </>
  );
}
