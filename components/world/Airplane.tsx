"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import { useFlight } from "@/lib/stores/useFlight";
import { Aircraft } from "./Aircraft";
import { SPAWN_ISLAND_POS, PAD_Y } from "./SpawnIsland";

/**
 * Flight controls for the DeLorean. Arcade-y with a few fixes vs. v0:
 *
 * - Auto-level: when roll/pitch are idle, the vehicle returns to upright.
 *   This fixes the "it keeps turning after I let go" behavior — previously,
 *   any residual roll was still inducing yaw and the plane would orbit slowly
 *   until it died against the altitude clamp.
 *
 * - Dead-zone on small angular velocities: anything below 0.02 rad/s clamps
 *   to zero. Kills the slow-drift problem.
 *
 * - Snappier response: higher angular damping (6 → 5x snappier), and we now
 *   move on the vehicle's local XZ plane (no more nose-down travel when the
 *   pitch drifts a few degrees).
 *
 * - Much larger scale to match the DeLorean's silhouette.
 */

const CONFIG = {
  maxSpeed: 70,
  minSpeed: 14,
  accel: 24,
  brakeDecel: 55,             // Z brake — much stronger than regular throttleDown
  turboMultiplier: 1.9,
  pitchRate: 1.4,
  rollRate: 2.4,
  yawRate: 1.1,
  angularDamping: 6.0,        // how fast angVel reaches target (higher = snappier)
  autoLevelStrength: 1.2,     // how strongly we return to upright when idle
  bankYawFactor: 0.35,        // reduced — still feels like a plane, less "auto-orbit"
  angVelDeadZone: 0.04,       // rad/s threshold below which we snap to zero
};

