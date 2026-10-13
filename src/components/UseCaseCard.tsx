import { IMPACT_LABELS } from "@/lib/catalog";
import { purposePhrase, type WallItem } from "@/lib/sentence";
import { Chevron } from "./Chevron";

export function ImpactMeter({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-[3px]" title={IMPACT_LABELS[value - 1]}>
      <span className="sr-only">{IMPACT_LABELS[value - 1]}</span>
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          className={`h-3 w-[5px] -skew-x-[20deg] ${level <= value ? "bg-brand" : "bg-white/15"}`}
        />
      ))}
    </span>
  );
}

export function Sentence({ item, className = "" }: { item: Pick<WallItem, "tool" | "purposes">; className?: string }) {
  return (
    <p className={`text-pretty text-white/55 ${className}`}>
      I use <span className="font-semibold text-white">{item.tool}</span> for{" "}
      <span className="text-white">{purposePhrase(item.purposes)}</span>.
    </p>
  );
}

export function UseCaseCard({ item, mine = false }: { item: WallItem; mine?: boolean }) {
  return (
    <article
      className={`relative border bg-graphite/80 p-5 transition-colors duration-300 ${
        mine ? "mine-glow border-brand" : "border-white/10 hover:border-brand/70"
      }`}
    >
      <header className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.2em]">
        <span className="flex min-w-0 items-center gap-2 text-brand-soft">
          <Chevron className="h-2.5 w-auto shrink-0 text-brand" />
          <span className="truncate">{item.tool}</span>
        </span>
        <ImpactMeter value={item.impact} />
      </header>
      <Sentence item={item} className="mt-4 text-[17px] leading-snug" />
      <footer className="mt-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/35">
        <span>{item.practice}</span>
        {mine && <span className="font-semibold text-brand-soft">Yours</span>}
      </footer>
    </article>
  );
}

export function GhostCard() {
  return (
    <div className="border border-white/[0.07] bg-white/[0.02] p-5" aria-hidden="true">
      <div className="flex justify-between">
        <div className="h-2.5 w-24 bg-white/10" />
        <div className="h-2.5 w-10 bg-white/10" />
      </div>
      <div className="mt-5 space-y-2.5">
        <div className="h-3 w-full bg-white/[0.07]" />
        <div className="h-3 w-4/5 bg-white/[0.07]" />
        <div className="h-3 w-2/3 bg-white/[0.07]" />
      </div>
      <div className="mt-6 h-2 w-16 bg-white/[0.06]" />
    </div>
  );
}
