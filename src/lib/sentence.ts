export type WallItem = {
  id: string;
  tool: string;
  purposes: string[];
  impact: number;
  practice: string;
  createdAt: string;
};

export function purposePhrase(labels: string[]): string {
  const lower = labels.map((label) => label.toLowerCase());
  if (lower.length <= 1) return lower[0] ?? "";
  return `${lower.slice(0, -1).join(", ")} and ${lower.at(-1)}`;
}
