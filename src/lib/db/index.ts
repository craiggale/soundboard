import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { soundboardDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const pool = new Pool({ connectionString: url });
    await pool.query(schema.SCHEMA_SQL);
    return drizzle(pool, { schema }) as unknown as Db;
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
  return drizzle(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  globalForDb.soundboardDb ??= connect().catch((error) => {
    globalForDb.soundboardDb = undefined;
    throw error;
  });
  return globalForDb.soundboardDb;
}
