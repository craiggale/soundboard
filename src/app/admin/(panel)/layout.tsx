import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/Chevron";
import { AdminNav } from "@/components/admin/AdminNav";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: "Admin · Soundboard",
  robots: { index: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-14">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Soundboard home">
            <BrandMark />
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-soft">Admin</span>
        </div>
        <form action={logout}>
          <button className="text-xs font-medium uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white">
            Sign out
          </button>
        </form>
      </header>
      <AdminNav />
      <main className="mt-12 pb-24">{children}</main>
    </div>
  );
}
