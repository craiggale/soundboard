import { connection } from "next/server";
import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import type { Logo } from "./catalog";
import { getDb } from "./db";
import { isLogoSlug, resolveLogo } from "./logos";
import { barriers, categories, practices, responses, toolCategories, toolRatings, tools } from "./db/schema";

export class AdminError extends Error {}

export type AdminTool = {
  id: string;
  name: string;
  emerging: boolean;
  hidden: boolean;
  categoryIds: string[];
  ratings: number;
  logoSlug: string;
  logo: Logo;
  askAccess: boolean;
};
export type AdminCategory = {
  id: string;
  name: string;
  purpose: string | null;
  alwaysShown: boolean;
  hidden: boolean;
  tools: number;
  inUse: boolean;
};
export type AdminPractice = { id: string; name: string; summary: string; hidden: boolean; responses: number };
export type AdminBarrier = { id: string; label: string; hidden: boolean; uses: number };

export type AdminData = {
  tools: AdminTool[];
  categories: AdminCategory[];
  practices: AdminPractice[];
  barriers: AdminBarrier[];
};

export async function getAdminData(): Promise<AdminData> {
  await connection();
  const db = await getDb();
  const [categoryRows, toolRows, links, practiceRows, barrierRows, ratingCounts, responseRows, purposeRows] =
    await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sort)),
      db.select().from(tools).orderBy(asc(tools.sort), asc(tools.name)),
      db.select().from(toolCategories),
      db.select().from(practices).orderBy(asc(practices.sort)),
      db.select().from(barriers).orderBy(asc(barriers.sort)),
      db.select({ tool: toolRatings.tool, n: count() }).from(toolRatings).groupBy(toolRatings.tool),
      db.select({ practice: responses.practice, areas: responses.areas, barriers: responses.barriers }).from(responses),
      db.select({ purposes: toolRatings.purposes }).from(toolRatings).where(eq(toolRatings.verdict, "uses")),
    ]);

  const ratingsByTool = new Map(ratingCounts.map((r) => [r.tool, r.n]));
  const tally = (values: string[]) => values.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map<string, number>());
  const practiceCounts = tally(responseRows.map((r) => r.practice));
  const barrierCounts = tally(responseRows.flatMap((r) => r.barriers));
  const usedCategoryIds = new Set([...responseRows.flatMap((r) => r.areas), ...purposeRows.flatMap((r) => r.purposes)]);

  return {
    tools: toolRows.map((t) => ({
      id: t.id,
      name: t.name,
      emerging: t.emerging,
      hidden: t.hidden,
      categoryIds: links.filter((l) => l.toolId === t.id).map((l) => l.categoryId),
      ratings: ratingsByTool.get(t.name) ?? 0,
      logoSlug: t.logo ?? "",
      logo: resolveLogo(t.logo),
      askAccess: t.askAccess,
    })),
    categories: categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
      purpose: c.purpose,
      alwaysShown: c.alwaysShown,
      hidden: c.hidden,
      tools: links.filter((l) => l.categoryId === c.id).length,
      inUse: usedCategoryIds.has(c.id),
    })),
    practices: practiceRows.map((p) => ({ ...p, responses: practiceCounts.get(p.name) ?? 0 })),
    barriers: barrierRows.map((b) => ({ id: b.id, label: b.label, hidden: b.hidden, uses: barrierCounts.get(b.label) ?? 0 })),
  };
}

function clean(value: string, field: string, max = 80) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) throw new AdminError(`${field} can't be empty.`);
  if (trimmed.length > max) throw new AdminError(`${field} must be ${max} characters or fewer.`);
  return trimmed;
}

async function nextSort(table: typeof tools | typeof categories | typeof practices | typeof barriers) {
  const db = await getDb();
  const [{ max }] = await db.select({ max: sql<number | null>`max(${table.sort})` }).from(table);
  return (max ?? -1) + 1;
}

async function reorder(ids: string[], id: string, direction: -1 | 1, save: (id: string, sort: number) => Promise<unknown>) {
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  await Promise.all(ids.map((value, sort) => save(value, sort)));
}

// Tools

export type ToolInput = {
  id?: string;
  name: string;
  emerging: boolean;
  hidden: boolean;
  categoryIds: string[];
  logo: string;
  askAccess: boolean;
};

