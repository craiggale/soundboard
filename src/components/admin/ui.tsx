"use client";

import { useState, useTransition, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import type { ActionResult } from "@/app/admin/actions";

export function useAdminAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onSuccess?.();
    });
  }

  return { pending, error, run };
}

export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-10 max-w-3xl">
      <h1 className="text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{title}</h1>
      <p className="mt-3 text-white/55">{children}</p>
    </div>
  );
}

export function Field({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</span>
      <input
        {...props}
        className="mt-1.5 block w-full border border-white/15 bg-ink px-3 py-2 text-[15px] outline-none transition-colors placeholder:text-white/25 focus:border-brand focus-visible:outline-none"
      />
    </label>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-sm text-white/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 cursor-pointer accent-[#a100ff]"
      />
      {label}
    </label>
  );
}

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "border-brand bg-brand text-white enabled:hover:bg-brand-deep",
    secondary: "border-white/20 text-white/85 enabled:hover:border-brand-soft enabled:hover:text-white",
    danger: "border-white/15 text-white/60 enabled:hover:border-red-400 enabled:hover:text-red-300",
    ghost: "border-transparent text-white/50 enabled:hover:text-white",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${styles} ${className}`}
    />
  );
}

export function MoveButtons({
  onMove,
  first,
  last,
  disabled,
}: {
  onMove: (direction: -1 | 1) => void;
  first: boolean;
  last: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex">
      <Button variant="ghost" aria-label="Move up" disabled={first || disabled} onClick={() => onMove(-1)}>
        ↑
      </Button>
      <Button variant="ghost" aria-label="Move down" disabled={last || disabled} onClick={() => onMove(1)}>
        ↓
      </Button>
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "brand" }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${
        tone === "brand" ? "bg-brand text-white" : "border border-white/20 text-white/55"
      }`}
    >
      {children}
    </span>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-brand-pale">
      {children}
    </p>
  );
}
