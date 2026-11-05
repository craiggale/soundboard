import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  SEED_ACCENTURE_ONLY,
  SEED_BARRIERS,
  SEED_CATEGORIES,
  SEED_EMERGING,
  SEED_LOGOS,
  SEED_PRACTICES,
  PRACTICES_V2_RENAMES,
  PRACTICES_V3_RENAMES,
} from "./seed";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { soundboardDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url });
    await pool.query(schema.SCHEMA_SQL);
    return seedOnce(drizzle(pool, { schema }) as unknown as Db);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production.");
  }

  // Local development: embedded Postgres, persisted to .data/
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = path.join(process.cwd(), ".data");
  mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(path.join(dataDir, "pglite"));
  await client.exec(schema.SCHEMA_SQL);
  return seedOnce(drizzle(client, { schema }) as unknown as Db);
}

// The seeded flag (not empty tables) decides this, so deleting everything in admin doesn't re-seed.
async function seedOnce(db: Db): Promise<Db> {
  await db.transaction(async (tx) => {
    const claimed = await tx
      .insert(schema.appMeta)
      .values({ key: "seeded_at", value: new Date().toISOString() })
      .onConflictDoNothing()
      .returning();
    if (!claimed.length) return;

    await tx.insert(schema.categories).values(
      SEED_CATEGORIES.map((c, sort) => ({
        id: c.id,
        name: c.name,
        purpose: c.purpose,
        alwaysShown: Boolean(c.alwaysShown),
        sort,
      })),
    );

    const names = [...new Set(SEED_CATEGORIES.flatMap((c) => c.tools))];
    const inserted = await tx
      .insert(schema.tools)
      .values(names.map((name, sort) => ({ name, sort, emerging: SEED_EMERGING.includes(name) })))
      .returning({ id: schema.tools.id, name: schema.tools.name });
    const idByName = new Map(inserted.map((t) => [t.name, t.id]));

    await tx.insert(schema.toolCategories).values(
      SEED_CATEGORIES.flatMap((c) =>
        c.tools.map((name) => ({ toolId: idByName.get(name) as string, categoryId: c.id })),
      ),
    );
    await tx.insert(schema.practices).values(SEED_PRACTICES.map((p, sort) => ({ ...p, sort })));
    await tx.insert(schema.barriers).values(SEED_BARRIERS.map((label, sort) => ({ label, sort })));
  });

  // Logos arrived after the first seed, so they get their own one-time step. Bump the key when
  // SEED_LOGOS grows: only tools still without a logo are filled in, so admin choices are kept.
  await db.transaction(async (tx) => {
    const claimed = await tx
      .insert(schema.appMeta)
      .values({ key: "logos_seeded_v2", value: new Date().toISOString() })
      .onConflictDoNothing()
      .returning();
    if (!claimed.length) return;
    for (const [name, slug] of Object.entries(SEED_LOGOS)) {
      await tx
        .update(schema.tools)
        .set({ logo: slug })
        .where(and(eq(schema.tools.name, name), isNull(schema.tools.logo)));
    }
  });

  await db.transaction(async (tx) => {
    const claimed = await tx
      .insert(schema.appMeta)
      .values({ key: "access_seeded_v1", value: new Date().toISOString() })
      .onConflictDoNothing()
      .returning();
    if (!claimed.length) return;
    await tx.update(schema.tools).set({ askAccess: false }).where(inArray(schema.tools.name, SEED_ACCENTURE_ONLY));
  });

  await applyPracticeRenames(db, "practices_seeded_v2", PRACTICES_V2_RENAMES, true);
  await applyPracticeRenames(db, "practices_seeded_v3", PRACTICES_V3_RENAMES, false);
  return db;
}

export function getDb(): Promise<Db> {
  globalForDb.soundboardDb ??= connect().catch((error) => {
    globalForDb.soundboardDb = undefined;
    throw error;
  });
  return globalForDb.soundboardDb;
}

// One-time practice renames for databases seeded before the list changed. Responses follow the
// rename; with addMissing, any seed practice that still isn't there is appended. Later edits belong in /admin.
async function applyPracticeRenames(
  db: Db,
  key: string,
  renames: Record<string, { to: string; summary?: string }>,
  addMissing: boolean,
) {
  await db.transaction(async (tx) => {
    const claimed = await tx
      .insert(schema.appMeta)
      .values({ key, value: new Date().toISOString() })
      .onConflictDoNothing()
      .returning();
    if (!claimed.length) return;
    for (const [from, { to, summary }] of Object.entries(renames)) {
      const [existing] = await tx.select().from(schema.practices).where(eq(schema.practices.name, from));
      const [taken] = await tx.select().from(schema.practices).where(eq(schema.practices.name, to));
      if (!existing || taken) continue;
      await tx
        .update(schema.practices)
        .set({ name: to, ...(summary ? { summary } : {}) })
        .where(eq(schema.practices.id, existing.id));
      await tx.update(schema.responses).set({ practice: to }).where(eq(schema.responses.practice, from));
    }
    if (!addMissing) return;
    const present = new Set((await tx.select({ name: schema.practices.name }).from(schema.practices)).map((p) => p.name));
    const missing = SEED_PRACTICES.filter((p) => !present.has(p.name));
    if (missing.length === 0) return;
    const [{ max }] = await tx
      .select({ max: sql<number>`coalesce(max(${schema.practices.sort}), -1)` })
      .from(schema.practices);
    await tx.insert(schema.practices).values(missing.map((p, i) => ({ ...p, sort: Number(max) + 1 + i })));
  });
}
