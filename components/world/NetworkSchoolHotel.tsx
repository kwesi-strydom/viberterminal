"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";

/**
 * The Network School resort + city, on top of the main island.
 *
 * Layout (z grows away from the viewer at spawn):
 *
 *      row of high-rise residential towers (7)
 *      ─────────────────────────────────────────────
 *      mid-rise condo row (4)
 *      ─────────────────────────────────────────────
 *      flanking curved tower — LOBBY (wave roof) — flanking curved tower
 *      ─────────────────────────────────────────────
 *      pool · palm ring · big NS logo ground pad · entrance
 *
 * The whole ensemble gives the "Forest City" silhouette: a cluster of
 * towers behind a curated low-rise resort with a signature lobby.
 *
 * Everything is procedural — no GLTF. Swap the canvas NS logo for the real
 * PNG by dropping it at /public/ns-logo.png; we check that before falling
 * back to the canvas texture.
 */

export function NetworkSchoolHotel() {
  // Canvas-generated NS logo (always available as a fallback)
  const signTexture = useMemo(() => makeNSLogoTexture(), []);
  // Ground pad variant (square, bigger margin)
  const padTexture = useMemo(() => makeNSGroundPadTexture(), []);

  return (
    <group position={[0, 22, 0]}>
      {/* ---------- BACKGROUND HIGH-RISE ROW ---------- */}
      <ResidentialRow />

      {/* ---------- MID-RISE CONDO ROW ---------- */}
      <CondoRow />

      {/* ---------- FLANKING CURVED TOWERS ---------- */}
      <ResidentialTower x={-36} z={-4} height={32} radius={22} />
      <ResidentialTower x={36} z={-4} height={32} radius={22} facing={-1} />

      {/* ---------- CENTRAL WAVE-ROOF LOBBY ---------- */}
      <Lobby />

      {/* ---------- FRONT TERRACE + POOL + PALMS + LOGO PAD ---------- */}

      {/* Wide podium terrace out to the beach */}
      <mesh receiveShadow position={[0, 0.1, 18]}>
        <boxGeometry args={[74, 0.4, 16]} />
        <meshStandardMaterial color="#d6cebf" roughness={0.9} />
      </mesh>

      {/* Curved pool flanking the logo pad */}
      <mesh position={[-24, 0.2, 18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#4fc8e0" metalness={0.2} roughness={0.15} emissive="#1a6a80" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[24, 0.2, 18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 5]} />
        <meshStandardMaterial color="#4fc8e0" metalness={0.2} roughness={0.15} emissive="#1a6a80" emissiveIntensity={0.18} />
      </mesh>

      {/* BIG NS LOGO GROUND PAD — centered in front of the entrance */}
      <GroundLogoPad texture={padTexture} />

      {/* Small free-standing NS sign by the entrance too */}
      <FrontSign texture={signTexture} />

      {/* Palm borders */}
      {[-34, -28, -22, -16, 16, 22, 28, 34].map((x, i) => (
        <PalmTree key={i} position={[x, 0, 24]} />
      ))}
      {[-36, 36].map((x, i) => (
        <PalmTree key={`s-${i}`} position={[x, 0, 6]} />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   GROUND LOGO PAD — big NS logo printed on the ground                   */
/* ----------------------------------------------------------------------- */

function GroundLogoPad({ texture }: { texture: THREE.Texture }) {
  // Slight emissive lift so the pad reads at dawn/dusk tones
  return (
    <group position={[0, 0.35, 14]}>
      {/* Dark inset border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 11]} />
        <meshStandardMaterial color="#0b1520" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Logo plate, slightly inset */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[20.5, 9.8]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Warm accent lights on the four corners */}
      {[[-10, -4.5], [10, -4.5], [-10, 4.5], [10, 4.5]].map(([x, z], i) => (
        <pointLight key={i} position={[x, 0.8, z]} color="#68f0ff" intensity={0.8} distance={6} />
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   CENTRAL LOBBY — wave-roof low-rise (bigger now)                       */
/* ----------------------------------------------------------------------- */

function Lobby() {
  const archCount = 7;
  const archW = 5.4;
  const archH = 3.4;
  const archDepth = 14;
  const totalW = archCount * archW;

  return (
    <group position={[0, 0, 6]}>
      {/* Main lobby box */}
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <boxGeometry args={[totalW, 5, archDepth]} />
        <meshStandardMaterial color="#fbfaf6" roughness={0.75} />
      </mesh>

      {/* Glass front */}
      <mesh position={[0, 2.8, archDepth / 2 + 0.01]}>
        <planeGeometry args={[totalW - 1.5, 4]} />
        <meshStandardMaterial color="#1b2b3a" metalness={0.3} roughness={0.12} transparent opacity={0.78} />
      </mesh>

      {/* Warm interior glow */}
      <pointLight position={[0, 2.5, archDepth / 2 - 1]} color="#ffd48a" intensity={2.8} distance={26} />
      <pointLight position={[-12, 2.5, archDepth / 2 - 1]} color="#ffd48a" intensity={2.2} distance={20} />
      <pointLight position={[12, 2.5, archDepth / 2 - 1]} color="#ffd48a" intensity={2.2} distance={20} />

      {/* Wave-roof arches */}
      {Array.from({ length: archCount }).map((_, i) => {
        const x = (i - (archCount - 1) / 2) * archW;
        return <RoofArch key={i} x={x} width={archW} height={archH} depth={archDepth} />;
      })}

      {/* Canopy strip in front */}
      <mesh position={[0, 5.1, 0]}>
        <boxGeometry args={[totalW + 0.6, 0.2, archDepth + 0.6]} />
        <meshStandardMaterial color="#e6e0d3" />
      </mesh>
    </group>
  );
}

function RoofArch({ x, width, height, depth }: { x: number; width: number; height: number; depth: number }) {
  const r = width / 2;
  return (
    <mesh position={[x, 5.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[r, r, depth, 24, 1, true, 0, Math.PI]} />
      <meshStandardMaterial color="#fbfaf6" side={THREE.DoubleSide} roughness={0.55} metalness={0.05} />
    </mesh>
  );
}

/* ----------------------------------------------------------------------- */
/*   RESIDENTIAL TOWER — curved slab in plan                               */
/* ----------------------------------------------------------------------- */

function ResidentialTower({
  x,
  z,
  height = 32,
  radius = 22,
  facing = 1,
}: {
  x: number;
  z: number;
  height?: number;
  radius?: number;
  facing?: 1 | -1;
}) {
  const theta = 0.9;
  return (
    <group position={[x, 0, z]} rotation={[0, facing === -1 ? Math.PI : 0, 0]}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius, height, 40, 1, true, -theta / 2, theta]} />
        <meshStandardMaterial color="#efe7d6" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: Math.floor(height / 3.2) }).map((_, i) => {
        const y = 3.2 + i * 3.2;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <cylinderGeometry args={[radius + 0.05, radius + 0.05, 1.4, 40, 1, true, -theta / 2, theta]} />
            <meshStandardMaterial color="#2a6b80" emissive="#ffd48a" emissiveIntensity={0.55} side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
        );
      })}
      {/* Cap */}
      <mesh position={[0, height + 0.15, 0]}>
        <cylinderGeometry args={[radius + 0.2, radius + 0.2, 0.3, 40, 1, false, -theta / 2, theta]} />
        <meshStandardMaterial color="#c9bfaa" />
      </mesh>
      {/* Rooftop block */}
      <mesh position={[0, height + 1.5, radius - 4]} castShadow>
        <boxGeometry args={[4, 2, 3]} />
        <meshStandardMaterial color="#d8d1be" />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   BACKGROUND HIGH-RISE ROW — the Forest City silhouette behind          */
/* ----------------------------------------------------------------------- */

function ResidentialRow() {
  // 7 towers of varied heights along the back of the island
  const towers = [
    { x: -56, h: 50, w: 10, d: 12 },
    { x: -40, h: 68, w: 11, d: 13 },
    { x: -24, h: 58, w: 10, d: 12 },
    { x: -8, h: 72, w: 12, d: 14 },
    { x: 10, h: 64, w: 11, d: 13 },
    { x: 28, h: 78, w: 12, d: 14 },
    { x: 46, h: 60, w: 10, d: 12 },
    { x: 62, h: 52, w: 10, d: 12 },
  ];

  return (
    <group position={[0, 0, -36]}>
      {towers.map((t, i) => (
        <HighRise key={i} x={t.x} height={t.h} width={t.w} depth={t.d} />
      ))}
    </group>
  );
}

function HighRise({ x, height, width, depth }: { x: number; height: number; width: number; depth: number }) {
  // Slender high-rise with horizontal window bands
  const bands = Math.floor(height / 2.4);
  return (
    <group position={[x, 0, 0]}>
      {/* Tower body */}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#e6ddcb" roughness={0.8} />
      </mesh>
      {/* Horizontal window bands on front */}
      {Array.from({ length: bands }).map((_, i) => {
        const y = 3 + i * 2.4;
        return (
          <mesh key={i} position={[0, y, depth / 2 + 0.02]}>
            <planeGeometry args={[width * 0.88, 1.1]} />
            <meshStandardMaterial color="#2a4a5a" emissive="#ffd48a" emissiveIntensity={0.5} transparent opacity={0.92} />
          </mesh>
        );
      })}
      {/* Side bands */}
      {Array.from({ length: bands }).map((_, i) => {
        const y = 3 + i * 2.4;
        return (
          <mesh key={`l-${i}`} position={[-width / 2 - 0.02, y, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[depth * 0.8, 1.1]} />
            <meshStandardMaterial color="#2a4a5a" emissive="#ffd48a" emissiveIntensity={0.35} transparent opacity={0.9} />
          </mesh>
        );
      })}
      {Array.from({ length: bands }).map((_, i) => {
        const y = 3 + i * 2.4;
        return (
          <mesh key={`r-${i}`} position={[width / 2 + 0.02, y, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[depth * 0.8, 1.1]} />
            <meshStandardMaterial color="#2a4a5a" emissive="#ffd48a" emissiveIntensity={0.35} transparent opacity={0.9} />
          </mesh>
        );
      })}
      {/* Rooftop crown */}
      <mesh position={[0, height + 0.6, 0]}>
        <boxGeometry args={[width * 0.85, 1.2, depth * 0.85]} />
        <meshStandardMaterial color="#bfb4a0" />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   CONDO ROW — mid-rise buildings between lobby and high-rises           */
/* ----------------------------------------------------------------------- */

function CondoRow() {
  const condos = [
    { x: -46, h: 16, w: 14 },
    { x: -18, h: 18, w: 16 },
    { x: 14, h: 16, w: 16 },
    { x: 42, h: 20, w: 14 },
  ];

  return (
    <group position={[0, 0, -18]}>
      {condos.map((c, i) => (
        <Condo key={i} x={c.x} height={c.h} width={c.w} />
      ))}
    </group>
  );
}

function Condo({ x, height, width }: { x: number; height: number; width: number }) {
  const depth = 11;
  const floors = Math.floor(height / 3);
  return (
    <group position={[x, 0, 0]}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#f5efe0" roughness={0.85} />
      </mesh>
      {/* Balcony bands */}
      {Array.from({ length: floors }).map((_, i) => {
        const y = 3 + i * 3;
        return (
          <mesh key={i} position={[0, y, depth / 2 + 0.15]}>
            <boxGeometry args={[width * 0.9, 0.3, 0.4]} />
            <meshStandardMaterial color="#7b9b7c" />
          </mesh>
        );
      })}
      {/* Pitched-ish cap */}
      <mesh position={[0, height + 0.4, 0]}>
        <boxGeometry args={[width + 0.4, 0.8, depth + 0.4]} />
        <meshStandardMaterial color="#c2ad85" />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   FRONT SIGN — compact NS sign by the entrance                          */
/* ----------------------------------------------------------------------- */

function FrontSign({ texture }: { texture: THREE.Texture }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.05 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.05;
  });
  return (
    <group ref={ref} position={[0, 0.05, 28]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[6, 0.5, 1]} />
        <meshStandardMaterial color="#0b1520" />
      </mesh>
      {[-2.4, 2.4].map((px, i) => (
        <mesh key={i} position={[px, 2, 0]} castShadow>
          <boxGeometry args={[0.3, 3.5, 0.3]} />
          <meshStandardMaterial color="#0b1520" />
        </mesh>
      ))}
      <Billboard position={[0, 4, 0]}>
        <mesh>
          <planeGeometry args={[7, 2.4]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
        <pointLight color="#68f0ff" intensity={1.2} distance={12} position={[0, 0, 1]} />
      </Billboard>
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   PALMS                                                                 */
/* ----------------------------------------------------------------------- */

function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 5, 8]} />
        <meshStandardMaterial color="#6b4a2b" roughness={0.9} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 1.3, 5.4, Math.sin(a) * 1.3]}
            rotation={[Math.PI / 2.4, 0, a + Math.PI / 2]}
            castShadow
          >
            <coneGeometry args={[0.35, 2.4, 6]} />
            <meshStandardMaterial color="#55a04a" flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   NS LOGO TEXTURES — approximates the real navy serif wordmark          */
/* ----------------------------------------------------------------------- */

/**
 * Sign-panel variant — wide horizontal logo for the free-standing sign and
 * the roof sign. Dark navy serif wordmark with a small flag + cross mark
 * on the left, mirroring the attached reference image.
 */
function makeNSLogoTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 340;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture(c);

  // Cream background
  ctx.fillStyle = "#fbf8f2";
  ctx.fillRect(0, 0, c.width, c.height);

  drawNSLogo(ctx, c.width, c.height, 1);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Ground-pad variant — square-ish aspect, bigger padding, cream inset with
 * a dark border that reads well from 60–80m up.
 */
function makeNSGroundPadTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture(c);

  // Dark border / outer
  ctx.fillStyle = "#0b1520";
  ctx.fillRect(0, 0, c.width, c.height);

  // Cream inset
  const pad = 60;
  ctx.fillStyle = "#fbf8f2";
  ctx.fillRect(pad, pad, c.width - pad * 2, c.height - pad * 2);

  // Logo centered, scaled larger
  drawNSLogo(ctx, c.width, c.height, 1.8);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Shared drawing routine for the navy serif "Network School" wordmark
 * with a compact flag+cross mark on the left.
 */
function drawNSLogo(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number) {
  const NAVY = "#0e1e33";

  // Layout: the whole wordmark is vertically centered.
  // Flag icon sits to the left; wordmark to the right.
  const baseH = 190 * scale;
  const centerY = h / 2;

  // Total desired logo block width
  const totalW = Math.min(w * 0.82, 1500 * scale);
  const blockLeft = (w - totalW) / 2;

  // ---- Flag + cross mark ----
  const flagW = baseH * 0.55;
  const flagH = baseH * 0.95;
  const flagX = blockLeft;
  const flagY = centerY - flagH / 2;

  // Pole
  ctx.fillStyle = NAVY;
  ctx.fillRect(flagX, flagY, baseH * 0.08, flagH);
  // Flag body (a simple trapezoid)
  ctx.beginPath();
  ctx.moveTo(flagX + baseH * 0.08, flagY);
  ctx.lineTo(flagX + flagW, flagY);
  ctx.lineTo(flagX + flagW - baseH * 0.1, flagY + flagH * 0.55);
  ctx.lineTo(flagX + baseH * 0.08, flagY + flagH * 0.55);
  ctx.closePath();
  ctx.fill();
  // White cross on the flag
  ctx.fillStyle = "#fbf8f2";
  const cx = flagX + baseH * 0.08 + (flagW - baseH * 0.1) * 0.5;
  const cy = flagY + flagH * 0.28;
  const cSize = baseH * 0.28;
  ctx.fillRect(cx - cSize * 0.12, cy - cSize * 0.5, cSize * 0.24, cSize);
  ctx.fillRect(cx - cSize * 0.5, cy - cSize * 0.12, cSize, cSize * 0.24);

  // ---- Wordmark ----
  ctx.fillStyle = NAVY;
  // Canvas's font descriptor supports "normal"/"bold"/numeric weights; we
  // stick to the safe end (plain weight) since not all browsers honor 500.
  const fontSize = Math.round(baseH * 0.85);
  ctx.font = `${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const textX = flagX + flagW + baseH * 0.35;
  ctx.fillText("Network School", textX, centerY + fontSize * 0.02);
}