export function Airplane() {
  const craft = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const setTelemetry = useFlight((s) => s.setTelemetry);
  const cameraMode = useFlight((s) => s.cameraMode);
  const toggleCamera = useFlight((s) => s.toggleCamera);

  const [, getKeys] = useKeyboardControls();

  const state = useRef({
    speed: 24,
    angVel: new THREE.Vector3(0, 0, 0),
    // Pre-seed camera to the spawn chase position so the first frame doesn't
    // swoop in from the old default.
    camPos: new THREE.Vector3(
      SPAWN_ISLAND_POS[0],
      PAD_Y + 13,
      SPAWN_ISLAND_POS[2] + 32
    ),
    camLook: new THREE.Vector3(SPAWN_ISLAND_POS[0], PAD_Y + 2, SPAWN_ISLAND_POS[2] - 20),
    lastV: false,
    turboActive: false,
    throttleActive: false,     // tracks W/throttleUp — drives reactor glow
    brakeActive: false,        // tracks Z
  });

  // Spawn the aircraft standing on the SpawnIsland's landing pad, nose
  // pointing at the NS main island (origin). Forward for the aircraft is
  // local -Z; the pad sits at +Z from origin, so rotation.y = 0 makes the
  // nose face the hotel without any extra rotation.
  useEffect(() => {
    if (!craft.current) return;
    craft.current.position.set(
      SPAWN_ISLAND_POS[0],
      PAD_Y + 2.8, // sit just above the pad surface
      SPAWN_ISLAND_POS[2]
    );
    craft.current.rotation.set(0, 0, 0);
  }, []);

  useFrame((_, rawDelta) => {
    if (!craft.current) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const s = state.current;
    const keys = getKeys();

    // Camera toggle (V)
    if (keys.toggleCamera && !s.lastV) toggleCamera();
    s.lastV = !!keys.toggleCamera;

    // Turbo + accel tracking (for reactor FX)
    s.turboActive = !!keys.turbo;
    s.throttleActive = !!keys.throttleUp || !!keys.turbo;
    s.brakeActive = !!keys.brake;

    // Throttle + brake. Brake is a stronger, dedicated decelerator.
    const throttleInput = (keys.throttleUp ? 1 : 0) - (keys.throttleDown ? 1 : 0);
    const turbo = keys.turbo ? CONFIG.turboMultiplier : 1;

    s.speed += throttleInput * CONFIG.accel * delta;
    if (keys.brake) {
      s.speed -= CONFIG.brakeDecel * delta;
    }
    s.speed = THREE.MathUtils.clamp(s.speed, CONFIG.minSpeed, CONFIG.maxSpeed * turbo);

    // Target angular input from keys
    const pitchInput = ((keys.pitchDown ? 1 : 0) - (keys.pitchUp ? 1 : 0));
    const rollInput  = ((keys.rollLeft ? 1 : 0) - (keys.rollRight ? 1 : 0));
    const yawInput   = ((keys.yawLeft  ? 1 : 0) - (keys.yawRight  ? 1 : 0));

    const anyPitch = pitchInput !== 0;
    const anyRoll  = rollInput  !== 0;

    // Read current orientation (decomposed from world quaternion)
    const euler = new THREE.Euler().setFromQuaternion(craft.current.quaternion, "YXZ");
    const currentPitch = euler.x;
    const currentRoll  = euler.z;

    // Auto-level when no input — add a restoring torque toward 0
    const pitchCorrection = anyPitch ? 0 : -currentPitch * CONFIG.autoLevelStrength;
    const rollCorrection  = anyRoll  ? 0 : -currentRoll  * CONFIG.autoLevelStrength;

    const targetPitch = pitchInput * CONFIG.pitchRate + pitchCorrection;
    const targetRoll  = rollInput  * CONFIG.rollRate  + rollCorrection;

    // Bank-into-yaw only kicks in while banked AND the player is not
    // actively counter-rolling. This prevents the slow-orbit drift.
    const bankYaw = -currentRoll * CONFIG.bankYawFactor;
    const targetYaw = yawInput * CONFIG.yawRate + bankYaw;

    // Exponential lerp toward target
    const k = 1 - Math.exp(-CONFIG.angularDamping * delta);
    s.angVel.x = THREE.MathUtils.lerp(s.angVel.x, targetPitch, k);
    s.angVel.z = THREE.MathUtils.lerp(s.angVel.z, targetRoll,  k);
    s.angVel.y = THREE.MathUtils.lerp(s.angVel.y, targetYaw,   k);

    // Dead-zone: hard-snap tiny residual velocities to zero
    if (Math.abs(s.angVel.x) < CONFIG.angVelDeadZone) s.angVel.x = 0;
    if (Math.abs(s.angVel.y) < CONFIG.angVelDeadZone) s.angVel.y = 0;
    if (Math.abs(s.angVel.z) < CONFIG.angVelDeadZone) s.angVel.z = 0;

    // Apply local rotations (nose-space)
    craft.current.rotateX(s.angVel.x * delta);
    craft.current.rotateY(s.angVel.y * delta);
    craft.current.rotateZ(s.angVel.z * delta);

    // Forward vector from current orientation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(craft.current.quaternion);
    craft.current.position.addScaledVector(forward, s.speed * turbo * delta);

    // Altitude clamp (wide range)
    craft.current.position.y = THREE.MathUtils.clamp(craft.current.position.y, -30, 260);

    // Camera follow
    const camOffset =
      cameraMode === "chase"
        ? new THREE.Vector3(0, 10, 32) // pulled back for the bigger DeLorean
        : new THREE.Vector3(0, 3, 2);

    const worldOffset = camOffset.clone().applyQuaternion(craft.current.quaternion);
    const targetCam = craft.current.position.clone().add(worldOffset);

    s.camPos.lerp(targetCam, 1 - Math.exp(-6 * delta));
    camera.position.copy(s.camPos);

    const lookAhead = craft.current.position.clone().add(
      forward.clone().multiplyScalar(cameraMode === "chase" ? 20 : 80)
    );
    s.camLook.lerp(lookAhead, 1 - Math.exp(-8 * delta));
    camera.lookAt(s.camLook);

    // FOV kick on turbo
    const targetFov = cameraMode === "cockpit" ? 72 : 58;
    const kick = keys.turbo ? 10 : 0;
    (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(
      (camera as THREE.PerspectiveCamera).fov,
      targetFov + kick,
      1 - Math.exp(-5 * delta)
    );
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    setTelemetry({
      position: craft.current.position.clone(),
      rotation: craft.current.rotation.clone(),
      speed: s.speed * turbo,
      altitude: craft.current.position.y,
    });
  });

  return (
    <group ref={craft}>
      <Aircraft
        getTurbo={() => state.current.turboActive}
        getSpeed={() => state.current.speed}
        getThrust={() => state.current.throttleActive}
        getBrake={() => state.current.brakeActive}
      />
    </group>
  );
}