export async function saveTool(input: ToolInput) {
  const db = await getDb();
  const name = clean(input.name, "Tool name");
  const categoryIds = [...new Set(input.categoryIds)];
  if (categoryIds.length === 0) throw new AdminError("Pick at least one category.");
  const logo = input.logo.trim().toLowerCase() || null;
  if (logo && !isLogoSlug(logo)) {
    throw new AdminError(`“${logo}” isn't a Simple Icons logo. Check the slug at simpleicons.org, or leave it blank.`);
  }

  const known = await db.select({ id: categories.id }).from(categories);
  if (categoryIds.some((id) => !known.some((c) => c.id === id))) throw new AdminError("Unknown category.");

  const clash = await db
    .select({ id: tools.id })
    .from(tools)
    .where(input.id ? and(sql`lower(${tools.name}) = lower(${name})`, ne(tools.id, input.id)) : sql`lower(${tools.name}) = lower(${name})`);
  if (clash.length) throw new AdminError(`There's already a tool called “${name}”.`);

  const sort = input.id ? undefined : await nextSort(tools);
  await db.transaction(async (tx) => {
    let id = input.id;
    if (id) {
      const [existing] = await tx.select({ name: tools.name }).from(tools).where(eq(tools.id, id));
      if (!existing) throw new AdminError("That tool no longer exists.");
      await tx.update(tools).set({ name, emerging: input.emerging, hidden: input.hidden, logo, askAccess: input.askAccess }).where(eq(tools.id, id));
      if (existing.name !== name) {
        await tx.update(toolRatings).set({ tool: name }).where(eq(toolRatings.tool, existing.name));
      }
      await tx.delete(toolCategories).where(eq(toolCategories.toolId, id));
    } else {
      [{ id }] = await tx
        .insert(tools)
        .values({ name, emerging: input.emerging, hidden: input.hidden, logo, askAccess: input.askAccess, sort })
        .returning({ id: tools.id });
    }
    await tx.insert(toolCategories).values(categoryIds.map((categoryId) => ({ toolId: id as string, categoryId })));
  });
}

export async function deleteTool(id: string) {
  const db = await getDb();
  const [tool] = await db.select({ name: tools.name }).from(tools).where(eq(tools.id, id));
  if (!tool) return;
  const [{ n }] = await db.select({ n: count() }).from(toolRatings).where(eq(toolRatings.tool, tool.name));
  if (n > 0) throw new AdminError(`${tool.name} has ${n} ratings, so it can't be deleted. Hide it instead.`);
  await db.delete(tools).where(eq(tools.id, id));
}

// Categories

export type CategoryInput = { id?: string; name: string; purpose: string; alwaysShown: boolean; hidden: boolean };

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "category";
}

export async function saveCategory(input: CategoryInput) {
  const db = await getDb();
  const name = clean(input.name, "Category name");
  const purpose = input.purpose.trim() ? clean(input.purpose, "Purpose") : null;
  const values = { name, purpose, alwaysShown: input.alwaysShown, hidden: input.hidden };

  if (input.id) {
    await db.update(categories).set(values).where(eq(categories.id, input.id));
    return;
  }
  const existing = new Set((await db.select({ id: categories.id }).from(categories)).map((c) => c.id));
  const base = slugify(name);
  let id = base;
  for (let n = 2; existing.has(id); n++) id = `${base}-${n}`;
  await db.insert(categories).values({ id, ...values, sort: await nextSort(categories) });
}

export async function deleteCategory(id: string) {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(toolCategories).where(eq(toolCategories.categoryId, id));
  if (n > 0) throw new AdminError(`This category still has ${n} tools. Move them first, or hide the category.`);
  const used = await db
    .select({ id: responses.id })
    .from(responses)
    .where(sql`${id} = ANY(${responses.areas})`)
    .limit(1);
  const usedInRatings = await db
    .select({ id: toolRatings.id })
    .from(toolRatings)
    .where(sql`${id} = ANY(${toolRatings.purposes})`)
    .limit(1);
  if (used.length || usedInRatings.length) {
    throw new AdminError("People have already chosen this purpose, so it can't be deleted. Hide it instead.");
  }
  await db.delete(categories).where(eq(categories.id, id));
}

export async function moveCategory(id: string, direction: -1 | 1) {
  const db = await getDb();
  const rows = await db.select({ id: categories.id }).from(categories).orderBy(asc(categories.sort));
  await reorder(rows.map((r) => r.id), id, direction, (rowId, sort) =>
    db.update(categories).set({ sort }).where(eq(categories.id, rowId)),
  );
}

