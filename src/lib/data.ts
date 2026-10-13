import { connection } from "next/server";
import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import { purposesOf, type Catalog, type Purpose } from "./catalog";
import { getDb, type Db } from "./db";
import { resolveLogo } from "./logos";
import { barriers, categories, practices, responses, toolCategories, toolRatings, tools } from "./db/schema";
import type { WallItem } from "./sentence";
import type { Submission } from "./validation";

const WALL_LIMIT = 150;

export class SubmissionError extends Error {}

async function loadRaw(db: Db) {
  const [categoryRows, toolRows, links, practiceRows, barrierRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sort)),
    db.select().from(tools).orderBy(asc(tools.sort), asc(tools.name)),
    db.select().from(toolCategories),
    db.select().from(practices).orderBy(asc(practices.sort)),
    db.select().from(barriers).orderBy(asc(barriers.sort)),
  ]);
  return { categoryRows, toolRows, links, practiceRows, barrierRows };
}

type Raw = Awaited<ReturnType<typeof loadRaw>>;

function toCatalog(raw: Raw): Catalog {
  const visibleCategories = raw.categoryRows.filter((c) => !c.hidden);
  const categoryIndex = new Map(visibleCategories.map((c, i) => [c.id, i]));
  const linksByTool = new Map<string, string[]>();
  for (const link of raw.links) {
    if (!categoryIndex.has(link.categoryId)) continue;
    linksByTool.set(link.toolId, [...(linksByTool.get(link.toolId) ?? []), link.categoryId]);
  }

  const catalogTools = raw.toolRows
    .filter((t) => !t.hidden && linksByTool.has(t.id))
    .map((t) => {
      const ids = (linksByTool.get(t.id) ?? []).sort((a, b) => categoryIndex.get(a)! - categoryIndex.get(b)!);
      const linked = ids.map((id) => visibleCategories[categoryIndex.get(id)!]);
      return {
        tool: {
          name: t.name,
          category: linked[0].name,
          categoryIds: ids.filter((id) => linked.find((c) => c.id === id)?.purpose),
          emerging: t.emerging,
          alwaysShown: linked.some((c) => c.alwaysShown),
          logo: resolveLogo(t.logo),
        },
        order: [categoryIndex.get(ids[0])!, t.sort] as const,
      };
    })
    .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1])
    .map((entry) => entry.tool);

  return {
    practices: raw.practiceRows.filter((p) => !p.hidden).map((p) => ({ name: p.name, summary: p.summary })),
    barriers: raw.barrierRows.filter((b) => !b.hidden).map((b) => b.label),
    categories: visibleCategories.map((c) => ({
      id: c.id,
      name: c.name,
      purpose: c.purpose,
      alwaysShown: c.alwaysShown,
    })),
    tools: catalogTools,
  };
}

export async function getCatalog(): Promise<Catalog> {
  await connection();
  return toCatalog(await loadRaw(await getDb()));
}

// Labels for everything that may appear in stored answers, including hidden items.
export async function getLabels(): Promise<{
  purposes: Purpose[];
  practices: string[];
  barriers: string[];
  emerging: Set<string>;
}> {
  await connection();
  const raw = await loadRaw(await getDb());
  return {
    purposes: purposesOf({ categories: raw.categoryRows }),
    practices: raw.practiceRows.filter((p) => !p.hidden).map((p) => p.name),
    barriers: raw.barrierRows.map((b) => b.label),
    emerging: new Set(raw.toolRows.filter((t) => t.emerging).map((t) => t.name)),
  };
}

async function purposeLabelMap(db: Db): Promise<Map<string, string>> {
  const rows = await db.select({ id: categories.id, purpose: categories.purpose, name: categories.name }).from(categories);
  return new Map(rows.map((r) => [r.id, r.purpose ?? r.name]));
}

type WallRow = {
  id: string;
  tool: string;
  purposes: string[];
  impact: number | null;
  practice: string;
  createdAt: Date;
};

