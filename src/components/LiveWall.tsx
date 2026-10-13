"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { purposePhrase, type WallItem } from "@/lib/sentence";
import { BrandMark, Chevron } from "./Chevron";
import { ImpactMeter } from "./UseCaseCard";
import { Wall } from "./Wall";

const POLL_MS = 5000;
const SPOTLIGHT_MS = 8000;
const REST_MS = 7000;
const MAX_ITEMS = 150;
const EASE = [0.16, 1, 0.3, 1] as const;

type Spotlight = { item: WallItem; fresh: boolean };

export function LiveWall({ initial, total }: { initial: WallItem[]; total: number }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState(initial);
  const [count, setCount] = useState(total);
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  const itemsRef = useRef(initial);
  const pending = useRef<WallItem[]>([]);
  const queue = useRef<WallItem[]>([]);
  const seen = useRef(new Set(initial.map((item) => item.id)));
  const latest = useRef(initial[0]?.createdAt);

  useEffect(() => {
    setShareUrl(`${window.location.host}/share`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const query = latest.current ? `?after=${encodeURIComponent(latest.current)}` : "";
        const res = await fetch(`/api/wall${query}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data: { items: WallItem[]; total: number } = await res.json();
        setCount(data.total);
        const fresh = data.items.filter((item) => !seen.current.has(item.id));
        if (!fresh.length) return;
        fresh.forEach((item) => seen.current.add(item.id));
        latest.current = fresh[0].createdAt;
        pending.current = [...fresh, ...pending.current];
        queue.current.push(...[...fresh].reverse());
      } catch {
        // Keep the wall running through network blips.
      }
    };
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const show = () => {
      const fresh = queue.current.shift();
      const pool = itemsRef.current;
      const item = fresh ?? pool[Math.floor(Math.random() * pool.length)];
      if (!item) {
        timer = setTimeout(show, REST_MS);
        return;
      }
      setSpotlight({ item, fresh: Boolean(fresh) });

      // Merge new cards while the wall is dimmed, so the reflow isn't visible.
      if (pending.current.length) {
        const additions = pending.current;
        pending.current = [];
        setTimeout(() => {
          setItems((current) => {
            const next = [...additions, ...current].slice(0, MAX_ITEMS);
            itemsRef.current = next;
            return next;
          });
        }, 700);
      }
      timer = setTimeout(hide, SPOTLIGHT_MS);
    };

    const hide = () => {
      setSpotlight(null);
      timer = setTimeout(show, queue.current.length ? 1500 : REST_MS);
    };

    timer = setTimeout(show, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden">
      <motion.div
        className="absolute inset-0 pt-28"
        animate={{
          opacity: spotlight ? 0.18 : 1,
          filter: spotlight && !reduce ? "blur(6px)" : "blur(0px)",
          scale: spotlight && !reduce ? 0.98 : 1,
        }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <Wall items={items} columns={5} emptyMessage="Waiting for the first idea…" />
      </motion.div>

      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-8 bg-gradient-to-b from-ink via-ink/90 to-transparent px-10 pb-10 pt-8">
        <div>
          <BrandMark />
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
            How is <span className="text-brand">AI</span> showing up in your work?
          </h1>
        </div>
        <div className="text-right">
          <motion.p
            key={count}
            initial={reduce ? false : { y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-5xl font-semibold tabular-nums tracking-tight"
          >
            {count}
          </motion.p>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
            {count === 1 ? "idea" : "ideas"} shared
          </p>
          {shareUrl && (
            <p className="mt-3 flex items-center justify-end gap-2 text-sm text-white/70">
              <Chevron className="h-2.5 w-auto text-brand" />
              Add yours at <span className="font-semibold text-white">{shareUrl}</span>
            </p>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {spotlight && <SpotlightCard key={spotlight.item.id + String(spotlight.fresh)} {...spotlight} />}
      </AnimatePresence>
    </main>
  );
}

function SpotlightCard({ item, fresh }: Spotlight) {
  const reduce = useReducedMotion();
  const words = [
    { text: "I use", strong: false },
    { text: item.tool, strong: true },
    { text: "for", strong: false },
    ...purposePhrase(item.purposes)
      .split(" ")
      .map((text) => ({ text, strong: false })),
  ];

  return (
    <motion.section
      aria-live="polite"
      className="absolute inset-0 z-10 flex items-center justify-center px-[8vw]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30, filter: "blur(8px)", transition: { duration: 0.6, ease: EASE } }}
    >
      <div className="max-w-6xl">
        <motion.div
          className="mb-8 flex items-center gap-4 text-sm font-semibold uppercase tracking-[0.3em]"
          initial={reduce ? false : { opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {fresh ? (
            <span className="bg-brand px-3 py-1.5 text-white">Just in</span>
          ) : (
            <span className="text-brand-soft">From the board</span>
          )}
          <span className="text-white/50">{item.practice}</span>
          <ImpactMeter value={item.impact} />
        </motion.div>
        <p className="text-[clamp(2.5rem,5.2vw,5.5rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-white/45">
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span
                className={`inline-block ${word.strong ? "text-brand-soft" : i > 2 ? "text-white" : ""}`}
                initial={reduce ? false : { y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.15 + i * 0.045 }}
              >
                {word.text}
                {i < words.length - 1 ? " " : "."}
              </motion.span>
            </span>
          ))}
        </p>
      </div>
    </motion.section>
  );
}
