"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import type { PublicPortal } from "@/lib/db/schema";
import { useWorld } from "@/lib/stores/useWorld";
import { useFlight } from "@/lib/stores/useFlight";

const COOLDOWN_MS = 6000;

/**
 * A portal is now a neon-framed billboard with a SCREEN showing the app
 * preview, plus a glowing torus ring in front of it as the fly-through
 * target. The whole assembly faces the camera so it's always readable.
 *
 * Hierarchy:
 *   group @ world position
 *     Billboard (auto face-camera)
 *       ├ screen plane (thumbnail or generated fallback)
 *       ├ four neon edge bars (emissive)
 *       ├ nameplate bar (DOM via drei Html? no — CanvasTexture, no CDN font)
 *       └ two corner brackets for the arcade-marquee vibe
 *     Torus ring       (the fly-through target)
 *     Particles        (small orbs around the portal)
 *     pointLight       (portal-colored local light)
 *
 * Fly-through collision is still a simple sphere distance check against the
 * ring's center, same as before.
 */

const SCREEN_W = 22; // world units
const SCREEN_H = 13; // ~16:9-ish

export function Portal({ portal }: { portal: PublicPortal }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const openPortal = useWorld((s) => s.openPortal);
  const [lastEnteredAt, setLastEnteredAt] = useState(0);

  // Build a CanvasTexture fallback showing the portal name + initial letter.
  // No external fonts, no CDN calls — safe for dev.
  const fallbackTexture = useMemo(() => makeScreenTexture(portal), [portal.name, portal.color, portal.url]);
  const marqueeTexture = useMemo(() => makeMarqueeTexture(portal.name), [portal.name]);

  // Resilient remote thumbnail loader — always returns a texture to render.
  // Starts with the canvas fallback, replaces with the loaded image on
  // success, keeps the fallback on error. No suspense → a single 404 / CORS
  // failure can't crash the rest of the scene.
  const displayTexture = useResilientThumbnail(portal.thumbnailUrl, fallbackTexture);

  useFrame((_, delta) => {
    if (!group.current) return;

    // Slow rotation on the ring only (the billboard faces camera on its own)
    if (ring.current) {
      ring.current.rotation.z += delta * 0.6;
      const t = performance.now() * 0.001;
      const s = 1 + Math.sin(t * 2 + portal.x) * 0.04;
      ring.current.scale.set(s, s, 1);
    }

    // Collision with the DeLorean
    const { position } = useFlight.getState();
    const d = position.distanceTo(new THREE.Vector3(portal.x, portal.y, portal.z));

    const now = Date.now();
    if (d < portal.radius && now - lastEnteredAt > COOLDOWN_MS) {
      setLastEnteredAt(now);
      openPortal(portal);
    }
  });

  const color = new THREE.Color(portal.color);
  const neon = portal.color;

  return (
    <group ref={group} position={[portal.x, portal.y, portal.z]}>
      {/* Everything visual is billboarded so it always presents cleanly to the
          camera — screen, ring, neon frame, marquee, orbs. Collision is
          sphere-based, so billboarding doesn't affect fly-through. */}
      <Billboard>
        {/* Screen — pushed slightly back so the ring sits in front of it. */}
        <group position={[0, 0, -0.4]}>
          <mesh>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial map={displayTexture} toneMapped={false} />
          </mesh>
        </group>

        {/* Neon frame — four emissive bars around the screen */}
        <NeonFrame color={neon} w={SCREEN_W} h={SCREEN_H} />

        {/* Top marquee: portal name plate */}
        <mesh position={[0, SCREEN_H / 2 + 1.6, 0.25]}>
          <planeGeometry args={[SCREEN_W * 0.55, 2.2]} />
          <meshBasicMaterial map={marqueeTexture} transparent toneMapped={false} />
        </mesh>

        {/* Corner brackets */}
        <CornerBracket x={-SCREEN_W / 2} y={-SCREEN_H / 2} color={neon} />
        <CornerBracket x={SCREEN_W / 2} y={-SCREEN_H / 2} color={neon} flip />
        <CornerBracket x={-SCREEN_W / 2} y={SCREEN_H / 2} color={neon} vflip />
        <CornerBracket x={SCREEN_W / 2} y={SCREEN_H / 2} color={neon} flip vflip />

        {/* Fly-through torus ring — in front of the screen */}
        <mesh ref={ring} position={[0, 0, 0.6]}>
          <torusGeometry args={[portal.radius, 1.4, 16, 64]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.4}
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={0.95}
            toneMapped={false}
          />
        </mesh>

        {/* Inner swirl */}
        <mesh position={[0, 0, 0.65]}>
          <torusGeometry args={[portal.radius * 0.65, 0.5, 10, 48]} />
          <meshBasicMaterial color="white" transparent opacity={0.55} toneMapped={false} />
        </mesh>

        {/* Orbs orbiting the ring — pseudo-particles */}
        {Array.from({ length: 14 }).map((_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const r = portal.radius + 0.6 + (i % 3) * 0.4;
          return (
            <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0.6]}>
              <sphereGeometry args={[0.22, 6, 6]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          );
        })}
      </Billboard>

      {/* Portal-colored local lights — outside Billboard so they light the world */}
      <pointLight color={color} intensity={3.5} distance={portal.radius * 6} />
      <pointLight color={color} intensity={2.0} distance={SCREEN_W * 1.2} position={[0, 0, -2]} />
    </group>
  );
}

