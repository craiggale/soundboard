import { z } from "zod";
import { AREAS, BARRIERS, PRACTICES, PURPOSE_IDS, TOOL_NAMES, TOOLS, VERDICTS, type AreaId } from "./catalog";

const AREA_IDS = AREAS.map((a) => a.id) as [AreaId, ...AreaId[]];

const rating = z
  .object({
    tool: z.enum(TOOL_NAMES),
    verdict: z.enum(VERDICTS),
    impact: z.number().int().min(1).max(5).optional(),
    purposes: z.array(z.enum(PURPOSE_IDS)).max(PURPOSE_IDS.length).optional(),
  })
  .refine((r) => r.verdict !== "uses" || (r.impact && r.purposes?.length), {
    message: "Tools you use need a purpose and a rating.",
  });

export const submissionSchema = z
  .object({
    practice: z.enum(PRACTICES),
    areas: z.array(z.enum(AREA_IDS)).max(AREA_IDS.length),
    ratings: z
      .array(rating)
      .max(TOOLS.length)
      .refine((items) => new Set(items.map((r) => r.tool)).size === items.length, {
        message: "Each tool can only be rated once.",
      }),
    barriers: z.array(z.enum(BARRIERS)).max(BARRIERS.length).default([]),
    note: z.string().trim().max(500).optional(),
  })
  .refine(
    (s) => s.ratings.some((r) => r.verdict === "uses") || s.barriers.length > 0 || Boolean(s.note),
    { message: "Tell us which tools you use, or what's held you back." },
  );

export type Submission = z.infer<typeof submissionSchema>;
