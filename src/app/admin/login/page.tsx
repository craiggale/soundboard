import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/Chevron";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in · Soundboard",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-14">
      <Link href="/" aria-label="Soundboard home" className="self-start">
        <BrandMark />
      </Link>
      <div className="my-auto w-full max-w-md self-center py-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-soft">Admin</p>
        <h1 className="text-4xl font-semibold tracking-[-0.03em]">Sign in</h1>
        <p className="mt-3 text-white/55">For the team running Soundboard. Insights and catalogue settings live here.</p>
        <LoginForm />
      </div>
    </main>
  );
}
