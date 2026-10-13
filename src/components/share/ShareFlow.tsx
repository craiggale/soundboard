"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { areasOf, buildDeck, purposesOf, type Catalog } from "@/lib/catalog";
import { rememberMine } from "@/lib/mine";
import type { WallItem } from "@/lib/sentence";
import { BrandMark, Chevron } from "../Chevron";
import { RevealText } from "../RevealText";
import { UseCaseCard } from "../UseCaseCard";
import { SwipeDeck, type Rating } from "./SwipeDeck";
import { Chip, Eyebrow, Footer, GhostButton, PrimaryButton, PrimaryLink, StepTitle } from "./ui";

type Step = "practice" | "areas" | "deck" | "barriers" | "done";

const EASE = [0.16, 1, 0.3, 1] as const;
const SWIPE = [0.76, 0, 0.24, 1] as const;
const DONE_CARD_LIMIT = 6;

export function ShareFlow({ catalog }: { catalog: Catalog }) {
  const [run, setRun] = useState(0);
  const completed = useRef(false);

  // Next keeps this page alive in the background after navigating away. Once a response is
  // submitted, start afresh next time; a half-finished flow keeps its progress.
  useLayoutEffect(
    () => () => {
      if (completed.current) {
        completed.current = false;
        setRun((n) => n + 1);
      }
    },
    [],
  );

  return <Flow key={run} catalog={catalog} onComplete={() => (completed.current = true)} />;
}

