"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * A sleek arrow-shaped starfighter / anti-gravity racer. Vibes: Wipeout /
 * F-Zero / a Polestar concept jet. Deliberately no vertical reactors, no
 * gigantic beams shooting up — the speed read comes from a tight, low
 * silhouette and subtle glowing trim.
 *
 * Visual language:
 *   - Long arrow fuselage with a pointed nose
 *   - Swept-back wings, sharp trailing edges
 *   - Single dorsal fin
 *   - Tiny bubble cockpit
 *   - Emissive cyan trim strips along the wings and fuselage spine
 *   - Circular rear engine nozzle that glows when you accelerate
 *   - Short, tapered speed-trail billboard behind — scales with throttle
 *   - Red (port) / green (starboard) nav lights on wingtips
 *   - Soft cyan underglow hinting at hover/anti-grav
 *   - Brake: two small red lights on the tail pulse when Z is held
 */

interface Props {
  getTurbo?: () => boolean;
  getSpeed?: () => number;
  getThrust?: () => boolean;
  getBrake?: () => boolean;
}

const HULL = "#e9edf2";
const HULL_DARK = "#9aa3ad";
const ACCENT = "#4fe3ff";
const GLASS = "#0c2030";
const BRAKE = "#ff4a4a";
const NAV_PORT = "#ff3355";
const NAV_STAR = "#33ff88";

