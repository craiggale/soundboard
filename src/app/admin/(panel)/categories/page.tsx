import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoriesEditor } from "@/components/admin/AdminLists";
import { PageIntro } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminData } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Categories · Admin · Soundboard" };

async function CategoriesContent() {
  await requireAdmin();
  const data = await getAdminData();
  return <CategoriesEditor categories={data.categories} />;
}

export default function Page() {
  return (
    <>
      <PageIntro title="Categories">
        Each category groups tools on the card. If it has a purpose, people can pick it as an area of their work and tag tools with it. “Always in the deck” categories are shown to everyone. Order here sets the deck and chip order.
      </PageIntro>
      <Suspense fallback={<p className="text-white/40">Loading…</p>}>
        <CategoriesContent />
      </Suspense>
    </>
  );
}
