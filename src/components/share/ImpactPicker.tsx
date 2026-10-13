"use client";

import { AnimatePresence, motion } from "motion/react";
import { IMPACT_LABELS } from "@/lib/catalog";

const EASE = [0.16, 1, 0.3, 1] as const;
const ARROW_SEGMENT =
  "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)";

export function ImpactPicker({
  value,
  onChange,
  legend,
}: {
  value: number | null;
  onChange: (value: number) => void;
  legend: string;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">{legend}</legend>
      <div className="mt-3 flex gap-1">
        {IMPACT_LABELS.map((label, i) => {
          const level = i + 1;
          const filled = value != null && level <= value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={value === level}
              aria-label={label}
              onClick={() => onChange(level)}
              style={{ clipPath: ARROW_SEGMENT }}
              className="relative flex h-10 flex-1 items-center justify-center bg-white/[0.08] transition-colors hover:bg-white/[0.16]"
            >
              <motion.span
                className="absolute inset-0 origin-left bg-brand"
                initial={false}
                animate={{ scaleX: filled ? 1 : 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: filled ? i * 0.05 : 0 }}
              />
              <span className="relative text-xs font-semibold tabular-nums text-white/70">{level}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 h-5 text-sm">
        <AnimatePresence mode="wait">
          <motion.span
            key={value ?? "none"}
            className={value ? "font-semibold text-brand-soft" : "text-white/35"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {value ? IMPACT_LABELS[value - 1] : `${IMPACT_LABELS[0]} → ${IMPACT_LABELS[4].toLowerCase()}`}
          </motion.span>
        </AnimatePresence>
      </div>
    </fieldset>
  );
}
