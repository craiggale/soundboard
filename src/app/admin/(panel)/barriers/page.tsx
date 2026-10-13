import type { Metadata } from "next";
import { Suspense } from "react";
import { BarriersEditor } from "@/components/admin/AdminLists";
import { PageIntro } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminData } from "@/lib/admin-data";

export const metadata: Metadata = { title: "What's held you back · Admin · Soundboard" };

async function WhatsheldyoubackContent() {
  await requireAdmin();
  const data = await getAdminData();
  return <BarriersEditor barriers={data.barriers} />;
}

export default function Page() {
  return (
    <>
      <PageIntro title="What's held you back">
        Options shown to people who don't use any of the tools. Renaming an option updates past responses too.
      </PageIntro>
      <Suspense fallback={<p className="text-white/40">Loading…</p>}>
        <WhatsheldyoubackContent />
      </Suspense>
    </>
  );
}
