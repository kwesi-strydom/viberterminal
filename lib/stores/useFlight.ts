"use client";

import { create } from "zustand";
import * as THREE from "three";

/**
 * Flight state. Intentionally minimal — the physics live in the Airplane component.
 * The store exists so portals + HUD can read the plane's position without prop drilling.
 */
interface FlightState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  speed: number;
  altitude: number;
  cameraMode: "chase" | "cockpit";
  setTelemetry: (partial: Partial<Omit<FlightState, "setTelemetry" | "toggleCamera">>) => void;
  toggleCamera: () => void;
}

export const useFlight = create<FlightState>((set) => ({
  position: new THREE.Vector3(0, 50, 100),
  rotation: new THREE.Euler(0, 0, 0),
  speed: 0,
  altitude: 50,
  cameraMode: "chase",
  setTelemetry: (partial) => set(partial),
  toggleCamera: () => set((s) => ({ cameraMode: s.cameraMode === "chase" ? "cockpit" : "chase" })),
}));
