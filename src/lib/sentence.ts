import { purposeLabel } from "./catalog";

export type WallItem = {
  id: string;
  tool: string;
  purposes: string[];
  impact: number;
  practice: string;
  createdAt: string;
};

export function purposePhrase(purposes: string[]): string {
  const labels = purposes.map((id) => purposeLabel(id).toLowerCase());
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}
