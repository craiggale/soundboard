"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Chevron } from "../Chevron";

const PRIMARY =
  "group inline-flex items-center gap-4 bg-brand px-7 py-4 text-base font-semibold transition-all duration-300 hover:bg-brand-deep";

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={PRIMARY}>
      {children}
      <Chevron className="h-3.5 w-auto transition-transform duration-500 ease-expo group-hover:translate-x-1.5" />
    </Link>
  );
}

export function Footer({ children }: { children: ReactNode }) {
  return <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4">{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-brand-soft">{children}</p>;
}

export function StepTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance">
      {children}
    </h1>
  );
}

export function PrimaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${PRIMARY} disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 ${className}`}
    >
      {children}
      <Chevron className="h-3.5 w-auto transition-transform duration-500 ease-expo group-enabled:group-hover:translate-x-1.5" />
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`text-sm font-medium text-white/50 underline-offset-4 transition-colors hover:text-white hover:underline ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({
  selected,
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...props}
      className={`inline-flex items-center border font-medium transition-all duration-300 ease-expo disabled:cursor-not-allowed disabled:opacity-30 ${
        size === "sm" ? "gap-1.5 px-2 py-1 text-[12px]" : "gap-2 px-4 py-2.5 text-[15px]"
      } ${
        selected
          ? "border-brand bg-brand text-white"
          : "border-white/15 text-white/80 enabled:hover:border-brand-soft enabled:hover:text-white"
      }`}
    >
      {selected && <Chevron className="h-2.5 w-auto" />}
      {children}
    </button>
  );
}
