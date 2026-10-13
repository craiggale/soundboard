import { purposeLabel, toolByName } from "@/lib/catalog";
import { getAllResponses } from "@/lib/data";

const HEADERS = [
  "response_id",
  "submitted_at",
  "practice",
  "areas",
  "tool",
  "tool_category",
  "verdict",
  "impact_1_to_5",
  "purposes",
  "barriers",
  "barrier_note",
];

function cell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  // Neutralise spreadsheet formula injection from free-text answers.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const labels = (ids: string[]) => ids.map(purposeLabel).join("; ");

export async function GET() {
  const responses = await getAllResponses();
  const lines = [HEADERS.join(",")];

  for (const response of responses) {
    const base = [response.id, response.createdAt.toISOString(), response.practice, labels(response.areas)];
    const tail = [response.barriers.join("; "), response.barrierNote];
    if (response.ratings.length === 0) {
      lines.push([...base, "", "", "", "", "", ...tail].map(cell).join(","));
      continue;
    }
    for (const rating of response.ratings) {
      lines.push(
        [
          ...base,
          rating.tool,
          toolByName(rating.tool)?.category ?? "",
          rating.verdict,
          rating.impact,
          labels(rating.purposes),
          ...tail,
        ]
          .map(cell)
          .join(","),
      );
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  // BOM so Excel opens the file as UTF-8.
  return new Response("﻿" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="soundboard-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