function toWallItem(row: WallRow, labels: Map<string, string>): WallItem {
  return {
    ...row,
    purposes: row.purposes.map((id) => labels.get(id) ?? id),
    impact: row.impact ?? 1,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getWall(after?: Date): Promise<{ items: WallItem[]; total: number }> {
  await connection();
  const db = await getDb();
  const uses = eq(toolRatings.verdict, "uses");

  const [rows, [{ total }], labels] = await Promise.all([
    db
      .select({
        id: toolRatings.id,
        tool: toolRatings.tool,
        purposes: toolRatings.purposes,
        impact: toolRatings.impact,
        practice: responses.practice,
        createdAt: toolRatings.createdAt,
      })
      .from(toolRatings)
      .innerJoin(responses, eq(toolRatings.responseId, responses.id))
      .where(after ? and(uses, gt(toolRatings.createdAt, after)) : uses)
      .orderBy(desc(toolRatings.createdAt), desc(toolRatings.impact))
      .limit(WALL_LIMIT),
    db.select({ total: count() }).from(toolRatings).where(uses),
    purposeLabelMap(db),
  ]);

  return { items: rows.map((row) => toWallItem(row, labels)), total };
}

export async function createSubmission(submission: Submission): Promise<WallItem[]> {
  await connection();
  const db = await getDb();
  const catalog = toCatalog(await loadRaw(db));

  if (!catalog.practices.some((p) => p.name === submission.practice)) {
    throw new SubmissionError("Please pick your practice again.");
  }

  // The catalogue can change mid-session, so drop anything that no longer exists rather than rejecting.
  const toolNames = new Set(catalog.tools.map((t) => t.name));
  const purposeIds = new Set(purposesOf(catalog).map((p) => p.id));
  const ratings = submission.ratings
    .filter((r) => toolNames.has(r.tool))
    .map((r) => ({ ...r, purposes: (r.purposes ?? []).filter((id) => purposeIds.has(id)) }))
    .filter((r) => r.verdict !== "uses" || r.purposes.length > 0);
  const usesAny = ratings.some((r) => r.verdict === "uses");
  const chosenBarriers = submission.barriers.filter((b) => catalog.barriers.includes(b));

  if (!usesAny && chosenBarriers.length === 0 && !submission.note) {
    throw new SubmissionError("Tell us which tools you use, or what's held you back.");
  }

  const created = await db.transaction(async (tx) => {
    const [response] = await tx
      .insert(responses)
      .values({
        practice: submission.practice,
        areas: submission.areas.filter((id) => purposeIds.has(id)),
        barriers: usesAny ? [] : chosenBarriers,
        barrierNote: usesAny ? null : submission.note || null,
      })
      .returning({ id: responses.id });

    if (ratings.length === 0) return [];

    return tx
      .insert(toolRatings)
      .values(
        ratings.map((r) => ({
          responseId: response.id,
          tool: r.tool,
          verdict: r.verdict,
          impact: r.verdict === "uses" ? r.impact : null,
          purposes: r.verdict === "uses" ? r.purposes : [],
        })),
      )
      .returning({
        id: toolRatings.id,
        tool: toolRatings.tool,
        verdict: toolRatings.verdict,
        purposes: toolRatings.purposes,
        impact: toolRatings.impact,
        createdAt: toolRatings.createdAt,
      });
  });

  const labels = await purposeLabelMap(db);
  return created
    .filter((row) => row.verdict === "uses")
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .map(({ verdict: _verdict, ...row }) => toWallItem({ ...row, practice: submission.practice }, labels));
}

export type ResponseRecord = {
  id: string;
  practice: string;
  areas: string[];
  barriers: string[];
  barrierNote: string | null;
  createdAt: Date;
  ratings: { tool: string; verdict: string; impact: number | null; purposes: string[] }[];
};

export async function getAllResponses(): Promise<ResponseRecord[]> {
  await connection();
  const db = await getDb();
  const [responseRows, ratingRows] = await Promise.all([
    db.select().from(responses).orderBy(desc(responses.createdAt)),
    db.select().from(toolRatings).orderBy(toolRatings.createdAt),
  ]);

  const byResponse = new Map<string, ResponseRecord>(
    responseRows.map((row) => [row.id, { ...row, ratings: [] }]),
  );
  for (const row of ratingRows) {
    byResponse.get(row.responseId)?.ratings.push({
      tool: row.tool,
      verdict: row.verdict,
      impact: row.impact,
      purposes: row.purposes,
    });
  }
  return [...byResponse.values()];
}

export async function getToolCategoryNames(): Promise<Map<string, string>> {
  await connection();
  const db = await getDb();
  const rows = await db
    .select({ tool: tools.name, category: categories.name, sort: categories.sort })
    .from(toolCategories)
    .innerJoin(tools, eq(toolCategories.toolId, tools.id))
    .innerJoin(categories, eq(toolCategories.categoryId, categories.id))
    .orderBy(asc(categories.sort));
  const map = new Map<string, string>();
  for (const row of rows) if (!map.has(row.tool)) map.set(row.tool, row.category);
  return map;
}
