"use client";

import { useState } from "react";
import {
  CONTEXT_OPTIONS,
  LICENCE_OPTIONS,
  type Licence,
  type Purpose,
  type UsageContext,
} from "@/lib/catalog";
import { Chip, GhostButton, PrimaryButton } from "./ui";

export type CustomTool = { name: string; purposes: string[]; contexts: UsageContext[]; licence: Licence };

const LABEL = "text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function AddTools({
  purposes,
  tools,
  onChange,
}: {
  purposes: Purpose[];
  tools: CustomTool[];
  onChange: (tools: CustomTool[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [contexts, setContexts] = useState<UsageContext[]>([]);
  const [licence, setLicence] = useState<Licence | null>(null);

  const purposeLabels = new Map(purposes.map((p) => [p.id, p.label]));
  const ready = name.trim().length > 0 && chosen.length > 0 && contexts.length > 0 && licence !== null;

  function add() {
    if (!ready || !licence) return;
    onChange([...tools, { name: name.trim(), purposes: chosen, contexts, licence }]);
    setName("");
    setChosen([]);
    setContexts([]);
    setLicence(null);
    setOpen(false);
  }

  return (
    <div>
      {tools.length > 0 && (
        <ul className="mb-8 border-t border-white/10">
          {tools.map((tool, i) => (
            <li key={`${tool.name}-${i}`} className="flex items-start justify-between gap-6 border-b border-white/10 py-4">
              <div>
                <p className="text-xl font-semibold tracking-tight">{tool.name}</p>
                <p className="mt-1 text-sm text-white/45">
                  {tool.purposes.map((id) => purposeLabels.get(id) ?? id).join(" · ")}
                </p>
                <p className="mt-0.5 text-sm text-white/45">
                  {tool.contexts.map((id) => CONTEXT_OPTIONS.find((c) => c.id === id)?.label).join(" · ")} ·{" "}
                  {LICENCE_OPTIONS.find((l) => l.id === tool.licence)?.label}
                </p>
              </div>
              <GhostButton onClick={() => onChange(tools.filter((_, index) => index !== i))}>Remove</GhostButton>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="max-w-2xl space-y-8 border border-white/10 bg-graphite/60 p-6 sm:p-8">
          <label className="block">
            <span className={LABEL}>Tool name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="e.g. Gamma"
              className="mt-3 w-full border-b-2 border-white/20 bg-transparent py-2 text-xl outline-none transition-colors placeholder:text-white/25 focus:border-brand focus-visible:outline-none"
            />
          </label>

          <fieldset>
            <legend className={LABEL}>What do you use it for?</legend>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {purposes.map((purpose) => (
                <Chip
                  key={purpose.id}
                  size="sm"
                  selected={chosen.includes(purpose.id)}
                  onClick={() => setChosen((current) => toggle(current, purpose.id))}
                >
                  {purpose.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={LABEL}>Where do you use it?</legend>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CONTEXT_OPTIONS.map((option) => (
                <Chip
                  key={option.id}
                  size="sm"
                  selected={contexts.includes(option.id)}
                  onClick={() => setContexts((current) => toggle(current, option.id))}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={LABEL}>Whose licence is it on?</legend>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {LICENCE_OPTIONS.map((option) => (
                <Chip
                  key={option.id}
                  size="sm"
                  selected={licence === option.id}
                  onClick={() => setLicence(option.id)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-6">
            <PrimaryButton disabled={!ready} onClick={add}>
              Add tool
            </PrimaryButton>
            {tools.length > 0 && <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>}
          </div>
        </div>
      ) : (
        <GhostButton onClick={() => setOpen(true)} className="text-base">
          {tools.length > 0 ? "+ Add another tool" : "+ Add a tool"}
        </GhostButton>
      )}
    </div>
  );
}
