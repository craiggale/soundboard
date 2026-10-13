// Shapes of the admin-managed catalogue, plus pure helpers safe to use on the client.

export type CatalogCategory = {
  id: string;
  name: string;
  purpose: string | null;
  alwaysShown: boolean;
};

export type CatalogTool = {
  name: string;
  category: string;
  categoryIds: string[];
  emerging: boolean;
  alwaysShown: boolean;
};

export type CatalogPractice = { name: string; summary: string };

export type Catalog = {
  practices: CatalogPractice[];
  barriers: string[];
  categories: CatalogCategory[];
  tools: CatalogTool[];
};

export type Purpose = { id: string; label: string };

export function purposesOf(catalog: Pick<Catalog, "categories">): Purpose[] {
  return catalog.categories
    .filter((c) => c.purpose)
    .map((c) => ({ id: c.id, label: c.purpose as string }));
}

// Areas narrow the deck, so only purposes that have tools of their own (and aren't always shown) qualify.
export function areasOf(catalog: Catalog): Purpose[] {
  const withTools = new Set(catalog.tools.flatMap((t) => t.categoryIds));
  return catalog.categories
    .filter((c) => c.purpose && !c.alwaysShown && withTools.has(c.id))
    .map((c) => ({ id: c.id, label: c.purpose as string }));
}

export function buildDeck(catalog: Catalog, areas: string[]): CatalogTool[] {
  const relevant = catalog.tools.filter(
    (tool) => tool.emerging || tool.alwaysShown || tool.categoryIds.some((id) => areas.includes(id)),
  );
  return [...relevant.filter((t) => t.emerging), ...relevant.filter((t) => !t.emerging)];
}

export const VERDICTS = ["uses", "not_used", "unaware"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const IMPACT_LABELS = [
  "Nice to have",
  "Handy",
  "Really useful",
  "Part of how I work",
  "Couldn't do without it",
];
