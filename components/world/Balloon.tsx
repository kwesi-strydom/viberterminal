"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

/**
 * A branded hot-air balloon.
 *
 * Each balloon can either:
 *   - render a centered emoji/glyph (fast default — no asset pipeline), OR
 *   - load a texture from /public (pass `logoUrl`).
 *
 * Once the user drops logo PNG/SVGs into /public/balloons/, we just set
 * `logoUrl` and it'll be used instead of the fallback canvas text.
 */

export interface BalloonProps {
  position: [number, number, number];
  scale?: number;
  envelopeColor?: string;
  capColor?: string;
  /** Short mark shown on the front of the envelope (e.g. "₿", "R"). */
  glyph?: string;
  /** Text under the glyph (e.g. "BITCOIN"). */
  label?: string;
  /** Optional URL to a logo image — when provided, replaces the canvas fallback. */
  logoUrl?: string;
  /** Tint for the canvas text / glow ring. */
  accent?: string;
}

export function Balloon({
  position,
  scale = 1,
  envelopeColor = "#ff9e3d",
  capColor = "#ff7a1f",
  glyph = "?",
  label,
  logoUrl,
  accent = "#ffffff",
}: BalloonProps) {
  const group = useRef<THREE.Group>(null);
  const startY = position[1];

  // Canvas-based front panel (fallback when no logoUrl)
  const canvasTexture = useMemo(
    () => (logoUrl ? null : makeBalloonPanelTexture(glyph, label, accent)),
    [glyph, label, accent, logoUrl]
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = startY + Math.sin(t * 0.5 + position[0]) * 1.8;
    group.current.rotation.y = Math.sin(t * 0.12 + position[2]) * 0.4;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Envelope sphere */}
      <mesh castShadow position={[0, 14, 0]}>
        <sphereGeometry args={[12, 28, 28]} />
        <meshStandardMaterial color={envelopeColor} roughness={0.55} metalness={0} />
      </mesh>

      {/* Bottom cap */}
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[7, 6, 28]} />
        <meshStandardMaterial color={capColor} roughness={0.6} />
      </mesh>

      {/* Front panel — either a texture plane with the logo, or canvas glyph */}
      {logoUrl ? (
        <BrandedFrontPanel logoUrl={logoUrl} />
      ) : (
        canvasTexture && (
          <mesh position={[0, 14, 12.15]}>
            <planeGeometry args={[14, 14]} />
            <meshBasicMaterial map={canvasTexture} transparent toneMapped={false} />
          </mesh>
        )
      )}

      {/* Ropes */}
      {[-3.5, 3.5].map((x, i) => (
        <mesh key={i} position={[x, -2, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 14, 6]} />
          <meshStandardMaterial color="#6b4a2b" />
        </mesh>
      ))}

      {/* Basket */}
      <mesh position={[0, -10, 0]} castShadow>
        <boxGeometry args={[5, 3, 5]} />
        <meshStandardMaterial color="#8c5a2f" roughness={0.9} />
      </mesh>

      {/* Subtle accent halo point-light inside the envelope for night readability */}
      <pointLight position={[0, 14, 0]} color={accent} intensity={0.6} distance={14} />
    </group>
  );
}

function BrandedFrontPanel({ logoUrl }: { logoUrl: string }) {
  const tex = useTexture(logoUrl);
  return (
    <mesh position={[0, 14, 12.15]}>
      <planeGeometry args={[16, 16]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

/**
 * Generate a front-panel texture: a soft rounded disc with a big glyph and
 * optional label beneath. Replaced by the actual logo when logoUrl is passed.
 */
function makeBalloonPanelTexture(glyph: string, label: string | undefined, accent: string): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Texture(c);

  // Transparent background
  ctx.clearRect(0, 0, c.width, c.height);

  // Inner soft disc (so the panel reads as a label on the sphere)
  ctx.beginPath();
  ctx.arc(c.width / 2, c.height / 2, 220, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(c.width / 2, c.height / 2, 40, c.width / 2, c.height / 2, 220);
  g.addColorStop(0, "rgba(255,255,255,0.92)");
  g.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fill();

  // Accent ring
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c.width / 2, c.height / 2, 210, 0, Math.PI * 2);
  ctx.stroke();

  // Glyph
  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 240px Inter, -apple-system, system-ui, sans-serif";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 20;
  ctx.fillText(glyph, c.width / 2, c.height / 2 - (label ? 20 : 0));
  ctx.shadowBlur = 0;

  // Label
  if (label) {
    ctx.fillStyle = "#0f1115";
    ctx.font = "700 54px Inter, -apple-system, system-ui, sans-serif";
    ctx.fillText(label, c.width / 2, c.height / 2 + 140);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
