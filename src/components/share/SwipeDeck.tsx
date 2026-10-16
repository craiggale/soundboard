"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Access, CatalogTool, Purpose, Verdict } from "@/lib/catalog";
import { Chevron } from "../Chevron";
import { LogoMark, LogoTile } from "../ToolLogo";
import { ImpactPicker } from "./ImpactPicker";
import { Chip, GhostButton, PrimaryButton } from "./ui";

export type Rating = { verdict: Verdict; impact?: number; purposes?: string[]; access?: Access };
type Exit = "left" | "right" | "up" | "back";

const EASE = [0.16, 1, 0.3, 1] as const;
const THRESHOLD = 110;
const FLICK = 650;

const exitVariants = {
  // On undo the current card slides back into the stack rather than being thrown away.
  exit: (dir: Exit) =>
    dir === "back"
      ? { scale: 0.955, y: 24, opacity: 0, transition: { duration: 0.3 } }
      : {
    x: dir === "right" ? 560 : dir === "left" ? -560 : 0,
    y: dir === "up" ? -640 : 40,
    rotate: dir === "right" ? 20 : dir === "left" ? -20 : 0,
    opacity: 0,
    transition: { duration: 0.5, ease: [0.32, 0, 0.67, 0] as const },
        },
};

type Props = {
  deck: CatalogTool[];
  purposes: Purpose[];
  ratings: Record<string, Rating>;
  onRate: (tool: string, rating: Rating | null) => void;
  onFinish: () => void;
  finishing: boolean;
};

