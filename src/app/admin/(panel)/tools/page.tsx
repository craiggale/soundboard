import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolsEditor } from "@/components/admin/ToolsEditor";
import { PageIntro } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminData } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Tools · Admin · Soundboard" };

async function ToolsContent() {
  await requireAdmin();
  const data = await getAdminData();
  return <ToolsEditor tools={data.tools} categories={data.categories} />;
}

export default function Page() {
  return (
    <>
      <PageIntro title="Tools">
        The cards people swipe through. Hide a tool to take it out of the deck without losing its history. Tools with ratings can't be deleted.
      </PageIntro>
      <Suspense fallback={<p className="text-white/40">Loading…</p>}>
        <ToolsContent />
      </Suspense>
    </>
  );
}
