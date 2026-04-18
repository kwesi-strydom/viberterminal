"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Scene } from "./Scene";
import { HUD } from "./HUD";
import { PortalToast } from "./PortalToast";
import { useWorld } from "@/lib/stores/useWorld";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CONTROLS = [
  { name: "throttleUp", keys: ["KeyW"] },
  { name: "throttleDown", keys: ["KeyS"] },
  { name: "brake", keys: ["KeyZ"] },
  { name: "pitchUp", keys: ["ArrowUp"] },
  { name: "pitchDown", keys: ["ArrowDown"] },
  { name: "rollLeft", keys: ["ArrowLeft"] },
  { name: "rollRight", keys: ["ArrowRight"] },
  { name: "yawLeft", keys: ["KeyA"] },
  { name: "yawRight", keys: ["KeyD"] },
  { name: "turbo", keys: ["ShiftLeft", "ShiftRight"] },
  { name: "toggleCamera", keys: ["KeyV"] },
];

export default function World() {
  const { fetchPortals } = useWorld();
  const [started, setStarted] = useState(false);
  const params = useSearchParams();

  // Resolve explorer name: URL ?name=... overrides localStorage, which
  // overrides empty. The landing page persists localStorage on submit.
  const initialName = useMemo(() => {
    const fromUrl = params.get("name")?.trim();
    if (fromUrl) return fromUrl;
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("viber.explorerName") ?? "";
      } catch {
        return "";
      }
    }
    return "";
  }, [params]);

  useEffect(() => {
    fetchPortals();
  }, [fetchPortals]);

  if (!started) {
    return <PreflightOverlay initialName={initialName} onStart={() => setStarted(true)} />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <KeyboardControls map={CONTROLS}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 60, 120], fov: 55, near: 0.5, far: 2000 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Scene />
        </Canvas>
        <HUD />
        <PortalToast />
      </KeyboardControls>

      {/* Back link */}
      <Link
        href="/"
        className="absolute left-4 top-4 z-40 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-white/30"
      >
        ← back
      </Link>
    </div>
  );
}

function PreflightOverlay({
  initialName,
  onStart,
}: {
  initialName: string;
  onStart: () => void;
}) {
  const [name, setName] = useState(initialName);

  function handleStart() {
    if (name.trim()) {
      try {
        localStorage.setItem("viber.explorerName", name.trim());
      } catch {}
    }
    onStart();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sky-gradient p-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/50 bg-white/70 p-8 shadow-2xl backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-900/60">Viber Terminal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900">
          {name ? `Welcome, ${name}` : "Preflight"}
        </h1>
        <p className="mt-3 text-ink-900/75">
          You&apos;ll spawn above the islands in your craft. Fly through a glowing
          portal to open the app it points to. Press <kbd className="kbd-light">V</kbd> to
          toggle camera, <kbd className="kbd-light">Z</kbd> to brake.
        </p>

        {!initialName && (
          <label className="mt-5 block">
            <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-900/60">
              Explorer name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              maxLength={24}
              placeholder="e.g. Maverick"
              autoFocus
              className="mt-1 w-full rounded-xl border border-ink-900/15 bg-white px-4 py-2.5 text-ink-900 outline-none focus:border-ink-900/40"
            />
          </label>
        )}

        <ul className="mt-5 grid grid-cols-2 gap-2 text-sm text-ink-900/80">
          <li><kbd className="kbd">W</kbd> / <kbd className="kbd">S</kbd> — throttle</li>
          <li><kbd className="kbd">Z</kbd> — brakes</li>
          <li><kbd className="kbd">↑</kbd> / <kbd className="kbd">↓</kbd> — pitch</li>
          <li><kbd className="kbd">←</kbd> / <kbd className="kbd">→</kbd> — roll</li>
          <li><kbd className="kbd">A</kbd> / <kbd className="kbd">D</kbd> — yaw</li>
          <li><kbd className="kbd">Shift</kbd> — turbo</li>
          <li><kbd className="kbd">V</kbd> — camera</li>
        </ul>
        <button
          onClick={handleStart}
          className="mt-8 w-full rounded-full bg-ink-900 py-3 text-ink-50 transition hover:bg-ink-900/90"
        >
          {name ? "Start exploring" : "Take off"}
        </button>
      </div>
      <style jsx global>{`
        .kbd, .kbd-light {
          display: inline-block;
          padding: 1px 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          color: #fbf8f2;
          background: #0f1115;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
