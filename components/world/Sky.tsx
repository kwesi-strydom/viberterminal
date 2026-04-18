"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BackSide } from "three";

/**
 * Painterly gradient sky sphere. Vertex-color shader with 3 stops:
 *   zenith (soft teal) → band (warm peach) → horizon (dusk coral).
 *
 * Much cheaper than a skybox and holds up visually — the painterly feel comes
 * from the color palette and the soft fog, not PBR realism.
 */
export function Sky() {
  const material = useMemo(() => {
    const uniforms = {
      uZenith: { value: new THREE.Color("#8bc3d4") },
      uMiddle: { value: new THREE.Color("#ffd6a5") },
      uHorizon: { value: new THREE.Color("#f29a86") },
    };
    return new THREE.ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uZenith;
        uniform vec3 uMiddle;
        uniform vec3 uHorizon;
        varying vec3 vWorldPos;

        void main() {
          float h = normalize(vWorldPos).y; // -1 .. 1
          float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
          vec3 col;
          if (t > 0.6) {
            float k = smoothstep(0.6, 1.0, t);
            col = mix(uMiddle, uZenith, k);
          } else {
            float k = smoothstep(0.0, 0.6, t);
            col = mix(uHorizon, uMiddle, k);
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1}>
      <sphereGeometry args={[1200, 64, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
