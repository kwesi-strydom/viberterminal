"use client";

import { Suspense } from "react";
import { Sky } from "./Sky";
import { Terrain } from "./Terrain";
import { Balloon } from "./Balloon";
import { Airplane } from "./Airplane";
import { PortalField } from "./PortalField";
import { Clouds } from "./Clouds";
import { NetworkSchoolHotel } from "./NetworkSchoolHotel";
import { SpawnIsland } from "./SpawnIsland";

/**
 * Top-level scene composition.
 * Lighting is warm-dawn (directional + hemisphere) to support the Ghibli look.
 */
export function Scene() {
  return (
    <>
      {/* Painterly sky sphere + fog */}
      <Sky />
      <fog attach="fog" args={["#f5d4b5", 250, 1400]} />

      {/* Hemisphere for soft fill + directional for the warm rim */}
      <hemisphereLight args={["#ffe1c4", "#7ca691", 0.85]} />
      <directionalLight
        position={[120, 180, 80]}
        intensity={1.6}
        color="#fff3d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={600}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />
      <ambientLight intensity={0.35} color="#ffe6c7" />

      <Suspense fallback={null}>
        <Terrain />
        <NetworkSchoolHotel />
        <SpawnIsland />
        <Clouds />

        {/* Branded balloons drifting above the islands. Each gets a distinct
            position and palette. When you drop real logo files into
            /public/balloons/, add logoUrl="/balloons/bitcoin.png" etc. */}
        <Balloon
          position={[40, 130, -80]}
          scale={1.6}
          envelopeColor="#ff9e3d"
          capColor="#ff7a1f"
          glyph="₿"
          label="BITCOIN"
          accent="#ffffff"
        />
        <Balloon
          position={[-120, 150, -40]}
          scale={1.1}
          envelopeColor="#f26207"
          capColor="#c64d00"
          glyph="R"
          label="REPLIT"
          accent="#ffffff"
        />
        <Balloon
          position={[100, 160, 140]}
          scale={1.0}
          envelopeColor="#2a6cff"
          capColor="#1844c4"
          glyph="C"
          label="CERION"
          accent="#68f0ff"
        />

        <PortalField />
        <Airplane />
      </Suspense>
    </>
  );
}
