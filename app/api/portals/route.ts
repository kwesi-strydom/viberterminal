import { NextResponse } from "next/server";
import { z } from "zod";
import { listPortals, createPortal } from "@/lib/db/portals";

export const dynamic = "force-dynamic";

const postBody = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).min(2).max(40),
  name: z.string().min(2).max(60),
  description: z.string().max(400).optional(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
  radius: z.number().min(4).max(40).optional(),
  creatorHandle: z.string().max(40).optional(),
  tags: z.array(z.string()).max(8).optional(),
});

export async function GET() {
  const rows = await listPortals();
  return NextResponse.json({ portals: rows });
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  // Auto-place the portal if coordinates weren't provided. Distribute on a wide
  // ring around the origin with strong altitude variance so portals visibly
  // float in the sky rather than stacking.
  const input = parsed.data;
  const angle = Math.random() * Math.PI * 2;
  const ringRadius = 180 + Math.random() * 120; // 180–300 units from spawn
  const defaults = {
    x: input.x ?? Math.cos(angle) * ringRadius,
    y: input.y ?? 50 + Math.random() * 110, // 50–160 altitude
    z: input.z ?? Math.sin(angle) * ringRadius,
    radius: input.radius ?? 14,
    color: input.color ?? randomPalette(),
  };

  const created = await createPortal({
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    url: input.url,
    thumbnailUrl: input.thumbnailUrl ?? null,
    creatorHandle: input.creatorHandle ?? null,
    tags: (input.tags ?? null) as any,
    ...defaults,
    isPublished: true,
  });

  return NextResponse.json({ portal: created }, { status: 201 });
}

function randomPalette(): string {
  // Warm, painterly palette
  const colors = ["#8be0d4", "#f5a88a", "#ffb74a", "#b89cf2", "#7fae72", "#e9c98d", "#f29ab8"];
  return colors[Math.floor(Math.random() * colors.length)];
}
