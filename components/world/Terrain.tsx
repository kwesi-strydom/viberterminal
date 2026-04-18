"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Terrain — two families of land:
 *
 *  1. The MAIN ISLAND is now a Forest-City-shaped land mass: a large flat
 *     disc with a sandy beach ring, a turquoise shallows halo, and only a
 *     few accent trees (the built environment — hotel + towers — covers the
 *     rest). The NetworkSchoolHotel component sits on top of it.
 *
 *  2. The SATELLITE ISLANDS are more mountain-like now — tall peaks with
 *     sharper profiles, mixed tree cover. Some are flatter / plateau-ish,
 *     some spike higher.
 *
 *  The old "cloud sea" plane is replaced with a proper ocean plane in a
 *  richer blue-teal palette.
 */

interface IslandSpec {
  position: [number, number, number];
  radius: number;
  height: number;
  seed: number;
  style: "peak" | "plateau" | "mesa";
  treeCount?: number;
}

const SATELLITES: IslandSpec[] = [
  { position: [-160, 15, -120], radius: 46, height: 40, seed: 2, style: "peak" },
  { position: [170, 25, -80], radius: 54, height: 28, seed: 3, style: "plateau" },
  { position: [90, 45, 160], radius: 38, height: 55, seed: 4, style: "peak" },
  { position: [-140, 55, 140], radius: 42, height: 34, seed: 5, style: "mesa" },
  { position: [240, 65, 50], radius: 34, height: 48, seed: 6, style: "peak" },
  { position: [-230, 75, -30], radius: 36, height: 30, seed: 7, style: "mesa" },
  { position: [40, 85, -250], radius: 30, height: 36, seed: 8, style: "peak" },
];

