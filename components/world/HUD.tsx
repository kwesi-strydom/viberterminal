"use client";

import { useFlight } from "@/lib/stores/useFlight";
import { useWorld } from "@/lib/stores/useWorld";

/**
 * In-flight HUD. Rendered as regular DOM on top of the Canvas so it stays crisp.
 */
export function HUD() {
  const speed = useFlight((s) => s.speed);
  const altitude = useFlight((s) => s.altitude);
  const cameraMode = useFlight((s) => s.cameraMode);
  const portals = useWorld((s) => s.portals);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-between p-6 text-sm text-white">
      <div className="rounded-2xl border border-white/30 bg-black/30 px-4 py-3 backdrop-blur-md">
        <div className="flex gap-5">
          <Metric label="SPEED" value={`${speed.toFixed(0)}`} unit="kn" />
          <Metric label="ALT" value={`${altitude.toFixed(0)}`} unit="m" />
          <Metric label="CAM" value={cameraMode.toUpperCase()} />
          <Metric label="PORTALS" value={`${portals.length}`} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/30 bg-black/30 px-4 py-3 text-right backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Fly through a glowing portal</p>
        <p className="mt-1 text-white/90">to open the app it points to</p>
      </div>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">{label}</p>
      <p className="font-display text-2xl leading-none text-white">
        {value}
        {unit && <span className="ml-1 text-sm text-white/80">{unit}</span>}
      </p>
    </div>
  );
}
