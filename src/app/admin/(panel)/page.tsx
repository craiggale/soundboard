import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Chevron } from "@/components/Chevron";
import { BarList } from "@/components/insights/BarList";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllResponses, getLabels } from "@/lib/data";
import { computeInsights } from "@/lib/insights";

export const metadata: Metadata = {
  title: "Insights · Soundboard",
};

const TOP_TOOLS = 15;
const pct = (value: number) => `${Math.round(value * 100)}%`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="border border-white/10 bg-graphite/60 p-6 sm:p-8">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-white/45">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-t border-white/15 pt-4">
      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight">{value}</p>
      {note && <p className="mt-1 text-xs text-white/40">{note}</p>}
    </div>
  );
}

async function InsightsContent({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  await requireAdmin();
  const [{ practice: param }, responses, labels] = await Promise.all([searchParams, getAllResponses(), getLabels()]);
  const practiceNames = [...new Set([...labels.practices, ...responses.map((r) => r.practice)])];
  const practice = practiceNames.find((p) => p === param);
  const data = computeInsights(responses, labels, practice);

  const filters = [{ label: "All of Song", value: undefined }, ...practiceNames.map((p) => ({ label: p, value: p }))];

  return (
    <>
      <nav aria-label="Filter by practice" className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = filter.value === practice;
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/admin?practice=${encodeURIComponent(filter.value)}` : "/admin"}
              aria-current={active ? "page" : undefined}
              className={`border px-4 py-2 text-sm font-medium transition-colors ${
                active ? "border-brand bg-brand text-white" : "border-white/15 text-white/70 hover:border-brand-soft hover:text-white"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {data.responses === 0 ? (
        <p className="mt-16 text-xl text-white/50">No responses {practice ? `from ${practice} ` : ""}yet.</p>
      ) : (
        <>
          <div className="mt-12 grid gap-10 lg:grid-cols-[auto_1fr] lg:items-end">
            <div>
              <p className="text-sm text-white/50">Responses</p>
              <p className="mt-2 text-7xl font-semibold tracking-[-0.04em] sm:text-8xl">{data.responses}</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <Stat label="Using AI in their work" value={pct(data.usingAi / data.responses)} note={plural(data.usingAi, "person", "people")} />
              <Stat
                label="Tools per AI user"
                value={data.usingAi ? (data.toolUses / data.usingAi).toFixed(1) : "0"}
                note={`${plural(data.tools.filter((t) => t.users > 0).length, "tool")} in use`}
              />
              <Stat label="Not using AI yet" value={pct(data.notUsingAi / data.responses)} note={plural(data.notUsingAi, "person", "people")} />
            </div>
          </div>

          <div className="mt-14 grid gap-6 xl:grid-cols-2">
            <Section
              title="Most-used tools"
              subtitle="People who use each tool, with how much they'd miss it (1 = nice to have, 5 = couldn't do without it)."
            >
              <BarList
                title="Tool usage"
                headers={["Tool", "People using it", "Avg impact"]}
                rows={data.tools
                  .filter((tool) => tool.users > 0)
                  .slice(0, TOP_TOOLS)
                  .map((tool) => ({
                    label: tool.name,
                    value: tool.users,
                    valueLabel: String(tool.users),
                    detail: `${pct(tool.adoption)} of people shown it · avg impact ${tool.avgImpact.toFixed(1)}`,
                    aside: tool.avgImpact.toFixed(1),
                  }))}
              />
            </Section>

            <Section
              title="What people use AI for"
              subtitle="Purposes people chose for the tools they use. One tool can serve several purposes."
            >
              <BarList
                title="Purposes"
                headers={["Purpose", "Tool uses"]}
                rows={data.purposes.map((purpose) => ({
                  label: purpose.label,
                  value: purpose.count,
                  valueLabel: String(purpose.count),
                  detail: `top tool: ${purpose.topTools[0]?.name ?? "none"}`,
                }))}
              />
            </Section>
          </div>

          {data.purposes.length > 0 && (
            <section className="mt-6 border border-white/10 bg-graphite/60 p-6 sm:p-8">
              <h2 className="text-lg font-semibold tracking-tight">The go-to tools for each purpose</h2>
              <p className="mt-1 text-sm text-white/45">The three tools people use most for each purpose.</p>
              <div className="mt-6 grid gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
                {data.purposes.map((purpose) => (
                  <div key={purpose.id}>
                    <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-soft">
                      <Chevron className="h-2.5 w-auto text-brand" />
                      {purpose.label}
                    </h3>
                    <ol className="mt-4 space-y-2">
                      {purpose.topTools.map((tool, i) => (
                        <li key={tool.name} className="flex items-baseline gap-3 border-l-2 border-white/15 pl-4 text-[15px]">
                          <span className="text-xs tabular-nums text-white/35">{i + 1}</span>
                          <span className="font-semibold text-white">{tool.name}</span>
                          <span className="ml-auto text-sm tabular-nums text-white/45">{plural(tool.count, "use")}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6">
            <Section
              title="Awareness gaps"
              subtitle="Tools people most often hadn't heard of, as a share of everyone who was shown them."
            >
              <BarList
                title="Never heard of it"
                headers={["Tool", "Never heard of it", "Emerging"]}
                rows={data.tools
                  .filter((tool) => tool.unaware > 0)
                  .sort((a, b) => b.unawareRate - a.unawareRate || b.shown - a.shown)
                  .slice(0, TOP_TOOLS)
                  .map((tool) => ({
                    label: tool.name,
                    value: tool.unawareRate,
                    valueLabel: pct(tool.unawareRate),
                    detail: `${tool.unaware} of ${plural(tool.shown, "person", "people")} shown it`,
                    aside: tool.emerging ? "Yes" : "",
                  }))}
              />
            </Section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Section title="What's holding people back" subtitle="Reasons given by people not using AI tools yet.">
              <BarList
                title="Barriers"
                headers={["Reason", "People"]}
                rows={data.barriers.map((barrier) => ({
                    label: barrier.name,
                    value: barrier.count,
                    valueLabel: String(barrier.count),
                    detail: `${pct(data.notUsingAi ? barrier.count / data.notUsingAi : 0)} of non-users`,
                  }))}
              />
            </Section>

            <Section title="Who's responded" subtitle="Responses by practice, across all of Song.">
              <BarList
                title="Responses by practice"
                headers={["Practice", "Responses"]}
                rows={data.practices.map((p) => ({
                  label: p.name,
                  value: p.count,
                  valueLabel: String(p.count),
                  detail: plural(p.count, "response"),
                }))}
              />
            </Section>
          </div>
        </>
      )}
    </>
  );
}

export default function InsightsPage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <h1 className="max-w-3xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
          What Song is telling us about <span className="text-brand">AI</span>.
        </h1>
        <a
          href="/api/export"
          className="group inline-flex items-center gap-3 border border-white/20 px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand hover:bg-brand"
        >
          Download CSV
          <Chevron className="h-2.5 w-auto text-brand-soft transition-colors group-hover:text-white" />
        </a>
      </div>
      <Suspense fallback={<p className="text-white/40">Loading insights…</p>}>
        <InsightsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
