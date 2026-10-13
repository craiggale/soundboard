import { logoSvg } from "@/lib/logos";

export async function GET(request: Request, { params }: RouteContext<"/logos/[key]">) {
  const { key } = await params;
  const variant = new URL(request.url).searchParams.get("variant") === "mark" ? "mark" : "tile";
  const svg = logoSvg(key, variant);
  if (!svg) return new Response("Not found", { status: 404 });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      // Opened directly, an SVG is a document; lock it down so it can never run anything.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
