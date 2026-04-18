"use client";

import { create } from "zustand";
import type { PublicPortal } from "@/lib/db/schema";

interface WorldState {
  portals: PublicPortal[];
  loading: boolean;
  /** Name of the last portal the player entered, shown briefly as a toast. */
  lastOpened: { name: string; at: number } | null;
  fetchPortals: () => Promise<void>;
  openPortal: (p: PublicPortal) => void;
  dismissLastOpened: () => void;
}

/**
 * Portals open in a new browser tab rather than an iframe overlay. Many
 * real apps (Network School, banks, etc.) set X-Frame-Options or frame
 * ancestors that block embedding, so the iframe approach was consistently
 * broken. New-tab is reliable and lets the player keep the terminal open.
 */
export const useWorld = create<WorldState>((set) => ({
  portals: [],
  loading: false,
  lastOpened: null,

  async fetchPortals() {
    set({ loading: true });
    try {
      const res = await fetch("/api/portals", { cache: "no-store" });
      const data = await res.json();
      set({ portals: data.portals ?? [] });
    } finally {
      set({ loading: false });
    }
  },

  openPortal(p) {
    // Fire-and-forget play counter
    fetch(`/api/portals/${p.id}`, { method: "POST" }).catch(() => {});
    set({ lastOpened: { name: p.name, at: Date.now() } });
    if (typeof window !== "undefined") {
      window.open(p.url, "_blank", "noopener,noreferrer");
    }
  },

  dismissLastOpened() {
    set({ lastOpened: null });
  },
}));
