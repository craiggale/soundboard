"use client";

import { useState } from "react";
import type { ActionResult } from "@/app/admin/actions";
import { Badge, Button, ErrorText, Field, MoveButtons, Toggle, useAdminAction } from "./ui";

type Values = Record<string, string | boolean>;

export type FieldSpec =
  | { key: string; label: string; type: "text"; placeholder?: string; maxLength?: number; required?: boolean; width?: string }
  | { key: string; label: string; type: "toggle" };

export type ListItem = { id: string; values: Values; usage: string; locked?: string };

type Props = {
  items: ListItem[];
  fields: FieldSpec[];
  addLabel: string;
  onSave: (id: string | undefined, values: Values) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  onMove: (id: string, direction: -1 | 1) => Promise<ActionResult>;
};

function blank(fields: FieldSpec[]): Values {
  return Object.fromEntries(fields.map((f) => [f.key, f.type === "toggle" ? false : ""]));
}

export function ListEditor({ items, fields, addLabel, onSave, onDelete, onMove }: Props) {
  return (
    <div>
      <ul className="divide-y divide-white/10 border-y border-white/10">
        {items.map((item, index) => (
          <Row
            key={item.id}
            item={item}
            fields={fields}
            first={index === 0}
            last={index === items.length - 1}
            onSave={onSave}
            onDelete={onDelete}
            onMove={onMove}
          />
        ))}
      </ul>
      <AddRow fields={fields} label={addLabel} onSave={onSave} />
    </div>
  );
}

function Inputs({ fields, values, onChange }: { fields: FieldSpec[]; values: Values; onChange: (values: Values) => void }) {
  return (
    <>
      {fields.map((field) =>
        field.type === "text" ? (
          <Field
            key={field.key}
            label={field.label}
            value={values[field.key] as string}
            placeholder={field.placeholder}
            maxLength={field.maxLength ?? 120}
            onChange={(event) => onChange({ ...values, [field.key]: event.target.value })}
            className={field.width ?? "min-w-40 flex-1"}
          />
        ) : (
          <div key={field.key} className="pb-2">
            <Toggle
              label={field.label}
              checked={values[field.key] as boolean}
              onChange={(checked) => onChange({ ...values, [field.key]: checked })}
            />
          </div>
        ),
      )}
    </>
  );
}

function Row({
  item,
  fields,
  first,
  last,
  onSave,
  onDelete,
  onMove,
}: {
  item: ListItem;
  fields: FieldSpec[];
  first: boolean;
  last: boolean;
  onSave: Props["onSave"];
  onDelete: Props["onDelete"];
  onMove: Props["onMove"];
}) {
  const [values, setValues] = useState(item.values);
  const { pending, error, run } = useAdminAction();
  const dirty = fields.some((f) => values[f.key] !== item.values[f.key]);
  const invalid = fields.some((f) => f.type === "text" && f.required && !(values[f.key] as string).trim());
  const hidden = item.values.hidden === true;

  return (
    <li className={`py-4 ${hidden && !dirty ? "opacity-60" : ""}`}>
      <form
        className="flex flex-wrap items-end gap-x-4 gap-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (dirty && !invalid) run(() => onSave(item.id, values));
        }}
      >
        <MoveButtons first={first} last={last} disabled={pending} onMove={(dir) => run(() => onMove(item.id, dir))} />
        <Inputs fields={fields} values={values} onChange={setValues} />
        <span className="w-24 pb-2 text-right text-sm tabular-nums text-white/40">{item.usage}</span>
        <div className="flex gap-2 pb-0.5">
          <Button type="submit" variant="primary" disabled={!dirty || invalid || pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          {dirty && (
            <Button variant="ghost" disabled={pending} onClick={() => setValues(item.values)}>
              Undo
            </Button>
          )}
          <Button
            variant="danger"
            disabled={pending || Boolean(item.locked)}
            title={item.locked}
            onClick={() => {
              if (window.confirm("Delete this? It can't be undone.")) run(() => onDelete(item.id));
            }}
          >
            Delete
          </Button>
        </div>
      </form>
      {hidden && !dirty && (
        <div className="mt-2 pl-[72px]">
          <Badge>Hidden</Badge>
        </div>
      )}
      {error && (
        <div className="mt-2">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </li>
  );
}

function AddRow({ fields, label, onSave }: { fields: FieldSpec[]; label: string; onSave: Props["onSave"] }) {
  const [values, setValues] = useState(() => blank(fields));
  const { pending, error, run } = useAdminAction();
  const invalid = fields.some((f) => f.type === "text" && f.required && !(values[f.key] as string).trim());

  return (
    <form
      className="mt-8 border border-dashed border-white/20 p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) run(() => onSave(undefined, values), () => setValues(blank(fields)));
      }}
    >
      <p className="mb-4 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <Inputs fields={fields} values={values} onChange={setValues} />
        <Button type="submit" variant="primary" disabled={invalid || pending}>
          {pending ? "Adding…" : "Add"}
        </Button>
      </div>
      {error && (
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}
    </form>
  );
}
