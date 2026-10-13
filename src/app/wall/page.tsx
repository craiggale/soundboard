import type { Metadata } from "next";
import { Suspense } from "react";
import { LiveWall } from "@/components/LiveWall";
import { getWall } from "@/lib/data";

export const metadata: Metadata = {
  title: "The board · Soundboard",
};

async function LiveWallData() {
  const { items, total } = await getWall();
  return <LiveWall initial={items} total={total} />;
}

export default function WallPage() {
  return (
    <Suspense fallback={<main className="h-dvh bg-ink" />}>
      <LiveWallData />
    </Suspense>
  );
}
