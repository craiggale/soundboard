"use client";

import {
  deleteBarrier,
  deleteCategory,
  deletePractice,
  moveBarrier,
  moveCategory,
  movePractice,
  saveBarrier,
  saveCategory,
  savePractice,
} from "@/app/admin/actions";
import type { AdminBarrier, AdminCategory, AdminPractice } from "@/lib/admin-data";
import { ListEditor } from "./ListEditor";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function CategoriesEditor({ categories }: { categories: AdminCategory[] }) {
  return (
    <ListEditor
      addLabel="Add a category"
      fields={[
        { key: "name", label: "Category", type: "text", required: true, placeholder: "e.g. Creative AI" },
        { key: "purpose", label: "Purpose", type: "text", placeholder: "Leave blank for none" },
        { key: "alwaysShown", label: "Always in the deck", type: "toggle" },
        { key: "hidden", label: "Hidden", type: "toggle" },
      ]}
      items={categories.map((c) => ({
        id: c.id,
        values: { name: c.name, purpose: c.purpose ?? "", alwaysShown: c.alwaysShown, hidden: c.hidden },
        usage: plural(c.tools, "tool"),
        locked: c.tools > 0 ? "Move its tools to another category first, or hide it" : c.inUse ? "Already chosen in responses. Hide it instead" : undefined,
      }))}
      onSave={(id, v) =>
        saveCategory({
          id,
          name: v.name as string,
          purpose: v.purpose as string,
          alwaysShown: v.alwaysShown as boolean,
          hidden: v.hidden as boolean,
        })
      }
      onDelete={deleteCategory}
      onMove={moveCategory}
    />
  );
}

export function PracticesEditor({ practices }: { practices: AdminPractice[] }) {
  return (
    <ListEditor
      addLabel="Add a practice"
      fields={[
        { key: "name", label: "Practice", type: "text", required: true, maxLength: 80 },
        { key: "summary", label: "Summary", type: "text", maxLength: 160, width: "min-w-64 flex-[2]" },
        { key: "hidden", label: "Hidden", type: "toggle" },
      ]}
      items={practices.map((p) => ({
        id: p.id,
        values: { name: p.name, summary: p.summary, hidden: p.hidden },
        usage: plural(p.responses, "response"),
        locked: p.responses > 0 ? "Has responses. Hide it instead" : undefined,
      }))}
      onSave={(id, v) =>
        savePractice({ id, name: v.name as string, summary: v.summary as string, hidden: v.hidden as boolean })
      }
      onDelete={deletePractice}
      onMove={movePractice}
    />
  );
}

export function BarriersEditor({ barriers }: { barriers: AdminBarrier[] }) {
  return (
    <ListEditor
      addLabel="Add an option"
      fields={[
        { key: "label", label: "Option", type: "text", required: true, maxLength: 120, width: "min-w-64 flex-[2]" },
        { key: "hidden", label: "Hidden", type: "toggle" },
      ]}
      items={barriers.map((b) => ({
        id: b.id,
        values: { label: b.label, hidden: b.hidden },
        usage: plural(b.uses, "pick"),
        locked: b.uses > 0 ? "Already chosen in responses. Hide it instead" : undefined,
      }))}
      onSave={(id, v) => saveBarrier({ id, label: v.label as string, hidden: v.hidden as boolean })}
      onDelete={deleteBarrier}
      onMove={moveBarrier}
    />
  );
}
