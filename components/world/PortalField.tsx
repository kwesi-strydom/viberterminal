"use client";

import { useMemo } from "react";
import { useWorld } from "@/lib/stores/useWorld";
import { Portal } from "./Portal";

/**
 * Draws every published portal. Portals come from /api/portals, fetched on mount
 * by the useWorld store. New portals added via the creator form will show up on
 * the next reload (or after calling fetchPortals again).
 */
export function PortalField() {
  const portals = useWorld((s) => s.portals);

  // Stable list memoization avoids re-creating THREE objects every frame
  const list = useMemo(() => portals, [portals]);

  return (
    <group>
      {list.map((p) => (
        <Portal key={p.id} portal={p} />
      ))}
    </group>
  );
}
