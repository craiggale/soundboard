import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { Wall } from "@/components/Wall";
import { getWall } from "@/lib/data";

async function LandingWall() {
  const { items, total } = await getWall();
  return (
    <>
      <Wall items={items} columns={3} emptyMessage="The board is empty. Be the first to add yours." />
      {total > 0 && (
        <p className="absolute right-6 top-6 z-10 bg-ink/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-white/60 backdrop-blur">
          <span className="text-white tabular-nums">{total}</span> {total === 1 ? "idea" : "ideas"} on the board
        </p>
      )}
    </>
  );
}

export default function Home() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <Hero />
      <section aria-label="What colleagues have shared" className="relative h-[80dvh] overflow-hidden border-white/10 lg:sticky lg:top-0 lg:h-dvh lg:border-l">
        <Suspense fallback={<Wall items={[]} columns={3} />}>
          <LandingWall />
        </Suspense>
      </section>
    </main>
  );
}
