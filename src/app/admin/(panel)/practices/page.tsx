import type { Metadata } from "next";
import { Suspense } from "react";
import { PracticesEditor } from "@/components/admin/AdminLists";
import { PageIntro } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminData } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Practices · Admin · Soundboard" };

async function PracticesContent() {
  await requireAdmin();
  const data = await getAdminData();
  return <PracticesEditor practices={data.practices} />;
}

export default function Page() {
  return (
    <>
      <PageIntro title="Practices">
        The first question: where people sit at Song. Renaming a practice updates past responses too.
      </PageIntro>
      <Suspense fallback={<p className="text-white/40">Loading…</p>}>
        <PracticesContent />
      </Suspense>
    </>
  );
}
