import { connection } from "next/server";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { getDb } from "./db";
import { responses, toolRatings } from "./db/schema";
import type { WallItem } from "./sentence";
import type { Submission } from "./validation";

const WALL_LIMIT = 150;

type WallRow = Omit<WallItem, "createdAt" | "impact"> & { impact: number | null; createdAt: Date };

function toWallItem(row: WallRow): WallItem {
  return { ...row, impact: row.impact ?? 1, createdAt: row.createdAt.toISOString() };
}

export async function getWall(after?: Date): Promise<{ items: WallItem[]; total: number }> {
  await connection();
  const db = await getDb();
  const uses = eq(toolRatings.verdict, "uses");

  const [rows, [{ total }]] = await Promise.all([
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
  ]);

  return { items: rows.map(toWallItem), total };
}

export async function createSubmission(submission: Submission): Promise<WallItem[]> {
  await connection();
  const db = await getDb();
  const usesAny = submission.ratings.some((r) => r.verdict === "uses");

  return db.transaction(async (tx) => {
    const [response] = await tx
      .insert(responses)
      .values({
        practice: submission.practice,
        areas: submission.areas,
        barriers: usesAny ? [] : submission.barriers,
        barrierNote: usesAny ? null : submission.note || null,
      })
      .returning({ id: responses.id });

    if (submission.ratings.length === 0) return [];

    const inserted = await tx
      .insert(toolRatings)
      .values(
        submission.ratings.map((r) => ({
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

    return inserted
      .filter((row) => row.verdict === "uses")
      .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
      .map(({ verdict: _verdict, ...row }) => toWallItem({ ...row, practice: submission.practice }));
  });
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
