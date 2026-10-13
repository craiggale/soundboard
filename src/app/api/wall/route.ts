import type { NextRequest } from "next/server";
import { getWall } from "@/lib/data";

export async function GET(request: NextRequest) {
  const afterParam = request.nextUrl.searchParams.get("after");
  const after = afterParam ? new Date(afterParam) : undefined;
  if (after && Number.isNaN(after.getTime())) {
    return Response.json({ error: "Invalid 'after' timestamp." }, { status: 400 });
  }

  const wall = await getWall(after);
  return Response.json(wall, { headers: { "Cache-Control": "no-store" } });
}
