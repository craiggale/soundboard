import type { Metadata } from "next";
import { Suspense } from "react";
import { ShareFlow } from "@/components/share/ShareFlow";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = {
  title: "Add yours · Soundboard",
};

async function ShareFlowWithCatalog() {
  return <ShareFlow catalog={await getCatalog()} />;
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ink" />}>
      <ShareFlowWithCatalog />
    </Suspense>
  );
}
