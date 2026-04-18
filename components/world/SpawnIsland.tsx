"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";

/**
 * The starting island. Positioned south of the main NS island so the player
 * spawns LOOKING AT IT — the NS resort, the satellite islands, and the
 * balloons all visible in the distance from the pad.
 *
 * - Compact circular landform so it reads as a "departure" island
 * - Big square landing pad on top with a pulsing "VIBER · DEPART" marker
 * - A few palms and a low welcome arch
 *
 * World coords: centered at SPAWN_ISLAND_POS, top surface y ≈ ISLAND_TOP_Y.
 * Aircraft spawn is anchored to those constants in Airplane.tsx.
 */

export const SPAWN_ISLAND_POS: [number, number, number] = [0, 0, 280];
export const ISLAND_TOP_Y = 18; // top of the island disc
export const PAD_Y = ISLAND_TOP_Y + 0.4; // walking surface

export function SpawnIsland() {
  const padTexture = useMemo(makePadTexture, []);

  return (
    <group position={SPAWN_ISLAND_POS}>
      {/* Island disc — flat-topped, beach edge, dark underside */}
      <IslandDisc />

      {/* Landing pad printed on top */}
      <mesh position={[0, PAD_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 18]} />
        <meshBasicMaterial map={padTexture} toneMapped={false} />
      </mesh>

      {/* Pulsing pad lights — four corners */}
      <PadLight x={-12} z={-7} />
      <PadLight x={12} z={-7} />
      <PadLight x={-12} z={7} />
      <PadLight x={12} z={7} />

      {/* "DEPART" arch behind the pad so it reads from the cockpit */}
      <DepartArch />

      {/* Small airport apron — a few parked aircraft sitting on taxiway tiles
          off to the left (and right) of the main pad, rotated slightly for a
          staggered parking look. */}
      <ParkedAircraft position={[-24, PAD_Y, -4]} rotation={0.25} accent="#ff6a3d" />
      <ParkedAircraft position={[-26, PAD_Y, 10]} rotation={-0.35} accent="#f7c948" />
      <ParkedAircraft position={[25, PAD_Y, -4]} rotation={-0.25} accent="#68f0ff" />
      <ParkedAircraft position={[27, PAD_Y, 10]} rotation={0.35} accent="#b89cf2" />

      {/* Control tower — small, tucked behind the pad */}
      <ControlTower position={[-32, PAD_Y, 18]} />

      {/* Terminal shed next to the control tower */}
      <TerminalShed position={[-20, PAD_Y, 22]} />

      {/* Palms ringing the island */}
      {[
        [22, 4],
        [-22, 4],
        [12, 26],
        [-12, 26],
      ].map(([x, z], i) => (
        <Palm key={i} position={[x, ISLAND_TOP_Y, z]} />
      ))}

      {/* A small sign post by the arch */}
      <SignPost />
    </group>
  );
}

function IslandDisc() {
  return (
    <group>
      {/* Top disc — green */}
      <mesh position={[0, ISLAND_TOP_Y - 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[34, 34, 2, 48]} />
        <meshStandardMaterial color="#a3c98a" roughness={0.95} />
      </mesh>
      {/* Sand ring just below the lip */}
      <mesh position={[0, ISLAND_TOP_Y - 2.4, 0]}>
        <cylinderGeometry args={[36, 36, 1.2, 48]} />
        <meshStandardMaterial color="#e9d4a8" roughness={0.95} />
      </mesh>
      {/* Tapered base — stone underside */}
      <mesh position={[0, ISLAND_TOP_Y - 11, 0]} castShadow>
        <coneGeometry args={[36, 18, 48, 1, true]} />
        <meshStandardMaterial color="#8c7b68" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function PadLight({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.intensity = 1.2 + Math.sin(state.clock.getElapsedTime() * 4 + x) * 0.4;
  });
  return (
    <group position={[x, PAD_Y + 0.05, z]}>
      <mesh>
        <sphereGeometry args={[0.4, 10, 10]} />
        <meshBasicMaterial color="#68f0ff" toneMapped={false} />
      </mesh>
      <pointLight ref={ref} color="#68f0ff" intensity={1.4} distance={6} />
    </group>
  );
}

/**
 * "DEPART" arch — two pylons + crossbeam with cyan trim. Behind the player
 * on spawn so it doesn't block the view of the NS island.
 */
function DepartArch() {
  return (
    <group position={[0, PAD_Y, 18]}>
      {/* Pylons */}
      {[-9, 9].map((x, i) => (
        <mesh key={i} position={[x, 4, 0]} castShadow>
          <boxGeometry args={[1.2, 8, 1.2]} />
          <meshStandardMaterial color="#0b1520" />
        </mesh>
      ))}
      {/* Crossbeam */}
      <mesh position={[0, 8.4, 0]} castShadow>
        <boxGeometry args={[20, 0.8, 1.2]} />
        <meshStandardMaterial color="#0b1520" />
      </mesh>
      {/* Glowing edge */}
      <mesh position={[0, 8.85, 0]}>
        <boxGeometry args={[20.4, 0.12, 1.4]} />
        <meshStandardMaterial color="#68f0ff" emissive="#68f0ff" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 8, 0]} color="#68f0ff" intensity={2} distance={20} />
    </group>
  );
}

