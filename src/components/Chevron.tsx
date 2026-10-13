export function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 100" className={className} aria-hidden="true" fill="currentColor">
      <path d="M0 0h26l38 50-38 50H0l38-50z" />
    </svg>
  );
}

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight ${className}`}>
      <Chevron className="h-4 w-auto text-brand" />
      Soundboard
    </span>
  );
}
