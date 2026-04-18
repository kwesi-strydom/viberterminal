import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Database client.
 *
 * - If DATABASE_URL is set, we use Neon serverless Postgres + Drizzle.
 * - Otherwise, callers should fall back to the in-memory store (see lib/db/memoryStore.ts).
 *
 * This lets the app run end-to-end with zero setup, and upgrade to Postgres
 * by just filling in the .env file.
 */
neonConfig.fetchConnectionCache = true;

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const db = hasDatabase
  ? drizzle(neon(process.env.DATABASE_URL!), { schema })
  : null;

export { schema };
