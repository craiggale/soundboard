"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { BrandMark, Chevron } from "./Chevron";
import { RevealText } from "./RevealText";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: EASE, delay },
  });

  return (
    <section className="grain relative isolate flex min-h-[88dvh] flex-col overflow-hidden px-6 py-6 sm:px-10 lg:min-h-dvh lg:px-14 lg:py-10">
      <motion.svg
        viewBox="0 0 64 100"
        aria-hidden="true"
        className="pointer-events-none absolute -right-[28%] top-1/2 -z-10 h-[120%] -translate-y-1/2 text-brand-ink lg:-right-[52%]"
        initial={reduce ? false : { opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
      >
        <motion.path
          d="M0 0h26l38 50-38 50H0l38-50z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2, ease: EASE, delay: 0.3 }}
        />
      </motion.svg>

      <motion.header {...fadeUp(0)} className="flex items-center justify-between">
        <BrandMark />
        <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/50">Song Unplugged</span>
      </motion.header>

      <div className="my-auto max-w-2xl py-16">
        <motion.p
          {...fadeUp(0.1)}
          className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-brand-soft"
        >
          Song · AI in practice
        </motion.p>
        <RevealText
          text="How is AI showing up in your work?"
          highlight={["AI"]}
          delay={0.15}
          className="text-[clamp(2.75rem,6.4vw,6rem)] font-semibold leading-[0.98] tracking-[-0.035em]"
        />
        <motion.p {...fadeUp(0.75)} className="mt-8 max-w-lg text-lg leading-relaxed text-white/60">
          Swipe through the AI tools out there. Tell us which ones you use, what for, and how much
          you&apos;d miss them. It&apos;s quick, it&apos;s anonymous, and your answers join the board.
        </motion.p>
        <motion.div {...fadeUp(0.9)} className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/share"
            className="group relative inline-flex items-center gap-4 overflow-hidden bg-brand px-8 py-5 text-lg font-semibold transition-colors hover:bg-brand-deep"
          >
            Add yours
            <span className="relative flex h-4 w-6 items-center overflow-hidden">
              <Chevron className="absolute h-4 w-auto transition-transform duration-500 ease-expo group-hover:translate-x-6" />
              <Chevron className="absolute h-4 w-auto -translate-x-6 transition-transform duration-500 ease-expo group-hover:translate-x-0" />
            </span>
          </Link>
          <span className="text-sm text-white/40">A few minutes · Anonymous</span>
        </motion.div>
      </div>

      <motion.nav {...fadeUp(1.05)} className="flex gap-8 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
        <Link href="/wall" className="transition-colors hover:text-white">
          Presentation mode
        </Link>
        <Link href="/admin" className="transition-colors hover:text-white">
          Admin
        </Link>
      </motion.nav>
    </section>
  );
}