function Flow({ catalog, onComplete }: { catalog: Catalog; onComplete: () => void }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("practice");
  const [direction, setDirection] = useState(1);
  const [wipes, setWipes] = useState(0);

  const [practice, setPractice] = useState<string | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [barriers, setBarriers] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<WallItem[]>([]);

  const deck = useMemo(() => buildDeck(catalog, areas), [catalog, areas]);
  const areaOptions = useMemo(() => areasOf(catalog), [catalog]);
  const purposes = useMemo(() => purposesOf(catalog), [catalog]);
  const usesAny = Object.values(ratings).some((r) => r.verdict === "uses");

  function go(next: Step, dir = 1) {
    setError(null);
    setDirection(dir);
    setWipes((count) => count + 1);
    setStep(next);
    window.scrollTo({ top: 0 });
  }

  function rate(tool: string, rating: Rating | null) {
    setRatings((current) => {
      const next = { ...current };
      if (rating) next[tool] = rating;
      else delete next[tool];
      return next;
    });
  }

  async function submit(withBarriers: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practice,
          areas,
          ratings: Object.entries(ratings).map(([tool, rating]) => ({ tool, ...rating })),
          barriers: withBarriers ? barriers : [],
          note: withBarriers ? note.trim() || undefined : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      const items: WallItem[] = data.items ?? [];
      rememberMine(items.map((item) => item.id));
      setCreated(items);
      onComplete();
      go("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const flow: Step[] = ["practice", "areas", "deck", ...(step === "barriers" ? (["barriers"] as const) : [])];
  const current = step === "done" ? flow.length : flow.indexOf(step);

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: reduce ? 0 : 80 * dir, filter: "blur(10px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.75, ease: EASE, delay: reduce ? 0 : 0.2 } },
    exit: (dir: number) => ({
      opacity: 0,
      x: reduce ? 0 : -60 * dir,
      filter: "blur(6px)",
      transition: { duration: 0.35, ease: [0.7, 0, 0.84, 0] as const },
    }),
  };

  function renderStep() {
    switch (step) {
      case "practice":
        return (
          <>
            <Eyebrow>Step 1 · About you</Eyebrow>
            <StepTitle>Where do you sit at Song?</StepTitle>
            <ul className="mt-10 border-t border-white/10">
              {catalog.practices.map(({ name: option, summary }, i) => (
                <li key={option} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setPractice(option);
                      go("areas");
                    }}
                    className="group flex w-full items-center gap-6 py-4 text-left"
                  >
                    <span className="w-8 shrink-0 text-sm tabular-nums text-white/30 transition-colors group-hover:text-brand-soft">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="transition-transform duration-500 ease-expo group-hover:translate-x-3">
                      <span
                        className={`block text-[clamp(1.4rem,2.6vw,2.1rem)] font-semibold leading-tight tracking-tight ${
                          practice === option ? "text-brand-soft" : ""
                        }`}
                      >
                        {option}
                      </span>
                      <span className="mt-0.5 block text-sm text-white/45">{summary}</span>
                    </span>
                    <Chevron className="ml-auto h-7 w-auto -translate-x-4 text-brand opacity-0 transition-all duration-500 ease-expo group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        );

      case "areas":
        return (
          <>
            <Eyebrow>Step 2 · Your work</Eyebrow>
            <StepTitle>Which of these are part of your work?</StepTitle>
            <p className="mt-5 max-w-2xl text-lg text-white/55">
              Pick as many as you like. We&apos;ll show you the tools for those areas, plus the everyday assistants
              and the tools emerging at Song.
            </p>
            <div className="mt-10 flex flex-wrap gap-2.5">
              {areaOptions.map((area) => {
                const selected = areas.includes(area.id);
                return (
                  <Chip
                    key={area.id}
                    selected={selected}
                    onClick={() =>
                      setAreas((current) => (selected ? current.filter((a) => a !== area.id) : [...current, area.id]))
                    }
                  >
                    {area.label}
                  </Chip>
                );
              })}
            </div>
            <Footer>
              <GhostButton onClick={() => go("practice", -1)}>Back</GhostButton>
              <PrimaryButton onClick={() => go("deck")}>Start swiping</PrimaryButton>
              <span className="text-sm tabular-nums text-white/40">{deck.length} tools in your deck</span>
            </Footer>
          </>
        );

      case "deck":
        return (
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
            <div>
              <Eyebrow>Step 3 · Your tools</Eyebrow>
              <StepTitle>Swipe the tools.</StepTitle>
              <ul className="mt-8 hidden space-y-3 text-white/60 lg:block">
                <Instruction keyHint="→">Right if you use it, then tell us what for</Instruction>
                <Instruction keyHint="←">Left if you don&apos;t</Instruction>
                <Instruction keyHint="↑">Up if you&apos;ve never heard of it</Instruction>
              </ul>
              <p className="mt-3 text-sm text-white/55 lg:hidden">→ I use it · ← Don&apos;t use · ↑ Never heard of it</p>
              {error && (
                <p role="alert" className="mt-6 text-brand-pale">
                  {error}
                </p>
              )}
              <div className="mt-10 hidden lg:block">
                <GhostButton onClick={() => go("areas", -1)}>Back</GhostButton>
              </div>
            </div>
            <SwipeDeck
              deck={deck}
              purposes={purposes}
              ratings={ratings}
              onRate={rate}
              finishing={saving}
              onFinish={() => (usesAny ? submit(false) : go("barriers"))}
            />
          </div>
        );

      case "barriers":
        return (
          <>
            <Eyebrow>Step 4 · What&apos;s in the way</Eyebrow>
            <StepTitle>Fair enough. What&apos;s held you back so far?</StepTitle>
            <p className="mt-5 text-lg text-white/55">Pick any that apply. This is just as useful to us.</p>
            <div className="mt-10 flex flex-wrap gap-2.5">
              {catalog.barriers.map((barrier) => (
                <Chip
                  key={barrier}
                  selected={barriers.includes(barrier)}
                  onClick={() =>
                    setBarriers((current) =>
                      current.includes(barrier) ? current.filter((b) => b !== barrier) : [...current, barrier],
                    )
                  }
                >
                  {barrier}
                </Chip>
              ))}
            </div>
            <label className="mt-12 block max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
                Anything else? <span className="text-white/30">Optional</span>
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="e.g. I'd use Copilot more if I knew what it could do"
                className="mt-3 w-full resize-none border-b-2 border-white/20 bg-transparent py-2 text-xl outline-none transition-colors placeholder:text-white/25 focus:border-brand focus-visible:outline-none"
              />
            </label>
            {error && (
              <p role="alert" className="mt-6 text-brand-pale">
                {error}
              </p>
            )}
            <Footer>
              <GhostButton onClick={() => go("deck", -1)}>Back</GhostButton>
              <PrimaryButton disabled={(barriers.length === 0 && !note.trim()) || saving} onClick={() => submit(true)}>
                {saving ? "Sending…" : "Send"}
              </PrimaryButton>
            </Footer>
          </>
        );

      case "done":
        if (created.length === 0) {
          return (
            <>
              <RevealText
                text="Thank you. That really helps."
                className="text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.035em]"
              />
              <FadeUp delay={0.6}>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/60">
                  Knowing what gets in the way matters as much as knowing what works. Take a look at how colleagues
                  are using AI. You might spot something worth trying.
                </p>
                <Footer>
                  <PrimaryLink href="/">See the board</PrimaryLink>
                </Footer>
              </FadeUp>
            </>
          );
        }
        return (
          <>
            <RevealText
              text="You're on the board."
              highlight={["board"]}
              className="text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[1] tracking-[-0.035em]"
            />
            <FadeUp delay={0.5}>
              <p className="mt-6 text-lg text-white/60">
                Thanks for adding your voice. Here&apos;s your AI kit, most valued first.
              </p>
            </FadeUp>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {created.slice(0, DONE_CARD_LIMIT).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={reduce ? false : { opacity: 0, y: 48, scale: 0.94, rotate: -1.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.7 + i * 0.1 }}
                >
                  <UseCaseCard item={item} mine />
                </motion.div>
              ))}
            </div>
            <FadeUp delay={0.9 + Math.min(created.length, DONE_CARD_LIMIT) * 0.1}>
              {created.length > DONE_CARD_LIMIT && (
                <p className="mt-4 text-sm text-white/45">+ {created.length - DONE_CARD_LIMIT} more on the board</p>
              )}
              <Footer>
                <PrimaryLink href="/">See the board</PrimaryLink>
              </Footer>
            </FadeUp>
          </>
        );
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      {step === "done" && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_75%_70%,rgb(161_0_255/0.28),transparent_60%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.4 }}
        />
      )}

      <header className="relative z-10 flex items-center justify-between gap-6 px-6 py-6 sm:px-10 lg:px-14">
        <Link href="/" aria-label="Soundboard home">
          <BrandMark />
        </Link>
        {step !== "done" && <Progress total={flow.length} current={current} />}
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
        >
          Close
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center px-6 pb-16 pt-4 sm:px-10 lg:px-14">
        <div className={`mx-auto w-full ${step === "deck" ? "max-w-6xl" : "max-w-4xl"}`}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {!reduce && wipes > 0 && <Wipe key={wipes} />}
    </div>
  );
}

function Instruction({ keyHint, children }: { keyHint: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-4">
      <kbd className="flex h-9 w-9 items-center justify-center border border-white/20 font-sans text-sm text-white/80">
        {keyHint}
      </kbd>
      {children}
    </li>
  );
}

function FadeUp({ children, delay }: { children: ReactNode; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Wipe() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {[
        { color: "text-brand-deep", delay: 0 },
        { color: "text-brand", delay: 0.08 },
      ].map(({ color, delay }) => (
        <motion.svg
          key={color}
          viewBox="0 0 64 100"
          preserveAspectRatio="none"
          className={`absolute inset-y-0 left-0 h-full w-[34vw] min-w-56 ${color}`}
          initial={{ x: "-100%" }}
          animate={{ x: "100vw" }}
          transition={{ duration: 0.95, ease: SWIPE, delay }}
        >
          <path d="M0 0h26l38 50-38 50H0l38-50z" fill="currentColor" />
        </motion.svg>
      ))}
    </div>
  );
}

function Progress({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <Chevron
          key={i}
          className={`h-3 w-auto transition-colors duration-500 ${
            i < current ? "text-brand" : i === current ? "text-brand-soft" : "text-white/15"
          }`}
        />
      ))}
    </div>
  );
}
