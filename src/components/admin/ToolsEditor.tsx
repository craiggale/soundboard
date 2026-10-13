"use client";

import { useMemo, useState } from "react";
import { deleteTool, saveTool } from "@/app/admin/actions";
import type { AdminCategory, AdminTool } from "@/lib/admin-data";
import { Chip } from "../share/ui";
import { LogoTile } from "../ToolLogo";
import { Badge, Button, ErrorText, Field, Toggle, useAdminAction } from "./ui";

type Draft = { name: string; emerging: boolean; hidden: boolean; categoryIds: string[]; logo: string };

export function ToolsEditor({ tools, categories }: { tools: AdminTool[]; categories: AdminCategory[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [adding, setAdding] = useState(false);

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const visible = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      (!categoryFilter || tool.categoryIds.includes(categoryFilter)),
  );

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <Field
          label="Search"
          placeholder="Find a tool"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-64"
        />
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Category</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="mt-1.5 block border border-white/15 bg-ink px-3 py-2 text-[15px] outline-none focus:border-brand"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto">
          {!adding && (
            <Button variant="primary" onClick={() => setAdding(true)}>
              Add a tool
            </Button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mt-6 border border-brand/60 bg-graphite/60 p-5">
          <ToolForm
            categories={categories}
            initial={{ name: "", emerging: false, hidden: false, logo: "", categoryIds: categoryFilter ? [categoryFilter] : [] }}
            onDone={() => setAdding(false)}
            submitLabel="Add tool"
          />
        </div>
      )}

      <p className="mt-8 text-sm text-white/40">
        {visible.length} of {tools.length} tools
      </p>
      <ul className="mt-3 divide-y divide-white/10 border-y border-white/10">
        {visible.map((tool) => (
          <ToolRow key={tool.id} tool={tool} categories={categories} categoryNames={categoryNames} />
        ))}
      </ul>
    </div>
  );
}

function ToolRow({
  tool,
  categories,
  categoryNames,
}: {
  tool: AdminTool;
  categories: AdminCategory[];
  categoryNames: Map<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const { pending, error, run } = useAdminAction();

  if (editing) {
    return (
      <li className="bg-graphite/60 p-5">
        <ToolForm
          id={tool.id}
          categories={categories}
          initial={{ ...tool, logo: tool.logoSlug }}
          ratings={tool.ratings}
          onDone={() => setEditing(false)}
          submitLabel="Save changes"
        />
      </li>
    );
  }

  return (
    <li className={`flex flex-wrap items-center gap-x-6 gap-y-2 py-3 ${tool.hidden ? "opacity-50" : ""}`}>
      <LogoTile logo={tool.logo} className="h-9 w-9" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{tool.name}</span>
          {tool.emerging && <Badge tone="brand">Emerging</Badge>}
          {tool.hidden && <Badge>Hidden</Badge>}
        </div>
        <p className="mt-0.5 truncate text-sm text-white/45">
          {tool.categoryIds.map((id) => categoryNames.get(id) ?? id).join(" · ")}
        </p>
      </div>
      <span className="w-24 text-right text-sm tabular-nums text-white/40">
        {tool.ratings} {tool.ratings === 1 ? "rating" : "ratings"}
      </span>
      <div className="flex gap-2">
        <Button
          disabled={pending}
          onClick={() =>
            run(() =>
              saveTool({
                id: tool.id,
                name: tool.name,
                emerging: tool.emerging,
                hidden: !tool.hidden,
                categoryIds: tool.categoryIds,
                logo: tool.logoSlug,
              }),
            )
          }
        >
          {tool.hidden ? "Show" : "Hide"}
        </Button>
        <Button onClick={() => setEditing(true)}>Edit</Button>
      </div>
      {error && (
        <div className="w-full">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </li>
  );
}

function ToolForm({
  id,
  categories,
  initial,
  ratings = 0,
  onDone,
  submitLabel,
}: {
  id?: string;
  categories: AdminCategory[];
  initial: Draft;
  ratings?: number;
  onDone: () => void;
  submitLabel: string;
}) {
  const [draft, setDraft] = useState<Draft>({
    name: initial.name,
    emerging: initial.emerging,
    hidden: initial.hidden,
    categoryIds: initial.categoryIds,
    logo: initial.logo,
  });
  const { pending, error, run } = useAdminAction();
  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveTool({ id, ...draft }), onDone);
      }}
      className="space-y-5"
    >
      <div className="flex flex-wrap gap-4">
        <Field
          label="Tool name"
          value={draft.name}
          onChange={(event) => set({ name: event.target.value })}
          maxLength={80}
          required
          autoFocus
          className="w-full max-w-md"
        />
        <div>
          <Field
            label="Logo"
            value={draft.logo}
            onChange={(event) => set({ logo: event.target.value })}
            maxLength={80}
            placeholder="e.g. figma"
            className="w-48"
          />
          <p className="mt-1.5 max-w-xs text-xs text-white/40">
            A logo name from{" "}
            <a href="https://lobehub.com/icons" target="_blank" rel="noreferrer" className="underline hover:text-white">
              LobeHub
            </a>{" "}
            or{" "}
            <a href="https://simpleicons.org" target="_blank" rel="noreferrer" className="underline hover:text-white">
              Simple Icons
            </a>
            . Leave blank for the Accenture placeholder.
          </p>
        </div>
      </div>
      {id && ratings > 0 && initial.name !== draft.name && (
        <p className="text-sm text-white/50">Its {ratings} existing ratings will move to the new name.</p>
      )}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Categories</p>
        <p className="mt-1 text-sm text-white/40">
          The first category in the list order is the one shown on the card. Categories with a purpose are pre-selected
          when someone says they use it.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const selected = draft.categoryIds.includes(category.id);
            return (
              <Chip
                key={category.id}
                size="sm"
                selected={selected}
                onClick={() =>
                  set({
                    categoryIds: selected
                      ? draft.categoryIds.filter((c) => c !== category.id)
                      : [...draft.categoryIds, category.id],
                  })
                }
              >
                {category.name}
                {category.hidden && " (hidden)"}
              </Chip>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-6">
        <Toggle label="Emerging at Song (shown first, with a badge)" checked={draft.emerging} onChange={(emerging) => set({ emerging })} />
        <Toggle label="Hidden from the deck" checked={draft.hidden} onChange={(hidden) => set({ hidden })} />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending || !draft.name.trim() || draft.categoryIds.length === 0}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        {id && (
          <Button
            variant="danger"
            className="ml-auto"
            disabled={pending}
            title={ratings > 0 ? "Tools with ratings can only be hidden" : undefined}
            onClick={() => {
              if (window.confirm(`Delete ${initial.name}? This can't be undone.`)) run(() => deleteTool(id), onDone);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
