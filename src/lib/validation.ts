import { z } from "zod";
import { ACCESS_IDS, CONTEXT_IDS, LICENCE_IDS, VERDICTS } from "./catalog";

// Shape only. Values are checked against the live catalogue when the response is saved.
const rating = z
  .object({
    tool: z.string().trim().min(1).max(80),
    verdict: z.enum(VERDICTS),
    impact: z.number().int().min(1).max(5).optional(),
    purposes: z.array(z.string().max(80)).max(40).optional(),
    access: z.enum(ACCESS_IDS).optional(),
    contexts: z.array(z.enum(CONTEXT_IDS)).max(CONTEXT_IDS.length).optional(),
  })
  .refine((r) => r.verdict !== "uses" || (r.impact && r.purposes?.length && r.contexts?.length), {
    message: "Tools you use need a purpose, a context and a rating.",
  });

const customTool = z.object({
  name: z.string().trim().min(1).max(80),
  purposes: z.array(z.string().max(80)).min(1).max(40),
  contexts: z.array(z.enum(CONTEXT_IDS)).min(1).max(CONTEXT_IDS.length),
  licence: z.enum(LICENCE_IDS),
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
  customTools: z.array(customTool).max(20).default([]),
  barriers: z.array(z.string().max(120)).max(40).default([]),
  comment: z.string().trim().max(1000).optional(),
  note: z.string().trim().max(500).optional(),
});

export type Submission = z.infer<typeof submissionSchema>;
