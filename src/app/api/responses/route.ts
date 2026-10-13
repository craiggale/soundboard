import { createSubmission, SubmissionError } from "@/lib/data";
import { submissionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
      { status: 400 },
    );
  }

  try {
    const items = await createSubmission(parsed.data);
    return Response.json({ items }, { status: 201 });
  } catch (error) {
    if (error instanceof SubmissionError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
