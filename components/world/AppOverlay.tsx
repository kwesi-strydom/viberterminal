"use client";

import { useEffect, useState } from "react";
import { useWorld } from "@/lib/stores/useWorld";

/**
 * Fullscreen iframe overlay shown when the plane flies through a portal.
 *
 * v1 behavior:
 *   - Try to embed the URL in an iframe.
 *   - If the site blocks iframe embedding (X-Frame-Options / CSP frame-ancestors),
 *     the iframe will appear blank. We surface an "Open in new tab" button so the
 *     user still gets to the app. This matches what Flight-Master did for the
 *     Sperm Racer portal, but here it's the fallback rather than the default.
 */
export function AppOverlay() {
  const active = useWorld((s) => s.activePortal);
  const close = useWorld((s) => s.closePortal);

  const [blocked, setBlocked] = useState(false);

  // Reset blocked state each time we open a new portal
  useEffect(() => {
    setBlocked(false);
    if (!active) return;
    // Some browsers swallow iframe errors silently. Nudge after 4s —
    // if onLoad hasn't fired, assume embedding is blocked.
    const t = setTimeout(() => setBlocked(true), 4000);
    return () => clearTimeout(t);
  }, [active]);

  // ESC to close
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-900/70 backdrop-blur-md">
      {/* Chrome bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-ink-900/80 px-5 py-3 text-sm text-white">
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: active.color, boxShadow: `0 0 12px ${active.color}` }}
          />
          <div>
            <p className="font-medium">{active.name}</p>
            <p className="text-xs text-white/60">{new URL(active.url).host}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            Open in new tab ↗
          </a>
          <button
            onClick={close}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-900 hover:bg-white/90"
          >
            Close (Esc)
          </button>
        </div>
      </div>

      {/* Embed */}
      <div className="relative flex-1 bg-white">
        <iframe
          key={active.id}
          src={active.url}
          title={active.name}
          className="h-full w-full border-0"
          onLoad={() => setBlocked(false)}
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-presentation allow-pointer-lock"
          referrerPolicy="no-referrer"
        />
        {blocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-50/95 text-center">
            <div className="max-w-md rounded-2xl border border-ink-900/10 bg-white p-8 shadow-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-900/60">Embed blocked</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink-900">
                {active.name} won&apos;t load in a frame
              </h3>
              <p className="mt-2 text-ink-900/70">
                Some sites (like Google and most banks) prevent being embedded.
                Opening it in a new tab instead.
              </p>
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block rounded-full bg-ink-900 px-5 py-2 text-sm text-ink-50 hover:bg-ink-900/90"
              >
                Open {new URL(active.url).host} ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
