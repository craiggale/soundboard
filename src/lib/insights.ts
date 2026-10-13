import { BARRIERS, PRACTICES, PURPOSES, toolByName } from "./catalog";
import type { ResponseRecord } from "./data";

export type ToolStat = {
  name: string;
  emerging: boolean;
  shown: number;
  users: number;
  unaware: number;
  adoption: number;
  unawareRate: number;
  avgImpact: number;
};
export type PurposeStat = { id: string; label: string; count: number; topTools: { name: string; count: number }[] };
export type CountStat = { name: string; count: number };

export type Insights = {
  responses: number;
  usingAi: number;
  notUsingAi: number;
  toolUses: number;
  tools: ToolStat[];
  purposes: PurposeStat[];
  barriers: CountStat[];
  practices: CountStat[];
};

export function computeInsights(all: ResponseRecord[], practice?: string): Insights {
  const scoped = practice ? all.filter((r) => r.practice === practice) : all;
  const usesAi = (r: ResponseRecord) => r.ratings.some((rating) => rating.verdict === "uses");
  const users = scoped.filter(usesAi);

  const tools = new Map<string, { shown: number; users: number; unaware: number; impact: number }>();
  const purposes = new Map<string, Map<string, number>>(PURPOSES.map((p) => [p.id, new Map()]));
  let toolUses = 0;

  for (const response of scoped) {
    for (const rating of response.ratings) {
      const entry = tools.get(rating.tool) ?? { shown: 0, users: 0, unaware: 0, impact: 0 };
      entry.shown += 1;
      if (rating.verdict === "unaware") entry.unaware += 1;
      if (rating.verdict === "uses") {
        entry.users += 1;
        entry.impact += rating.impact ?? 0;
        toolUses += 1;
        for (const purpose of rating.purposes) {
          const byTool = purposes.get(purpose);
          byTool?.set(rating.tool, (byTool.get(rating.tool) ?? 0) + 1);
        }
      }
      tools.set(rating.tool, entry);
    }
  }

  const toolStats: ToolStat[] = [...tools.entries()]
    .map(([name, entry]) => ({
      name,
      emerging: toolByName(name)?.emerging ?? false,
      shown: entry.shown,
      users: entry.users,
      unaware: entry.unaware,
      adoption: entry.users / entry.shown,
      unawareRate: entry.unaware / entry.shown,
      avgImpact: entry.users ? entry.impact / entry.users : 0,
    }))
    .sort((a, b) => b.users - a.users || b.avgImpact - a.avgImpact);

  const purposeStats: PurposeStat[] = PURPOSES.map((p) => {
    const byTool = purposes.get(p.id) ?? new Map<string, number>();
    const ranked = [...byTool.entries()].sort((a, b) => b[1] - a[1]);
    return {
      id: p.id,
      label: p.label,
      count: ranked.reduce((sum, [, n]) => sum + n, 0),
      topTools: ranked.slice(0, 3).map(([name, count]) => ({ name, count })),
    };
  })
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);

  const barrierCounts = new Map<string, number>(BARRIERS.map((b) => [b, 0]));
  for (const response of scoped.filter((r) => !usesAi(r))) {
    for (const barrier of response.barriers) {
      barrierCounts.set(barrier, (barrierCounts.get(barrier) ?? 0) + 1);
    }
  }

  return {
    responses: scoped.length,
    usingAi: users.length,
    notUsingAi: scoped.length - users.length,
    toolUses,
    tools: toolStats,
    purposes: purposeStats,
    barriers: [...barrierCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .filter((b) => b.count > 0)
      .sort((a, b) => b.count - a.count),
    practices: PRACTICES.map((name) => ({
      name,
      count: all.filter((r) => r.practice === name).length,
    })),
  };
}
