"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Insights" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/practices", label: "Practices" },
  { href: "/admin/barriers", label: "What's held you back" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-b border-white/10">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              active ? "border-brand text-white" : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