/**
 * Load a remote thumbnail URL with graceful error handling.
 *
 * Behavior:
 *   - Returns `fallback` immediately on first render (no blank screen).
 *   - When the image loads, swaps to the loaded texture.
 *   - On load error (CORS, 404, decode fail), stays on `fallback` — no throw.
 *
 * This replaces drei's `useTexture(url)` which suspends on error and takes
 * the whole scene down — `Suspense` catches the load, not the rejection.
 */
function useResilientThumbnail(
  url: string | null | undefined,
  fallback: THREE.Texture
): THREE.Texture {
  const [tex, setTex] = useState<THREE.Texture>(fallback);

  // Reset to fallback whenever the URL or fallback changes.
  useEffect(() => {
    setTex(fallback);
    if (!url) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    let alive = true;
    loader.load(
      url,
      (loaded) => {
        if (!alive) return;
        loaded.needsUpdate = true;
        setTex(loaded);
      },
      undefined,
      () => {
        // Silent fallback — keep the canvas texture.
      }
    );

    return () => {
      alive = false;
    };
  }, [url, fallback]);

  return tex;
}

function NeonFrame({ color, w, h }: { color: string; w: number; h: number }) {
  const thickness = 0.4;
  const depth = 0.15;
  const bars: [number, number, number, number][] = [
    // [x, y, width, height]
    [0, h / 2 + thickness / 2, w + thickness * 2, thickness],        // top
    [0, -h / 2 - thickness / 2, w + thickness * 2, thickness],       // bottom
    [-w / 2 - thickness / 2, 0, thickness, h + thickness * 2],       // left
    [w / 2 + thickness / 2, 0, thickness, h + thickness * 2],        // right
  ];

  return (
    <group>
      {bars.map(([x, y, bw, bh], i) => (
        <mesh key={i} position={[x, y, 0.05]}>
          <boxGeometry args={[bw, bh, depth]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={3.2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function CornerBracket({
  x,
  y,
  color,
  flip,
  vflip,
}: {
  x: number;
  y: number;
  color: string;
  flip?: boolean;
  vflip?: boolean;
}) {
  const len = 2.2;
  const thickness = 0.5;
  const sx = flip ? -1 : 1;
  const sy = vflip ? -1 : 1;

  return (
    <group position={[x, y, 0.12]}>
      <mesh position={[sx * (len / 2 + thickness / 2), 0, 0]}>
        <boxGeometry args={[len, thickness, thickness]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, sy * (len / 2 + thickness / 2), 0]}>
        <boxGeometry args={[thickness, len, thickness]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Generate a fallback "screen" texture for portals without a thumbnail.
 * Draws:
 *   - Dark background
 *   - Big initial letter in portal color
 *   - App name below
 *   - Host domain at the bottom
 */
function makeScreenTexture(portal: PublicPortal): THREE.Texture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = Math.round(size * (SCREEN_H / SCREEN_W));
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture(c);

  // Dark gradient background that hints at the portal color
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#0f1115");
  g.addColorStop(1, withAlpha(portal.color, 0.28));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);

  // Subtle grid
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < c.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  }
  for (let y = 0; y < c.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }

  // Big initial letter
  const initial = (portal.name[0] ?? "?").toUpperCase();
  ctx.fillStyle = portal.color;
  ctx.font = "bold 220px Inter, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = portal.color;
  ctx.shadowBlur = 30;
  ctx.fillText(initial, c.width / 2, c.height / 2 - 10);
  ctx.shadowBlur = 0;

  // Host domain
  let host = "";
  try {
    host = new URL(portal.url).host.replace(/^www\./, "");
  } catch {
    host = portal.url;
  }
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 26px Inter, -apple-system, sans-serif";
  ctx.fillText(host, c.width / 2, c.height - 40);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Separate small texture for the top marquee nameplate.
 */
function makeMarqueeTexture(name: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture(c);

  ctx.fillStyle = "rgba(15,17,21,0.9)";
  const r = 32;
  roundRect(ctx, 0, 0, c.width, c.height, r);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "bold 72px Inter, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, c.width / 2, c.height / 2 + 4);

  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function withAlpha(hex: string, alpha: number): string {
  // Convert #rrggbb to rgba(r,g,b,a)
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
