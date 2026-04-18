"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/**
 * Painterly clouds — billboarded soft discs with radial alpha.
 * Cheap, no textures, and they slowly drift which gives the scene life.
 */
export function Clouds() {
  const group = useRef<THREE.Group>(null);

  const clouds = useMemo(() => {
    const arr: { pos: THREE.Vector3; scale: number; tint: THREE.Color }[] = [];
    for (let i = 0; i < 22; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 900,
          30 + Math.random() * 140,
          (Math.random() - 0.5) * 900
        ),
        scale: 30 + Math.random() * 60,
        tint: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 0.3, 0.9),
      });
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      c.position.x += delta * (0.5 + (i % 5) * 0.1);
      if (c.position.x > 600) c.position.x = -600;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <sprite key={i} position={[c.pos.x, c.pos.y, c.pos.z]} scale={[c.scale, c.scale * 0.45, 1]}>
          <spriteMaterial
            color={c.tint}
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}
