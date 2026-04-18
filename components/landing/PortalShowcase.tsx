"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { PublicPortal } from "@/lib/db/schema";

/**
 * Bottom-of-landing carousel showcasing the portals currently live in the
 * world. Mirrors the "Portals in the World" panel from the old Replit
 * Flight-Master, but shows thumbnails + creator handles so it reads like a
 * proper app-store slide.
 *
 * Reads from /api/portals so it stays in sync with whatever's seeded /
 * added via the creator form.
 */
export function PortalShowcase() {
  const [portals, setPortals] = useState<PublicPortal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/portals", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setPortals(d.portals ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && portals.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay: 0.55 }}
      className="relative z-10 mx-auto max-w-7xl px-8 pb-20"
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.4em] text-white/60">
            02 — In the world right now
          </p>
          <h2 className="mt-2 font-semibold text-white" style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}>
            Portals live in the terminal
          </h2>
        </div>
        <Link
          href="/creator"
          className="hidden text-sm text-white/70 underline decoration-white/30 hover:text-white sm:inline-block"
        >
          Add yours →
        </Link>
      </div>

      {/* Horizontal scroll on narrow screens, grid on wide */}
      <div className="-mx-2 flex gap-4 overflow-x-auto pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : portals.map((p) => <PortalCard key={p.id} portal={p} />)}
      </div>

      <p className="mt-6 text-xs text-white/50">
        Each of these has a portal floating in the sky above the Forest City islands.
        Start exploring to fly through them.
      </p>
    </motion.section>
  );
}

function PortalCard({ portal }: { portal: PublicPortal }) {
  const host = safeHost(portal.url);
  const accent = portal.color;

  return (
    <a
      href={portal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex w-[260px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.08] sm:w-auto"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {portal.thumbnailUrl ? (
          // Using <img> rather than next/image so we don't need to whitelist
          // every thumbnail host in next.config. These assets are ~50–400 KB
          // each; that's fine for a landing carousel.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portal.thumbnailUrl}
            alt={portal.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <ThumbnailFallback color={accent} name={portal.name} />
        )}
        <span
          className="absolute left-3 top-3 inline-flex h-2.5 w-2.5 rounded-full shadow-lg"
          style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}` }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-base font-semibold text-white">{portal.name}</h3>
        <p className="truncate text-xs text-white/50">{host}</p>
        {portal.description && (
          <p className="mt-1 line-clamp-2 text-sm text-white/70">{portal.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-white/50">
          <span>{portal.creatorHandle ? `@${portal.creatorHandle}` : "anonymous"}</span>
          <span className="inline-flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            Open ↗
          </span>
        </div>
      </div>
    </a>
  );
}

function ThumbnailFallback({ color, name }: { color: string; name: string }) {
  const initial = (name[0] ?? "?").toUpperCase();
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{
        background: `linear-gradient(135deg, #0f1115 0%, ${withAlpha(color, 0.35)} 100%)`,
      }}
    >
      <span className="font-semibold" style={{ fontSize: 64, color, textShadow: `0 0 22px ${color}` }}>
        {initial}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex w-[260px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] sm:w-auto">
      <div className="aspect-video w-full animate-pulse bg-white/5" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function withAlpha(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