// Practices

export type PracticeInput = { id?: string; name: string; summary: string; hidden: boolean };

export async function savePractice(input: PracticeInput) {
  const db = await getDb();
  const name = clean(input.name, "Practice name");
  const summary = input.summary.trim().slice(0, 160);
  const clash = await db
    .select({ id: practices.id })
    .from(practices)
    .where(input.id ? and(sql`lower(${practices.name}) = lower(${name})`, ne(practices.id, input.id)) : sql`lower(${practices.name}) = lower(${name})`);
  if (clash.length) throw new AdminError(`There's already a practice called “${name}”.`);

  if (!input.id) {
    await db.insert(practices).values({ name, summary, hidden: input.hidden, sort: await nextSort(practices) });
    return;
  }
  await db.transaction(async (tx) => {
    const [existing] = await tx.select({ name: practices.name }).from(practices).where(eq(practices.id, input.id!));
    if (!existing) throw new AdminError("That practice no longer exists.");
    await tx.update(practices).set({ name, summary, hidden: input.hidden }).where(eq(practices.id, input.id!));
    if (existing.name !== name) {
      await tx.update(responses).set({ practice: name }).where(eq(responses.practice, existing.name));
    }
  });
}

export async function deletePractice(id: string) {
  const db = await getDb();
  const [practice] = await db.select({ name: practices.name }).from(practices).where(eq(practices.id, id));
  if (!practice) return;
  const [{ n }] = await db.select({ n: count() }).from(responses).where(eq(responses.practice, practice.name));
  if (n > 0) throw new AdminError(`${practice.name} has ${n} responses, so it can't be deleted. Hide it instead.`);
  await db.delete(practices).where(eq(practices.id, id));
}

export async function movePractice(id: string, direction: -1 | 1) {
  const db = await getDb();
  const rows = await db.select({ id: practices.id }).from(practices).orderBy(asc(practices.sort));
  await reorder(rows.map((r) => r.id), id, direction, (rowId, sort) =>
    db.update(practices).set({ sort }).where(eq(practices.id, rowId)),
  );
}

// Barriers

export type BarrierInput = { id?: string; label: string; hidden: boolean };

export async function saveBarrier(input: BarrierInput) {
  const db = await getDb();
  const label = clean(input.label, "Option", 120);
  const clash = await db
    .select({ id: barriers.id })
    .from(barriers)
    .where(input.id ? and(sql`lower(${barriers.label}) = lower(${label})`, ne(barriers.id, input.id)) : sql`lower(${barriers.label}) = lower(${label})`);
  if (clash.length) throw new AdminError(`“${label}” is already an option.`);

  if (!input.id) {
    await db.insert(barriers).values({ label, hidden: input.hidden, sort: await nextSort(barriers) });
    return;
  }
  await db.transaction(async (tx) => {
    const [existing] = await tx.select({ label: barriers.label }).from(barriers).where(eq(barriers.id, input.id!));
    if (!existing) throw new AdminError("That option no longer exists.");
    await tx.update(barriers).set({ label, hidden: input.hidden }).where(eq(barriers.id, input.id!));
    if (existing.label !== label) {
      await tx
        .update(responses)
        .set({ barriers: sql`array_replace(${responses.barriers}, ${existing.label}, ${label})` })
        .where(sql`${existing.label} = ANY(${responses.barriers})`);
    }
  });
}

export async function deleteBarrier(id: string) {
  const db = await getDb();
  const [barrier] = await db.select({ label: barriers.label }).from(barriers).where(eq(barriers.id, id));
  if (!barrier) return;
  const used = await db
    .select({ id: responses.id })
    .from(responses)
    .where(sql`${barrier.label} = ANY(${responses.barriers})`)
    .limit(1);
  if (used.length) throw new AdminError("People have already chosen this option, so it can't be deleted. Hide it instead.");
  await db.delete(barriers).where(eq(barriers.id, id));
}

export async function moveBarrier(id: string, direction: -1 | 1) {
  const db = await getDb();
  const rows = await db.select({ id: barriers.id }).from(barriers).orderBy(asc(barriers.sort));
  await reorder(rows.map((r) => r.id), id, direction, (rowId, sort) =>
    db.update(barriers).set({ sort }).where(eq(barriers.id, rowId)),
  );
}
