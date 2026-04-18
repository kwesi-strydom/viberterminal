"use client";

import { useEffect } from "react";
import { useWorld } from "@/lib/stores/useWorld";

/**
 * Lightweight toast shown in the bottom-center of the world when the player
 * flies through a portal. Replaces the old full-screen iframe overlay, which
 * consistently failed for real apps due to X-Frame-Options / frame-ancestors.
 *
 * Auto-dismisses after 3.5s. No click handler — the new tab is already open.
 */
export function PortalToast() {
  const lastOpened = useWorld((s) => s.lastOpened);
  const dismiss = useWorld((s) => s.dismissLastOpened);

  useEffect(() => {
    if (!lastOpened) return;
    const t = setTimeout(dismiss, 3500);
    return () => clearTimeout(t);
  }, [lastOpened, dismiss]);

  if (!lastOpened) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 animate-[viberFadeIn_200ms_ease-out]">
      <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/60 px-5 py-3 text-white backdrop-blur-md shadow-xl">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-400/20 text-cyan-300">
          ↗
        </span>
        <div className="leading-tight">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Opened in a new tab</p>
          <p className="text-sm font-medium">{lastOpened.name}</p>
        </div>
      </div>
      <style jsx global>{`
        @keyframes viberFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}