export function Terrain() {
  return (
    <group>
      <MainIsland />
      {SATELLITES.map((spec, i) => (
        <SatelliteIsland key={i} {...spec} />
      ))}
      <Ocean />
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   MAIN ISLAND — large flat disc + beach ring + shallows halo            */
/* ----------------------------------------------------------------------- */

function MainIsland() {
  const geometry = useMemo(() => buildMainIslandGeometry(), []);

  return (
    <group position={[0, 0, 0]}>
      {/* The land mass */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
      </mesh>

      {/* Shallows halo — turquoise ring around the island just above sea level */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} receiveShadow>
        <ringGeometry args={[92, 130, 64]} />
        <meshStandardMaterial
          color="#6fd8e0"
          transparent
          opacity={0.55}
          roughness={0.1}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function buildMainIslandGeometry(): THREE.BufferGeometry {
  const radius = 95;
  const height = 22;
  // Bigger, higher-res disc
  const geom = new THREE.CylinderGeometry(radius, radius * 1.1, height, 64, 6, false);
  const pos = geom.attributes.position;

  // Slightly undulate the top surface and color by height band.
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // Top surface vertices (y > height/2 - eps) — add some subtle noise
    if (y > height / 2 - 0.1) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const n = hashNoise(x * 0.05, z * 0.05, 1) * 0.8;
      pos.setY(i, y + n);
    }
  }

  geom.computeVertexNormals();

  // Vertex colors: top = green (lawn), upper side = sand beach, lower = darker rock
  const colors = new Float32Array(pos.count * 3);
  const cGrass = new THREE.Color("#a3c98a");
  const cGrassDark = new THREE.Color("#7fae72");
  const cSand = new THREE.Color("#e9d4a8");
  const cSandWet = new THREE.Color("#c8b282");
  const cRock = new THREE.Color("#8e7a65");

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    let c: THREE.Color;
    if (y > height / 2 - 0.5) {
      // Top — grass with slight variance
      c = cGrass.clone().lerp(cGrassDark, Math.abs(hashNoise(i, 0, 1)));
    } else if (y > height / 2 - 2.5) {
      // Beach / dune ring
      c = cSand;
    } else if (y > -height / 2 + 3) {
      // Sandy cliffs
      c = cSandWet;
    } else {
      c = cRock;
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geom;
}

/* ----------------------------------------------------------------------- */
/*   SATELLITE ISLANDS — peaks, plateaus, mesas                            */
/* ----------------------------------------------------------------------- */

function SatelliteIsland({ position, radius, height, seed, style, treeCount }: IslandSpec) {
  const geometry = useMemo(
    () => buildSatelliteGeometry(radius, height, seed, style),
    [radius, height, seed, style]
  );

  return (
    <group position={position}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} metalness={0} />
      </mesh>
      <Trees radius={radius} height={height} seed={seed} style={style} count={treeCount} />
    </group>
  );
}

function buildSatelliteGeometry(
  radius: number,
  height: number,
  seed: number,
  style: "peak" | "plateau" | "mesa"
): THREE.BufferGeometry {
  const geom = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geom.attributes.position;

  // Each style reshapes the island differently.
  // - peak: tall central cone, sharp
  // - plateau: wide flat top, shorter
  // - mesa: cliffy sides with a flat top
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const r = Math.sqrt(x * x + z * z) / radius;
    const below = y < 0;
    const noise = hashNoise(x * 0.1, z * 0.1, seed);

    let topY = 0;
    if (style === "peak") {
      // Sharp central peak — cone-like falloff
      const t = Math.max(0, 1 - r);
      topY = height * Math.pow(t, 2.2) + noise * 3;
    } else if (style === "plateau") {
      // Flat top that drops off at the edges
      const edgeFade = THREE.MathUtils.smoothstep(0.85, 1.0, r);
      topY = height * (1 - edgeFade) + noise * 1.5;
    } else {
      // mesa — flattish top with cliffs
      const core = THREE.MathUtils.smoothstep(0.7, 1.0, r); // 0 in middle, 1 at edge
      topY = height * (1 - core) - Math.max(0, core * height * 0.4) + noise * 2;
    }

    const bottomY = -height * 0.7 * Math.pow(Math.max(0, 1 - r), 0.6) - Math.abs(noise) * 0.5;
    pos.setY(i, below ? bottomY : topY);
  }

  geom.computeVertexNormals();

  // Vertex colors
  const colors = new Float32Array(pos.count * 3);
  const cMoss = new THREE.Color("#7fae72");
  const cGrass = new THREE.Color("#9ac98f");
  const cSand = new THREE.Color("#e9c98d");
  const cStone = new THREE.Color("#8c7b68");
  const cSnow = new THREE.Color("#f5f3ea");
  const cUnder = new THREE.Color("#5a4b3a");

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    let c: THREE.Color;
    if (y > height * 0.85 && style === "peak") {
      c = cSnow;
    } else if (y > height * 0.55) {
      c = cMoss.clone().lerp(cGrass, 0.4);
    } else if (y > height * 0.2) {
      c = cGrass.clone().lerp(cSand, 0.5);
    } else if (y > 0) {
      c = cSand.clone().lerp(cStone, 0.4);
    } else if (y > -height * 0.3) {
      c = cStone;
    } else {
      c = cUnder;
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geom;
}

function hashNoise(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return (s - Math.floor(s)) - 0.5;
}

/* ----------------------------------------------------------------------- */
/*   TREES                                                                 */
/* ----------------------------------------------------------------------- */

function Trees({
  radius,
  height,
  seed,
  style,
  count,
}: {
  radius: number;
  height: number;
  seed: number;
  style: "peak" | "plateau" | "mesa";
  count?: number;
}) {
  const trees = useMemo(() => {
    const n = count ?? 10 + Math.floor(radius / 5);
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + hashNoise(i, seed, seed) * 0.5;
      const rFactor = style === "peak" ? 0.5 : 0.6;
      const r = radius * (rFactor + 0.35 * Math.abs(hashNoise(i * 7, seed, seed)));
      return {
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        h: 4 + Math.abs(hashNoise(i * 3, seed, seed)) * 6,
        type: i % 3 === 0 ? "spruce" : "pine",
      };
    });
  }, [radius, seed, style, count]);

  // Trees sit on the top surface. Approximate top-surface height at (x,z):
  const topY = (x: number, z: number) => {
    const r = Math.sqrt(x * x + z * z) / radius;
    if (style === "peak") return height * Math.pow(Math.max(0, 1 - r), 2.2);
    if (style === "plateau") return height * (1 - THREE.MathUtils.smoothstep(0.85, 1.0, r));
    return height * (1 - THREE.MathUtils.smoothstep(0.7, 1.0, r));
  };

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={i} x={t.x} z={t.z} y={topY(t.x, t.z)} h={t.h} type={t.type as "spruce" | "pine"} />
      ))}
    </group>
  );
}

function Tree({ x, y, z, h, type }: { x: number; y: number; z: number; h: number; type: "spruce" | "pine" }) {
  if (type === "spruce") {
    return (
      <group position={[x, y, z]}>
        {/* Trunk */}
        <mesh position={[0, h * 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.22, h * 0.4, 6]} />
          <meshStandardMaterial color="#6b4a2b" />
        </mesh>
        {/* Stacked cones */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, h * (0.5 + i * 0.2), 0]} castShadow>
            <coneGeometry args={[1.2 - i * 0.3, h * 0.4, 8]} />
            <meshStandardMaterial color="#4a7a3a" flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  // pine
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, h * 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, h * 0.5, 6]} />
        <meshStandardMaterial color="#6b4a2b" />
      </mesh>
      <mesh position={[0, h * 0.7, 0]} castShadow>
        <coneGeometry args={[1.6, h * 0.55, 8]} />
        <meshStandardMaterial color="#55724a" flatShading />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------------------------------- */
/*   OCEAN — replaces the cloud-sea with a proper water plane              */
/* ----------------------------------------------------------------------- */

function Ocean() {
  return (
    <group>
      {/* Deep ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -55, 0]} receiveShadow>
        <planeGeometry args={[6000, 6000, 1, 1]} />
        <meshStandardMaterial
          color="#2a7a8c"
          roughness={0.4}
          metalness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Glossy top layer for shimmer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -54.5, 0]}>
        <planeGeometry args={[6000, 6000, 1, 1]} />
        <meshStandardMaterial
          color="#4fc8e0"
          roughness={0.15}
          metalness={0.5}
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}
