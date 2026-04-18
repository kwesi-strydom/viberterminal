import { pgTable, text, timestamp, integer, real, boolean, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Portals — the core primitive of Viber Terminal.
 * Each row represents one portal in the 3D world that embeds an external app.
 *
 * v1: URL-embed only. v1.1 will add token economics (entry cost, reward rules, creator ledger).
 */
export const portals = pgTable("portals", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  color: text("color").notNull().default("#8be0d4"),

  // World coordinates (y is up, matches three.js)
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(40),
  z: real("z").notNull().default(-60),
  radius: real("radius").notNull().default(10),

  // Creator metadata — kept loose for v1 so we don't require auth yet
  creatorHandle: text("creator_handle"),

  // Tags for filtering on the creator dashboard
  tags: text("tags").array(),

  // Track plays / ratings so we can surface popular portals later
  playCount: integer("play_count").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),

  // Soft-delete and moderation flags
  isPublished: boolean("is_published").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Portal = typeof portals.$inferSelect;
export type NewPortal = typeof portals.$inferInsert;

// Zod schemas for API validation
export const insertPortalSchema = createInsertSchema(portals, {
  url: (s) => s.url(),
  name: (s) => s.min(2).max(60),
  slug: (s) => s.regex(/^[a-z0-9-]+$/).min(2).max(40),
  color: (s) => s.regex(/^#[0-9a-fA-F]{6}$/),
}).omit({ id: true, createdAt: true, updatedAt: true, playCount: true, ratingSum: true, ratingCount: true });

export const selectPortalSchema = createSelectSchema(portals);

export const publicPortalSchema = selectPortalSchema.pick({
  id: true,
  slug: true,
  name: true,
  description: true,
  url: true,
  thumbnailUrl: true,
  color: true,
  x: true,
  y: true,
  z: true,
  radius: true,
  creatorHandle: true,
  tags: true,
  playCount: true,
});

export type PublicPortal = z.infer<typeof publicPortalSchema>;
