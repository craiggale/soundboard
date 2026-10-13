import { sql } from "drizzle-orm";
import { pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  practice: text("practice").notNull(),
  areas: text("areas").array().notNull().default(sql`'{}'`),
  barriers: text("barriers").array().notNull().default(sql`'{}'`),
  barrierNote: text("barrier_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const toolRatings = pgTable("tool_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  responseId: uuid("response_id")
    .notNull()
    .references(() => responses.id, { onDelete: "cascade" }),
  tool: text("tool").notNull(),
  verdict: text("verdict").notNull(),
  impact: smallint("impact"),
  purposes: text("purposes").array().notNull().default(sql`'{}'`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Kept in step with the tables above by hand; runs idempotently on first connection.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice text NOT NULL,
  areas text[] NOT NULL DEFAULT '{}',
  barriers text[] NOT NULL DEFAULT '{}',
  barrier_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tool_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  tool text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('uses', 'not_used', 'unaware')),
  impact smallint CHECK (impact BETWEEN 1 AND 5),
  purposes text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tool_ratings_uses_idx ON tool_ratings (created_at DESC) WHERE verdict = 'uses';
`;
