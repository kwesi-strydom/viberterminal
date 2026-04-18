import { db, hasDatabase } from "./index";
import { portals, type Portal, type NewPortal, type PublicPortal, publicPortalSchema } from "./schema";
import { eq, or, desc } from "drizzle-orm";
import { memoryStore } from "./memoryStore";

/**
 * Repo for portals. Transparently switches between Postgres and in-memory
 * based on whether DATABASE_URL is set.
 */

function toPublic(p: Portal): PublicPortal {
  return publicPortalSchema.parse(p);
}

/**
 * Each call wraps the DB path in try/catch and falls back to the in-memory
 * store if anything throws (bad DATABASE_URL, missing table, network blip).
 * This means a misconfigured DB never breaks the app — it just degrades to
 * the seeded demo portals.
 */

export async function listPortals(): Promise<PublicPortal[]> {
  if (hasDatabase && db) {
    try {
      const rows = await db.select().from(portals).where(eq(portals.isPublished, true)).orderBy(desc(portals.createdAt));
      return rows.map(toPublic);
    } catch (err) {
      console.warn("[viber] DB listPortals failed, falling back to memory:", err);
    }
  }
  return memoryStore.list().map(toPublic);
}

export async function getPortal(idOrSlug: string): Promise<PublicPortal | null> {
  if (hasDatabase && db) {
    try {
      const rows = await db.select().from(portals).where(or(eq(portals.id, idOrSlug), eq(portals.slug, idOrSlug))).limit(1);
      return rows[0] ? toPublic(rows[0]) : null;
    } catch (err) {
      console.warn("[viber] DB getPortal failed, falling back to memory:", err);
    }
  }
  const p = memoryStore.get(idOrSlug);
  return p ? toPublic(p) : null;
}

export async function createPortal(input: Omit<NewPortal, "id" | "createdAt" | "updatedAt">): Promise<PublicPortal> {
  if (hasDatabase && db) {
    try {
      const [row] = await db.insert(portals).values(input).returning();
      return toPublic(row);
    } catch (err) {
      console.warn("[viber] DB createPortal failed, falling back to memory:", err);
    }
  }
  const p = memoryStore.create(input);
  return toPublic(p);
}

export async function recordPlay(idOrSlug: string): Promise<void> {
  if (hasDatabase && db) {
    try {
      const existing = await getPortal(idOrSlug);
      if (!existing) return;
      await db.update(portals).set({ playCount: existing.playCount + 1 }).where(eq(portals.id, existing.id));
      return;
    } catch (err) {
      console.warn("[viber] DB recordPlay failed, falling back to memory:", err);
    }
  }
  memoryStore.incrementPlay(idOrSlug);
}