export function Aircraft({ getTurbo, getSpeed, getThrust, getBrake }: Props) {
  const engineCore = useRef<THREE.MeshStandardMaterial>(null);
  const engineLight = useRef<THREE.PointLight>(null);
  const trail = useRef<THREE.Mesh>(null);
  const trailMat = useRef<THREE.MeshBasicMaterial>(null);
  const brakeLight = useRef<THREE.PointLight>(null);
  const strobe = useRef<THREE.MeshBasicMaterial>(null);
  const rimL = useRef<THREE.MeshStandardMaterial>(null);
  const rimR = useRef<THREE.MeshStandardMaterial>(null);
  const rimSpine = useRef<THREE.MeshStandardMaterial>(null);
  const underGlow = useRef<THREE.PointLight>(null);

  // Pre-build the trail geometry: a long tapered quad
  const trailGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.9, 6, 1, 1);
    // Taper — shrink the far-end vertices inward. Without needsUpdate the
    // GPU-side buffer keeps the original positions and the taper is invisible.
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < 0) {
        pos.setX(i, pos.getX(i) * 0.2);
      }
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const turbo = getTurbo?.() ?? false;
    const speed = getSpeed?.() ?? 0;
    const thrust = getThrust?.() ?? false;
    const brake = getBrake?.() ?? false;

    // Thrust level: 0..1 — idle / cruising / turbo
    const level = thrust ? (turbo ? 1.0 : 0.6) : 0.15;

    // Engine core & light ramp up with thrust
    if (engineCore.current) {
      engineCore.current.emissiveIntensity = 1.6 + level * 4;
    }
    if (engineLight.current) {
      engineLight.current.intensity = THREE.MathUtils.lerp(
        engineLight.current.intensity,
        1.2 + level * 2.8,
        0.25
      );
    }

    // Speed trail — visible only when actually accelerating, length scales with speed
    if (trail.current && trailMat.current) {
      trail.current.visible = level > 0.25;
      const targetScale = 0.4 + (speed / 70) * level * 2.2;
      trail.current.scale.y = THREE.MathUtils.lerp(trail.current.scale.y, targetScale, 0.2);
      trailMat.current.opacity = 0.25 + level * 0.55;
    }

    // Cyan trim breathes slowly
    const trimIntensity = 1.0 + Math.sin(t * 2) * 0.15 + level * 1.8;
    if (rimL.current) rimL.current.emissiveIntensity = trimIntensity;
    if (rimR.current) rimR.current.emissiveIntensity = trimIntensity;
    if (rimSpine.current) rimSpine.current.emissiveIntensity = trimIntensity;

    // Soft underglow pulses slowly regardless of speed
    if (underGlow.current) {
      underGlow.current.intensity = 0.9 + Math.sin(t * 1.4) * 0.2;
    }

    // Tail strobe — blinks once per second
    if (strobe.current) {
      strobe.current.opacity = Math.sin(t * 6) > 0.8 ? 1.0 : 0.15;
    }

    // Brake
    if (brakeLight.current) {
      brakeLight.current.intensity = brake ? 2.4 + Math.sin(t * 20) * 0.8 : 0;
    }
  });

  return (
    <group scale={1.8}>
      {/* ---------- FUSELAGE (long arrow shape) ----------
          We make it from two cones joined at the widest point for a
          sharp-nosed, tapered-tail look. */}

      {/* Nose cone */}
      <mesh castShadow position={[0, 0, -1.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.55, 3.2, 16]} />
        <meshStandardMaterial color={HULL} metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Rear body (reversed cone) */}
      <mesh castShadow position={[0, 0, 1.1]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.55, 2.6, 16]} />
        <meshStandardMaterial color={HULL} metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Belly panel — wider flat slab to give anti-grav profile */}
      <mesh castShadow position={[0, -0.15, 0]}>
        <boxGeometry args={[1.1, 0.18, 3.8]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Spine trim strip — emissive cyan line along the top */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.08, 0.04, 3.0]} />
        <meshStandardMaterial
          ref={rimSpine}
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* ---------- COCKPIT ---------- */}
      <mesh castShadow position={[0, 0.35, -0.4]}>
        {/* Half-ellipsoid via scaled sphere */}
        <sphereGeometry args={[0.35, 16, 12, 0, Math.PI]} />
        <meshStandardMaterial
          color={GLASS}
          metalness={0.2}
          roughness={0.1}
          transparent
          opacity={0.72}
        />
      </mesh>
      <mesh position={[0, 0.3, -0.4]}>
        <boxGeometry args={[0.7, 0.08, 0.9]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ---------- WINGS (swept-back deltas) ----------
          Built as thin boxes rotated for a swept-back silhouette. */}

      <SweptWing side="left" rimRef={rimL} />
      <SweptWing side="right" rimRef={rimR} />

      {/* ---------- DORSAL FIN ---------- */}
      <mesh castShadow position={[0, 0.45, 1.4]}>
        <boxGeometry args={[0.05, 0.6, 0.9]} />
        <meshStandardMaterial color={HULL_DARK} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Fin cyan edge */}
      <mesh position={[0, 0.72, 1.4]}>
        <boxGeometry args={[0.06, 0.04, 0.7]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      {/* Tail strobe (white, blinks) */}
      <mesh position={[0, 0.82, 1.4]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial ref={strobe} color="#ffffff" transparent opacity={0.15} toneMapped={false} />
      </mesh>

      {/* ---------- REAR ENGINE NOZZLE (THE ONLY "thrust" visual) ---------- */}
      <group position={[0, 0, 2.4]}>
        {/* Outer ring — cylinder rotated onto the Z axis so it opens rearward */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.3, 16]} />
          <meshStandardMaterial color={HULL_DARK} metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Inner glowing core — this is what brightens when accelerating */}
        <mesh position={[0, 0, 0.05]}>
          <circleGeometry args={[0.3, 24]} />
          <meshStandardMaterial
            ref={engineCore}
            color="#d8faff"
            emissive={ACCENT}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        {/* Engine point light */}
        <pointLight ref={engineLight} color={ACCENT} intensity={1.2} distance={8} />

        {/* Speed trail — tapered billboarded plane behind the engine */}
        <mesh
          ref={trail}
          position={[0, 0, 3.0]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={trailGeom}
        >
          <meshBasicMaterial
            ref={trailMat}
            color={ACCENT}
            transparent
            opacity={0.5}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ---------- BRAKE LIGHTS ---------- */}
      <pointLight
        ref={brakeLight}
        position={[0, 0.2, 2.2]}
        color={BRAKE}
        intensity={0}
        distance={4}
      />
      <mesh position={[-0.18, 0.18, 2.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={BRAKE} emissive={BRAKE} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      <mesh position={[0.18, 0.18, 2.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={BRAKE} emissive={BRAKE} emissiveIntensity={0.4} toneMapped={false} />
      </mesh>

      {/* ---------- SOFT UNDERGLOW (anti-grav hint) ---------- */}
      <pointLight
        ref={underGlow}
        position={[0, -0.6, 0]}
        color={ACCENT}
        intensity={1.0}
        distance={3.5}
        decay={2}
      />
    </group>
  );
}

/**
 * One swept-back delta wing. A thin triangular slab with a bright cyan
 * trailing edge strip and a nav light on the tip (port=red, starboard=green).
 */
function SweptWing({
  side,
  rimRef,
}: {
  side: "left" | "right";
  rimRef: React.RefObject<THREE.MeshStandardMaterial>;
}) {
  const sign = side === "left" ? -1 : 1;
  const navColor = side === "left" ? NAV_PORT : NAV_STAR;

  return (
    <group>
      {/* Wing blade — a thin slab, swept back by rotating around Y.
          The wing's pivot is at the root (near fuselage), then it extends
          outward and back. Negative sign flips the rotation so both wings
          sweep back rather than one forward/one back. */}
      <group position={[sign * 0.3, -0.02, 0.1]} rotation={[0, -sign * 0.55, 0]}>
        <mesh castShadow position={[sign * 1.05, 0, 0.35]}>
          {/* boxGeometry args = [width, height, depth] */}
          <boxGeometry args={[2.2, 0.08, 1.0]} />
          <meshStandardMaterial color={HULL} metalness={0.5} roughness={0.45} />
        </mesh>

        {/* Cyan trailing edge strip */}
        <mesh position={[sign * 1.05, 0.06, 0.75]}>
          <boxGeometry args={[2.1, 0.03, 0.07]} />
          <meshStandardMaterial
            ref={rimRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.2}
            toneMapped={false}
          />
        </mesh>

        {/* Nav light at wingtip */}
        <mesh position={[sign * 2.05, 0.05, 0.3]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={navColor} toneMapped={false} />
        </mesh>
        <pointLight position={[sign * 2.05, 0.05, 0.3]} color={navColor} intensity={0.6} distance={2.5} />
      </group>
    </group>
  );
}