export function SwipeDeck({ deck, purposes, ratings, onRate, onFinish, finishing }: Props) {
  const purposeLabels = new Map(purposes.map((p) => [p.id, p.label]));
  const reduce = useReducedMotion();
  const [exit, setExit] = useState<Exit>("left");
  const [flipped, setFlipped] = useState(false);
  const history = useRef<string[]>([]);

  const queue = deck.filter((tool) => !ratings[tool.name]);
  const current = queue[0];
  const rated = deck.length - queue.length;
  const uses = deck.filter((tool) => ratings[tool.name]?.verdict === "uses").length;

  function decide(verdict: Verdict) {
    if (!current || flipped) return;
    if (verdict === "uses") {
      setFlipped(true);
      return;
    }
    setExit(verdict === "unaware" ? "up" : "left");
    history.current.push(current.name);
    onRate(current.name, { verdict });
  }

  function confirmUse(rating: { impact: number; purposes: string[]; access?: Access }) {
    if (!current) return;
    setExit("right");
    setFlipped(false);
    history.current.push(current.name);
    onRate(current.name, { verdict: "uses", ...rating });
  }

  function undo() {
    const last = history.current.pop();
    if (last) {
      setExit("back");
      setFlipped(false);
      onRate(last, null);
    }
  }

  const decideRef = useRef(decide);
  decideRef.current = decide;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea")) return;
      const verdict = { ArrowRight: "uses", ArrowLeft: "not_used", ArrowUp: "unaware" }[event.key] as Verdict | undefined;
      if (verdict) {
        event.preventDefault();
        decideRef.current(verdict);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <div
        className={`relative mx-auto w-full max-w-[380px] transition-[height] duration-500 ease-expo ${
          flipped ? "h-[min(78dvh,620px)] sm:h-[min(86dvh,680px)]" : "h-[min(58dvh,460px)] sm:h-[min(66dvh,506px)]"
        }`}
        style={{ perspective: 1400 }}
      >
        {queue.slice(1, 3).map((tool, i) => (
          <div
            key={tool.name}
            aria-hidden="true"
            className="absolute inset-0 transition-transform duration-500 ease-expo"
            style={{ transform: `translateY(${(i + 1) * 24}px) scale(${1 - (i + 1) * 0.045})`, filter: `brightness(${0.7 - i * 0.25})`, zIndex: 2 - i }}
          >
            <CardFront tool={tool} purposeLabels={purposeLabels} />
          </div>
        ))}

        <AnimatePresence custom={exit}>
          {current ? (
            <SwipeCard
              key={current.name}
              tool={current}
              purposes={purposes}
              purposeLabels={purposeLabels}
              flipped={flipped}
              reduce={Boolean(reduce)}
              onDecide={decide}
              onConfirm={confirmUse}
              onCancel={() => setFlipped(false)}
            />
          ) : (
            <motion.div
              key="done"
              className="absolute inset-0 z-10 flex flex-col justify-end border border-brand bg-graphite p-8"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Chevron className="mb-auto h-14 w-auto self-start text-brand" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft">That&apos;s the deck</p>
              <p className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.03em]">
                {uses > 0 ? `You use ${uses} of ${deck.length}.` : "None of these yet."}
              </p>
              <p className="mt-3 text-white/55">
                {uses > 0 ? "Add them to the board to see how you compare." : "That's useful to know. One more quick question."}
              </p>
              <PrimaryButton className="mt-8 self-start" onClick={onFinish} disabled={finishing}>
                {finishing ? "Adding…" : uses > 0 ? "Add to the board" : "Continue"}
              </PrimaryButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-5 grid max-w-[380px] grid-cols-3 gap-2 sm:mt-8">
        <DeckButton disabled={!current || flipped} onClick={() => decide("not_used")} hint="←">
          Don&apos;t use
        </DeckButton>
        <DeckButton disabled={!current || flipped} onClick={() => decide("unaware")} hint="↑">
          Never heard of it
        </DeckButton>
        <DeckButton disabled={!current || flipped} onClick={() => decide("uses")} hint="→" primary>
          I use it
        </DeckButton>
      </div>

      <div className="mx-auto mt-5 flex max-w-[380px] items-center justify-between text-sm">
        <span className="tabular-nums text-white/40">
          {Math.min(rated + 1, deck.length)} of {deck.length}
        </span>
        <div className="flex gap-5">
          <GhostButton onClick={undo} disabled={history.current.length === 0} className="disabled:opacity-30">
            Undo
          </GhostButton>
          {current && rated > 0 && <GhostButton onClick={onFinish}>I&apos;m done</GhostButton>}
        </div>
      </div>
    </div>
  );
}

function DeckButton({
  children,
  hint,
  primary,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { hint: string; primary?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex min-h-16 flex-col items-center justify-center gap-1 border px-2 py-3 text-center text-[13px] font-semibold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        primary
          ? "border-brand bg-brand enabled:hover:bg-brand-deep"
          : "border-white/15 enabled:hover:border-brand-soft enabled:hover:bg-white/[0.04]"
      }`}
    >
      <span aria-hidden="true" className="hidden text-[11px] font-normal text-white/50 sm:block">
        {hint}
      </span>
      {children}
    </button>
  );
}

function CardFront({
  tool,
  purposeLabels,
  useOpacity,
  nopeOpacity,
  unawareOpacity,
}: {
  tool: CatalogTool;
  purposeLabels: Map<string, string>;
  useOpacity?: MotionValue<number>;
  nopeOpacity?: MotionValue<number>;
  unawareOpacity?: MotionValue<number>;
}) {
  const purposeText = tool.categoryIds.length
    ? tool.categoryIds.map((id) => purposeLabels.get(id) ?? id).join(" · ")
    : "General-purpose assistant";
  return (
    <div className="relative flex h-full flex-col overflow-hidden border border-white/12 bg-gradient-to-br from-[#1f1f1f] via-[#121212] to-ink p-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
      <LogoMark
        logo={tool.logo}
        className="pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 -rotate-6 select-none opacity-[0.05]"
      />
      {useOpacity && (
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-brand/25" style={{ opacity: useOpacity }} />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft">
          <Chevron className="h-2.5 w-auto shrink-0 text-brand" />
          {tool.category}
        </span>
        {tool.emerging && (
          <span className="shrink-0 bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">Emerging at Song</span>
        )}
      </div>

      <LogoTile logo={tool.logo} className="relative mt-8 h-[72px] w-[72px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.9)]" />

      <h2 className="relative mt-auto break-words text-[clamp(2.4rem,9vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-balance">
        {tool.name}
      </h2>
      <p className="relative mt-4 text-sm text-white/45">{purposeText}</p>

      {useOpacity && nopeOpacity && unawareOpacity && (
        <>
          <Stamp opacity={useOpacity} className="left-6 top-20 -rotate-12 border-brand-soft text-brand-soft">
            I use it
          </Stamp>
          <Stamp opacity={nopeOpacity} className="right-6 top-20 rotate-12 border-white/70 text-white/80">
            Don&apos;t use
          </Stamp>
          <Stamp opacity={unawareOpacity} className="left-1/2 top-1/3 -translate-x-1/2 border-brand-pale text-brand-pale">
            Never heard of it
          </Stamp>
        </>
      )}
    </div>
  );
}

function Stamp({ opacity, className, children }: { opacity: MotionValue<number>; className: string; children: ReactNode }) {
  return (
    <motion.span
      aria-hidden="true"
      style={{ opacity }}
      className={`pointer-events-none absolute whitespace-nowrap border-2 px-3 py-1.5 text-base font-bold uppercase tracking-[0.18em] ${className}`}
    >
      {children}
    </motion.span>
  );
}

function SwipeCard({
  tool,
  purposes,
  purposeLabels,
  flipped,
  reduce,
  onDecide,
  onConfirm,
  onCancel,
}: {
  tool: CatalogTool;
  purposes: Purpose[];
  purposeLabels: Map<string, string>;
  flipped: boolean;
  reduce: boolean;
  onDecide: (verdict: Verdict) => void;
  onConfirm: (rating: { impact: number; purposes: string[]; access?: Access }) => void;
  onCancel: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-14, 14]);
  const useOpacity = useTransform(x, [30, THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-THRESHOLD, -30], [1, 0]);
  const unawareOpacity = useTransform(y, [-THRESHOLD, -30], [1, 0]);

  const [chosen, setChosen] = useState<string[]>(tool.categoryIds);
  const [impact, setImpact] = useState<number | null>(null);
  const [provided, setProvided] = useState(false);
  const ready = Boolean(impact) && chosen.length > 0;

  return (
    <motion.div
      className={`absolute inset-0 z-10 ${flipped ? "" : "cursor-grab touch-none active:cursor-grabbing"}`}
      style={{ x, y, rotate }}
      drag={!flipped}
      dragSnapToOrigin
      dragElastic={0.85}
      onDragEnd={(_, { offset, velocity }) => {
        if (offset.x > THRESHOLD || velocity.x > FLICK) onDecide("uses");
        else if (offset.x < -THRESHOLD || velocity.x < -FLICK) onDecide("not_used");
        else if (offset.y < -THRESHOLD || velocity.y < -FLICK) onDecide("unaware");
      }}
      initial={reduce ? false : { scale: 0.955, y: 24, opacity: 0.6 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      variants={exitVariants}
      exit="exit"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: reduce ? 0 : 0.75, ease: EASE }}
      >
        <div className="absolute inset-0 [-webkit-backface-visibility:hidden] [backface-visibility:hidden]">
          <CardFront tool={tool} purposeLabels={purposeLabels} useOpacity={useOpacity} nopeOpacity={nopeOpacity} unawareOpacity={unawareOpacity} />
        </div>

        <div
          className="absolute inset-0 flex flex-col overflow-y-auto border border-brand bg-graphite px-5 pt-5 [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft">
            <LogoTile logo={tool.logo} className="h-6 w-6" />
            {tool.name}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.02em]">What do you use it for?</h3>
          <div className="mt-3 flex flex-wrap gap-1">
            {purposes.map((purpose) => {
              const selected = chosen.includes(purpose.id);
              return (
                <Chip
                  key={purpose.id}
                  size="sm"
                  selected={selected}
                  onClick={() =>
                    setChosen((current) =>
                      selected ? current.filter((p) => p !== purpose.id) : [...current, purpose.id],
                    )
                  }
                >
                  {purpose.label}
                </Chip>
              );
            })}
          </div>
          {tool.askAccess && (
            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={provided}
                onChange={(event) => setProvided(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#a100ff]"
              />
              <span>
                <span className="block text-sm font-medium text-white/85">Accenture-provided version</span>
                <span className="mt-0.5 block text-xs text-white/40">
                  Tick if you use it through an Accenture licence or account. Anonymous, and never shown on the board.
                </span>
              </span>
            </label>
          )}
          <div className="mt-6">
            <ImpactPicker legend="How much would you miss it?" value={impact} onChange={setImpact} />
          </div>
          <div className="sticky bottom-0 -mx-5 mt-auto flex items-center justify-between gap-4 border-t border-white/10 bg-graphite px-5 py-4">
            <GhostButton onClick={onCancel}>Back</GhostButton>
            <PrimaryButton
              disabled={!ready}
              onClick={() =>
                impact &&
                onConfirm({
                  impact,
                  purposes: chosen,
                  access: tool.askAccess ? ((provided ? "enterprise" : "personal") satisfies Access) : undefined,
                })
              }
            >
              Next
            </PrimaryButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
