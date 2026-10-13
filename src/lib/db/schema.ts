import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, primaryKey, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  purpose: text("purpose"),
  alwaysShown: boolean("always_shown").notNull().default(false),
  hidden: boolean("hidden").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const tools = pgTable("tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  emerging: boolean("emerging").notNull().default(false),
  hidden: boolean("hidden").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const toolCategories = pgTable(
  "tool_categories",
  {
    toolId: uuid("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.toolId, t.categoryId] })],
);

export const practices = pgTable("practices", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  summary: text("summary").notNull().default(""),
  hidden: boolean("hidden").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const barriers = pgTable("barriers", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull().unique(),
  hidden: boolean("hidden").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
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
CREATE INDEX IF NOT EXISTS tool_ratings_tool_idx ON tool_ratings (tool);
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  purpose text,
  always_shown boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  emerging boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS tool_categories (
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, category_id)
);
CREATE TABLE IF NOT EXISTS practices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  summary text NOT NULL DEFAULT '',
  hidden boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS barriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  hidden boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS app_meta (
  key text PRIMARY KEY,
  value text NOT NULL
);
`;
