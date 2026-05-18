"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { PlayerBar } from "../player/player-bar";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#d2d2d2] dark:bg-[#1a1a2e] text-text dark:text-white/90 transition-colors duration-300 selection:bg-accent/20">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-5 lg:px-10 py-6 sm:py-8 pb-40 lg:pb-28 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
      <PlayerBar />
      <MobileNav />
    </div>
  );
}
