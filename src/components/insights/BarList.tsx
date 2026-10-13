import type { CSSProperties } from "react";

export type BarRow = {
  label: string;
  value: number;
  valueLabel: string;
  detail: string;
  aside?: string;
};

type Props = {
  title: string;
  rows: BarRow[];
  headers: [label: string, value: string, aside?: string];
};

export function BarList({ title, rows, headers }: Props) {
  const max = Math.max(...rows.map((row) => row.value), 0);
  const [labelHeader, valueHeader, asideHeader] = headers;

  if (rows.length === 0) {
    return <p className="py-6 text-sm text-white/40">Nothing here yet.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-[minmax(7rem,11rem)_1fr_auto] gap-4 border-b border-white/10 pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
        <span>{labelHeader}</span>
        <span>{valueHeader}</span>
        {asideHeader && <span className="text-right">{asideHeader}</span>}
      </div>
      <ul aria-label={title}>
        {rows.map((row, i) => (
          <li
            key={row.label}
            tabIndex={0}
            className="group relative grid grid-cols-[minmax(7rem,11rem)_1fr_auto] items-center gap-4 py-2.5 outline-none transition-colors hover:bg-white/[0.03] focus:bg-white/[0.05]"
          >
            <span className="truncate text-sm text-white/85" title={row.label}>
              {row.label}
            </span>
            <span className="flex h-6 items-center border-l border-white/15">
              <span
                className="bar-grow h-[18px] rounded-r-[4px] bg-brand transition-colors group-hover:bg-brand-soft group-focus:bg-brand-soft"
                style={{ width: `${max ? (row.value / max) * 82 : 0}%`, animationDelay: `${i * 60}ms` } as CSSProperties}
              />
              <span className="ml-2.5 text-sm tabular-nums text-white/60">{row.valueLabel}</span>
            </span>
            {asideHeader && <span className="w-16 text-right text-sm tabular-nums text-white/60">{row.aside}</span>}
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-[11rem] z-20 mb-1 hidden whitespace-nowrap bg-white px-3 py-2 text-xs text-ink shadow-xl group-hover:block group-focus:block"
            >
              <strong className="mr-2 text-sm">{row.valueLabel}</strong>
              <span className="text-ink/60">
                {row.label} · {row.detail}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-white/40 transition-colors hover:text-white">View as table</summary>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-white/40">
            <tr>
              <th className="py-1.5 font-medium">{labelHeader}</th>
              <th className="py-1.5 text-right font-medium">{valueHeader}</th>
              {asideHeader && <th className="py-1.5 text-right font-medium">{asideHeader}</th>}
            </tr>
          </thead>
          <tbody className="tabular-nums text-white/75">
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-white/10">
                <td className="py-1.5">{row.label}</td>
                <td className="py-1.5 text-right">{row.valueLabel}</td>
                {asideHeader && <td className="py-1.5 text-right">{row.aside}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
