import { z } from "zod";
import { VERDICTS } from "./catalog";

// Shape only. Values are checked against the live catalogue when the response is saved.
const rating = z
  .object({
    tool: z.string().trim().min(1).max(80),
    verdict: z.enum(VERDICTS),
    impact: z.number().int().min(1).max(5).optional(),
    purposes: z.array(z.string().max(80)).max(40).optional(),
  })
  .refine((r) => r.verdict !== "uses" || (r.impact && r.purposes?.length), {
    message: "Tools you use need a purpose and a rating.",
  });

export const submissionSchema = z.object({
  practice: z.string().trim().min(1).max(80),
  areas: z.array(z.string().max(80)).max(40),
  ratings: z
    .array(rating)
    .max(400)
    .refine((items) => new Set(items.map((r) => r.tool)).size === items.length, {
      message: "Each tool can only be rated once.",
    }),
  barriers: z.array(z.string().max(120)).max(40).default([]),
  note: z.string().trim().max(500).optional(),
});

export type Submission = z.infer<typeof submissionSchema>;
