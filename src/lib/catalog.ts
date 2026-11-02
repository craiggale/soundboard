// Shapes of the admin-managed catalogue, plus pure helpers safe to use on the client.

export type CatalogCategory = {
  id: string;
  name: string;
  purpose: string | null;
  alwaysShown: boolean;
};

export type Logo = { key: string; title: string; placeholder: boolean };

export type CatalogTool = {
  name: string;
  category: string;
  categoryIds: string[];
  emerging: boolean;
  alwaysShown: boolean;
  logo: Logo;
  askAccess: boolean;
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

export const ACCESS_OPTIONS = [
  { id: "enterprise", label: "Accenture-provided" },
  // An unticked box: personal, free, unsure or simply not ticked.
  { id: "personal", label: "Not Accenture-provided" },
  { id: "unsure", label: "Not sure" },
] as const;
export type Access = (typeof ACCESS_OPTIONS)[number]["id"];
export const ACCESS_IDS = ACCESS_OPTIONS.map((a) => a.id) as [Access, ...Access[]];

export const CONTEXT_OPTIONS = [
  { id: "client", label: "Client work" },
  { id: "internal", label: "Internal work" },
  { id: "offering", label: "Offering, strategy & proposition development" },
] as const;
export type UsageContext = (typeof CONTEXT_OPTIONS)[number]["id"];
export const CONTEXT_IDS = CONTEXT_OPTIONS.map((c) => c.id) as [UsageContext, ...UsageContext[]];

// Licence for tools people add themselves (catalogue tools use ACCESS_OPTIONS).
export const LICENCE_OPTIONS = [
  { id: "enterprise", label: "Accenture enterprise licence" },
  { id: "personal", label: "Personal licence or account" },
  { id: "client", label: "Client licence" },
] as const;
export type Licence = (typeof LICENCE_OPTIONS)[number]["id"];
export const LICENCE_IDS = LICENCE_OPTIONS.map((l) => l.id) as [Licence, ...Licence[]];

export const VERDICTS = ["uses", "not_used", "unaware"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const IMPACT_LABELS = [
  "Nice to have",
  "Handy",
  "Really useful",
  "Part of how I work",
  "Couldn't do without it",
];
