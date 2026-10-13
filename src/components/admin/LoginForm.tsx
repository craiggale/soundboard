"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { Chevron } from "../Chevron";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <form action={action} className="mt-10">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Password</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-3 block w-full border-b-2 border-white/20 bg-transparent py-3 text-xl outline-none transition-colors focus:border-brand focus-visible:outline-none"
        />
      </label>
      {state.error && (
        <p role="alert" className="mt-4 text-sm text-brand-pale">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="group mt-8 inline-flex items-center gap-4 bg-brand px-7 py-4 font-semibold transition-colors hover:bg-brand-deep disabled:bg-white/10 disabled:text-white/40"
      >
        {pending ? "Signing in…" : "Sign in"}
        <Chevron className="h-3.5 w-auto" />
      </button>
    </form>
  );
}