function SignPost() {
  const tex = useMemo(makeSignTexture, []);
  return (
    <group position={[14, PAD_Y + 0.2, 12]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.25, 3, 0.25]} />
        <meshStandardMaterial color="#0b1520" />
      </mesh>
      <Billboard position={[0, 3.4, 0]}>
        <mesh>
          <planeGeometry args={[3.6, 1.4]} />
          <meshBasicMaterial map={tex} transparent toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

/**
 * A small parked variant of the player aircraft. Stationary — no controls,
 * no engine glow. Just a silhouette to suggest a busy airport apron.
 */
function ParkedAircraft({
  position,
  rotation = 0,
  accent = "#68f0ff",
}: {
  position: [number, number, number];
  rotation?: number;
  accent?: string;
}) {
  const HULL = "#e9edf2";
  const HULL_DARK = "#9aa3ad";
  const GLASS = "#0c2030";

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={1.4}>
      {/* Tile under the aircraft to ground it visually */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#2a3038" roughness={0.95} />
      </mesh>

      {/* Nose cone */}
      <mesh castShadow position={[0, 0.6, -1.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 2.4, 16]} />
        <meshStandardMaterial color={HULL} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rear body */}
      <mesh castShadow position={[0, 0.6, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 1.8, 16]} />
        <meshStandardMaterial color={HULL} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Belly */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.15, 2.6]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Cockpit canopy */}
      <mesh position={[0, 0.85, -0.25]}>
        <sphereGeometry args={[0.28, 12, 8, 0, Math.PI]} />
        <meshStandardMaterial color={GLASS} metalness={0.2} roughness={0.15} transparent opacity={0.7} />
      </mesh>
      {/* Wings */}
      <mesh position={[-0.7, 0.55, 0.05]} rotation={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.7]} />
        <meshStandardMaterial color={HULL} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.7, 0.55, 0.05]} rotation={[0, -0.45, 0]} castShadow>
        <boxGeometry args={[1.6, 0.06, 0.7]} />
        <meshStandardMaterial color={HULL} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Tail fin */}
      <mesh position={[0, 0.95, 1.0]} castShadow>
        <boxGeometry args={[0.04, 0.45, 0.6]} />
        <meshStandardMaterial color={HULL_DARK} />
      </mesh>
      {/* Accent fin trim — color varies per aircraft so the apron looks lively */}
      <mesh position={[0, 1.18, 1.0]}>
        <boxGeometry args={[0.05, 0.04, 0.5]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.3} toneMapped={false} />
      </mesh>
      {/* Wheels — tiny black cylinders */}
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, 0.18, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.18, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0, 0.18, -0.9]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.16, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

/**
 * A short cylindrical control tower with a glass cabin on top + a blinking
 * red beacon. Sized small so it doesn't dwarf the pad.
 */
function ControlTower({ position }: { position: [number, number, number] }) {
  const beacon = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!beacon.current) return;
    beacon.current.intensity = 1.6 + Math.sin(state.clock.getElapsedTime() * 6) * 1.4;
  });
  return (
    <group position={position}>
      {/* Concrete base */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.4, 2, 12]} />
        <meshStandardMaterial color="#cbc4b3" />
      </mesh>
      {/* Stalk */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.9, 5, 12]} />
        <meshStandardMaterial color="#f3ede3" />
      </mesh>
      {/* Cabin (glass) */}
      <mesh position={[0, 7.6, 0]} castShadow>
        <cylinderGeometry args={[1.6, 1.4, 1.2, 16]} />
        <meshStandardMaterial color="#1b2b3a" metalness={0.4} roughness={0.15} transparent opacity={0.65} />
      </mesh>
      {/* Cabin frame — rotation belongs on the mesh, not the geometry */}
      <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.07, 8, 24]} />
        <meshStandardMaterial color="#0b1520" />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 8.4, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 0.18, 16]} />
        <meshStandardMaterial color="#0b1520" />
      </mesh>
      {/* Beacon */}
      <mesh position={[0, 8.7, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial color="#ff4a4a" toneMapped={false} />
      </mesh>
      <pointLight ref={beacon} position={[0, 8.7, 0]} color="#ff4a4a" intensity={1.6} distance={14} />
      {/* Warm interior */}
      <pointLight position={[0, 7.6, 0]} color="#ffd48a" intensity={1.0} distance={6} />
    </group>
  );
}

