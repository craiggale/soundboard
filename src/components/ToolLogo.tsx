import type { Logo } from "@/lib/catalog";

const src = (logo: Logo, variant?: "mark") => `/logos/${encodeURIComponent(logo.key)}${variant ? "?variant=mark" : ""}`;

export function LogoTile({ logo, className = "h-16 w-16" }: { logo: Logo; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${logo.placeholder ? "bg-brand" : "bg-white"} ${className}`}
      title={logo.placeholder ? "No logo available" : logo.title}
    >
      <img
        src={src(logo)}
        alt={logo.placeholder ? "Accenture placeholder" : `${logo.title} logo`}
        className="h-1/2 w-1/2 object-contain"
        draggable={false}
      />
    </span>
  );
}

export function LogoMark({ logo, className }: { logo: Logo; className?: string }) {
  return <img src={src(logo, "mark")} alt="" aria-hidden="true" className={className} draggable={false} />;
}
