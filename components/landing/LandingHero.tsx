"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PortalShowcase } from "./PortalShowcase";

/**
 * Landing page — Ultiverse-style, Network School-flavored.
 *
 * Evolved from the original Flight-Master "Choose your callsign" flow:
 *   - Full-bleed looping hero video behind everything
 *   - New hero description (NS-centric)
 *   - Two CTAs: "Start exploring" (player) / "Add your creation to the world"
 *     (creator)
 *   - An explorer-name input that writes to localStorage so the preflight
 *     screen can greet the pilot by name without an extra step
 */
export function LandingHero() {
  const videoSrc = process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/hero.mp4";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
    document.addEventListener("pointerdown", tryPlay, { once: true });
    return () => document.removeEventListener("pointerdown", tryPlay);
  }, []);

  // Load existing name from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("viber.explorerName");
      if (saved) setName(saved);
    } catch {}
  }, []);

  function persistName(next: string) {
    setName(next);
    try {
      localStorage.setItem("viber.explorerName", next);
    } catch {}
  }

  const canExplore = name.trim().length > 0;
  const exploreHref = canExplore ? `/world?name=${encodeURIComponent(name.trim())}` : "/world";

  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* ---- HERO SLIDE — fills the viewport, holds the video + overlays ---- */}
      <div className="relative h-screen overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
        />
        {/* Gradient fallback while video buffers */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${videoReady ? "opacity-0" : "opacity-100"}`}
          style={{
            background: "linear-gradient(135deg, #1a0b2e 0%, #2a1147 35%, #401861 60%, #ff6a3d 100%)",
          }}
        />

        {/* Dark legibility overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/30" />

        {/* ---- NAV ---- */}
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-white/10 backdrop-blur-md ring-1 ring-white/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 4l9 16L21 4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-[0.18em] text-white">VIBER</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/85 sm:flex">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/creator" className="hover:text-white">Creators</Link>
          <Link href="/world" className="hover:text-white">Terminal</Link>
        </nav>

          <Link
            href={exploreHref}
            className="hidden rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 sm:inline-block"
          >
            Launch ↗
          </Link>
        </header>

        {/* ---- HERO CONTENT ---- */}
        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-between px-8 pb-12 pt-8">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-xs font-medium uppercase tracking-[0.4em] text-white/70"
          >
            01 — Enter the world
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1 }}
            className="mt-5 font-semibold leading-[0.95] tracking-tight text-white"
            style={{ fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)" }}
          >
            THE OPEN<br />
            METAVERSE OF<br />
            <span className="bg-gradient-to-r from-[#ffb24a] via-[#ff5e7a] to-[#7d6cff] bg-clip-text text-transparent">
              AGENT-BUILT APPS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.25 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/85"
          >
            Navigate a living 3D universe. Fly through portals to discover apps,
            games, and worlds built by the Network School community.
          </motion.p>

          {/* Explorer name input — the "Choose your callsign" from the old Flight-Master */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.35 }}
            className="mt-8 flex max-w-xl flex-col gap-3 rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-md"
            onSubmit={(e) => {
              e.preventDefault();
              if (canExplore) window.location.href = exploreHref;
            }}
          >
            <label className="text-[11px] font-medium uppercase tracking-[0.3em] text-white/60">
              Choose your explorer name
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={name}
                onChange={(e) => persistName(e.target.value.slice(0, 24))}
                placeholder="e.g. Maverick"
                maxLength={24}
                className="flex-1 rounded-full border border-white/20 bg-black/40 px-5 py-3 text-white placeholder-white/40 outline-none focus:border-white/50"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!canExplore}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6a3d] via-[#ff4e7a] to-[#7d6cff] px-7 py-3 text-sm font-semibold text-white shadow-lg transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start exploring
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="transition group-enabled:group-hover:translate-x-0.5">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-white/50">
              Or{" "}
              <Link href="/creator" className="font-medium text-white/80 underline decoration-white/30 hover:text-white">
                add your creation to the world
              </Link>{" "}
              — drop a URL and it becomes a portal anyone can fly through.
            </p>
          </motion.form>
        </div>

          {/* Partner row — bottom of the hero slide */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 text-sm text-white/60"
          >
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Built with</span>
            <span>Flight-Master · 3D world</span>
            <span>VIBER · launchpad</span>
            <span>Network School · Forest City</span>
          </motion.div>
        </section>

        {/* Scroll-down hint */}
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/50">
          Scroll for portals ↓
        </div>
      </div>

      {/* ---- SECOND SLIDE: portal showcase ---- */}
      <PortalShowcase />

      <p className="pointer-events-none fixed right-6 bottom-6 z-10 text-[11px] uppercase tracking-[0.3em] text-white/40">
        v1 preview
      </p>
    </main>
  );
}
