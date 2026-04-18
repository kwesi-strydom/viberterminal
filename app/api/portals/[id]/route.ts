import { NextResponse } from "next/server";
import { getPortal, recordPlay } from "@/lib/db/portals";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const portal = await getPortal(params.id);
  if (!portal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ portal });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  // v1: the only POST action is "record a play". In v1.1 we'll replace this
  // with explicit /enter and /exit endpoints that move tokens.
  await recordPlay(params.id);
  return NextResponse.json({ ok: true });
}