/**
 * Tiny terminal building / hangar by the apron.
 */
function TerminalShed({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main box */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 3, 5]} />
        <meshStandardMaterial color="#fbfaf6" />
      </mesh>
      {/* Front glazing */}
      <mesh position={[0, 1.5, 2.51]}>
        <planeGeometry args={[8.5, 2]} />
        <meshStandardMaterial color="#1b2b3a" transparent opacity={0.7} metalness={0.3} roughness={0.15} />
      </mesh>
      {/* Roof slab */}
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[10.6, 0.2, 5.6]} />
        <meshStandardMaterial color="#c9bfaa" />
      </mesh>
      {/* Sign — simple yellow strip */}
      <mesh position={[0, 2.7, 2.55]}>
        <boxGeometry args={[6, 0.4, 0.06]} />
        <meshStandardMaterial color="#f7c948" emissive="#f7c948" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {/* Warm interior glow */}
      <pointLight position={[0, 1.5, 1]} color="#ffd48a" intensity={1.2} distance={8} />
    </group>
  );
}

function Palm({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.32, 5, 8]} />
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
            <coneGeometry args={[0.32, 2.2, 6]} />
            <meshStandardMaterial color="#55a04a" flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

function makePadTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 900;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture(c);

  // Asphalt base
  ctx.fillStyle = "#1d242c";
  ctx.fillRect(0, 0, c.width, c.height);

  // Border stripes
  ctx.strokeStyle = "#f7c948";
  ctx.lineWidth = 14;
  ctx.strokeRect(30, 30, c.width - 60, c.height - 60);

  // Inner dashed safety zone
  ctx.strokeStyle = "#f7c948";
  ctx.lineWidth = 6;
  ctx.setLineDash([24, 18]);
  ctx.strokeRect(80, 80, c.width - 160, c.height - 160);
  ctx.setLineDash([]);

  // Big H circle
  const cx = c.width / 2;
  const cy = c.height / 2 + 30;
  ctx.beginPath();
  ctx.arc(cx, cy, 200, 0, Math.PI * 2);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#f7f3e8";
  ctx.stroke();

  // H glyph
  ctx.fillStyle = "#f7f3e8";
  ctx.font = "900 280px Inter, -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H", cx, cy + 8);

  // VIBER · DEPART text at top
  ctx.fillStyle = "#f7c948";
  ctx.font = "700 56px Inter, -apple-system, system-ui, sans-serif";
  ctx.fillText("VIBER  ·  DEPART", cx, 130);

  // Arrow arrows pointing toward the NS island (down on the texture, since
  // the pad's -Z direction points at NS in world space).
  ctx.fillStyle = "#68f0ff";
  ctx.font = "900 64px Inter, -apple-system, system-ui, sans-serif";
  ctx.fillText("▼", cx - 240, c.height - 90);
  ctx.fillText("▼", cx, c.height - 90);
  ctx.fillText("▼", cx + 240, c.height - 90);

  // Bottom small label
  ctx.fillStyle = "#f7c948";
  ctx.font = "600 36px Inter, -apple-system, system-ui, sans-serif";
  ctx.fillText("→  NETWORK SCHOOL", cx, c.height - 36);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function makeSignTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 720;
  c.height = 280;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture(c);

  ctx.fillStyle = "rgba(11,21,32,0.92)";
  roundRect(ctx, 0, 0, c.width, c.height, 28);
  ctx.fill();

  ctx.strokeStyle = "#68f0ff";
  ctx.lineWidth = 3;
  roundRect(ctx, 1.5, 1.5, c.width - 3, c.height - 3, 28);
  ctx.stroke();

  ctx.fillStyle = "#f7c948";
  ctx.font = "700 38px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VIBER TERMINAL", c.width / 2, 90);

  ctx.fillStyle = "#f7f3e8";
  ctx.font = "500 30px Inter, system-ui, sans-serif";
  ctx.fillText("Throttle up (W)", c.width / 2, 160);
  ctx.fillStyle = "#68f0ff";
  ctx.font = "500 26px Inter, system-ui, sans-serif";
  ctx.fillText("Fly forward to reach Network School", c.width / 2, 210);

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
