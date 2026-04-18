"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Far-background skyline that wraps around the player at the horizon.
 *
 * This used to be a ring of bare skyscrapers sitting in the ocean, which
 * looked wrong — like towers growing out of water. Now we sit them on a
 * proper CONTINENT RING: a thick torus-like land band that rises above the
 * ocean and provides the beach/ground plane the towers stand on.
 *
 * Geometry layers (inside-out):
 *   - Sand/beach ring (soft)
 *   - Land ring (moss/grass top colored)
 *   - Skyscrapers on top
 *   - A handful of distant hills/palm clusters for texture
 */

const DIST = 900; // ring radius from origin
const LAND_THICKNESS = 220; // wide enough that towers sit safely on land
const LAND_HEIGHT = 20; // how tall the land stands above the ocean
const OCEAN_Y = -55; // matches Terrain.Ocean
const LAND_TOP_Y = OCEAN_Y + LAND_HEIGHT;

interface Tower {
  a: number; // angle around the ring
  h: number; // height
  w: number; // width
  d: number; // depth
  shade: string;
}

function rand(seed: number): number {
  const s = Math.sin(seed * 99.137) * 43758.5;
  return s - Math.floor(s);
}

function buildTowers(): Tower[] {
  const towers: Tower[] = [];
  const count = 72;
  const shades = ["#eae2d4", "#d7ceb9", "#c9bfa8", "#e6ddcb", "#b8ae97"];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rand(i) * 0.05;
    const h = 60 + rand(i * 2) * 110;
    const w = 12 + rand(i * 3) * 14;
    const d = 12 + rand(i * 4) * 14;
    const shade = shades[Math.floor(rand(i * 5) * shades.length)];
    towers.push({ a, h, w, d, shade });
  }
  return towers;
}

export function CityRing() {
  const towers = useMemo(buildTowers, []);

  return (
    <group>
      <ContinentRing />
      <Skyline towers={towers} />
    </group>
  );
}

/**
 * The land the towers stand on. Two stacked ring bands — wet-sand lower
 * band and grassy-moss top — plus a dark underside so the cliff reads
 * from a distance.
 */
function ContinentRing() {
  const innerR = DIST - LAND_THICKNESS / 2;
  const outerR = DIST + LAND_THICKNESS / 2;

  return (
    <group>
      {/* Top land ring — sits just above sea level */}
      <mesh position={[0, LAND_TOP_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[innerR, outerR, 128]} />
        <meshStandardMaterial
          color="#a3c98a"
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Thin sandy beach band along the inner (water-facing) edge */}
      <mesh position={[0, LAND_TOP_Y + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerR, innerR + 22, 128]} />
        <meshStandardMaterial
          color="#e9d4a8"
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cliff — an open cylinder between ocean and land top on the inside edge */}
      <mesh position={[0, (OCEAN_Y + LAND_TOP_Y) / 2, 0]}>
        <cylinderGeometry
          args={[innerR, innerR + 6, LAND_HEIGHT, 128, 1, true]}
        />
        <meshStandardMaterial
          color="#8c7b68"
          roughness={1.0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer rim — gentle fade into fog */}
      <mesh position={[0, (OCEAN_Y + LAND_TOP_Y) / 2, 0]}>
        <cylinderGeometry
          args={[outerR, outerR - 6, LAND_HEIGHT, 128, 1, true]}
        />
        <meshStandardMaterial
          color="#7a6a58"
          roughness={1.0}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}

function Skyline({ towers }: { towers: Tower[] }) {
  return (
    <group>
      {towers.map((t, i) => {
        const x = Math.cos(t.a) * DIST;
        const z = Math.sin(t.a) * DIST;
        const rotY = -t.a + Math.PI / 2;
        return (
          <group key={i} position={[x, LAND_TOP_Y + t.h / 2, z]} rotation={[0, rotY, 0]}>
            <mesh>
              <boxGeometry args={[t.w, t.h, t.d]} />
              <meshStandardMaterial color={t.shade} roughness={0.9} metalness={0} />
            </mesh>
            {/* Rooftop mechanical box */}
            <mesh position={[0, t.h / 2 + 1.2, 0]}>
              <boxGeometry args={[t.w * 0.4, 2.4, t.d * 0.4]} />
              <meshStandardMaterial color="#8a8273" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
