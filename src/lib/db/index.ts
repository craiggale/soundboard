import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { SEED_BARRIERS, SEED_CATEGORIES, SEED_EMERGING, SEED_PRACTICES } from "./seed";

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
  return db;
}

export function getDb(): Promise<Db> {
  globalForDb.soundboardDb ??= connect().catch((error) => {
    globalForDb.soundboardDb = undefined;
    throw error;
  });
  return globalForDb.soundboardDb;
}
