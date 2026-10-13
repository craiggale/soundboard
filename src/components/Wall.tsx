"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { WallItem } from "@/lib/sentence";
import { readMine, takeJustAdded } from "@/lib/mine";
import { GhostCard, UseCaseCard } from "./UseCaseCard";
import { Chevron } from "./Chevron";

const COLUMN_VISIBILITY: Record<3 | 5, string[]> = {
  // The landing wall only gets half the screen from lg, so it drops to two columns until xl.
  3: ["flex", "hidden sm:flex", "hidden md:flex lg:hidden xl:flex"],
  5: ["flex", "hidden sm:flex", "hidden md:flex", "hidden lg:flex", "hidden xl:flex"],
};
const MIN_PER_COLUMN = 6;
const SECONDS_PER_CARD = 7;

function distribute(items: WallItem[], columns: number, mine: Set<string>): WallItem[][] {
  const cols = Array.from({ length: columns }, () => [] as WallItem[]);
  const pinned = items.filter((item) => mine.has(item.id));
  const rest = items.filter((item) => !mine.has(item.id));
  cols[0].push(...pinned);

  let pool = rest.length ? rest : pinned;
  while (pool.length && pool.length < columns * MIN_PER_COLUMN) pool = pool.concat(rest.length ? rest : pinned);
  pool.forEach((item, i) => cols[i % columns].push(item));
  return cols;
}

type Props = {
  items: WallItem[];
  columns?: 3 | 5;
  emptyMessage?: string;
};

export function Wall({ items, columns = 3, emptyMessage }: Props) {
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setMine(readMine());
    if (takeJustAdded()) {
      setJustAdded(true);
      const timer = setTimeout(() => setJustAdded(false), 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  const cols = useMemo(() => distribute(items, columns, mine), [items, columns, mine]);

  if (items.length === 0) {
    return (
      <div className="relative h-full">
        <div className="mask-fade-y flex h-full gap-4 overflow-hidden px-4 opacity-60">
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className={`${COLUMN_VISIBILITY[columns][i]} min-w-0 flex-1 flex-col gap-4 pt-[12vh]`}>
              {Array.from({ length: 5 }, (_, j) => (
                <GhostCard key={j} />
              ))}
            </div>
          ))}
        </div>
        {emptyMessage && (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-8 text-center text-xl font-medium text-white/70">
            {emptyMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="mask-fade-y flex h-full gap-4 overflow-hidden px-4">
        {cols.map((col, i) => {
          const style = {
            "--marquee-name": i % 2 === 0 ? "marquee-down" : "marquee-up",
            "--marquee-duration": `${col.length * SECONDS_PER_CARD}s`,
            animationDelay: i === 0 ? "0s" : `-${i * 9}s`,
          } as CSSProperties;
          return (
            <div key={i} className={`marquee-column ${COLUMN_VISIBILITY[columns][i]} min-w-0 flex-1 flex-col`}>
              <div className="marquee-track" style={style}>
                {[0, 1].map((copy) => (
                  <div key={copy} aria-hidden={copy === 1 || undefined}>
                    {col.map((item, j) => (
                      <div key={`${item.id}-${j}`} className="pb-4">
                        <UseCaseCard item={item} mine={mine.has(item.id)} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {justAdded && (
          <motion.div
            role="status"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.6, duration: 0.7, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ y: 20, opacity: 0, transition: { duration: 0.4 } }}
            className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap bg-brand px-5 py-3 text-sm font-semibold shadow-[0_20px_60px_-10px_rgb(161_0_255/0.7)]"
          >
            <Chevron className="h-3 w-auto" />
            You&apos;re on the board. Look for the glow.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
