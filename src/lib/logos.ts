import { readFileSync } from "node:fs";
import path from "node:path";
import * as icons from "simple-icons";
import type { Logo } from "./catalog";

// Server-only. Logos come from LobeHub (AI brands, often in colour) first, then Simple Icons.
// Only a key reaches the client; the SVG itself is served by /logos/[key].

const LOBE_DIR = path.join(process.cwd(), "node_modules", "@lobehub", "icons-static-svg", "icons");
const SAFE_NAME = /^[a-z0-9-]{1,60}$/;

const simpleIcons = new Map(
  Object.values(icons)
    .filter((icon): icon is (typeof icons)[keyof typeof icons] & { slug: string } => Boolean(icon?.slug))
    .map((icon) => [icon.slug, icon]),
);

const lobeCache = new Map<string, string | null>();
function lobe(name: string): string | null {
  if (!SAFE_NAME.test(name)) return null;
  if (!lobeCache.has(name)) {
    try {
      lobeCache.set(name, readFileSync(path.join(LOBE_DIR, `${name}.svg`), "utf8"));
    } catch {
      lobeCache.set(name, null);
    }
  }
  return lobeCache.get(name) ?? null;
}

function luminance(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pathSvg(d: string, fill: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${fill}" d="${d}"/></svg>`;
}

export function isLogoSlug(slug: string) {
  return Boolean(lobe(slug) || simpleIcons.has(slug));
}

export function resolveLogo(slug: string | null): Logo {
  if (slug && isLogoSlug(slug)) {
    const title = lobe(slug)?.match(/<title>([^<]+)<\/title>/)?.[1] ?? simpleIcons.get(slug)?.title ?? slug;
    return { key: slug, title, placeholder: false };
  }
  return { key: "accenture", title: "Accenture", placeholder: true };
}

// "tile" sits on a white square (or purple for the placeholder); "mark" is a white silhouette for watermarks.
export function logoSvg(key: string, variant: "tile" | "mark"): string | null {
  if (key === "accenture") {
    const icon = simpleIcons.get("accenture");
    return icon ? pathSvg(icon.path, "#ffffff") : null;
  }

  const mono = lobe(key);
  if (mono) {
    if (variant === "mark") return mono.replace(/currentColor/g, "#ffffff");
    return lobe(`${key}-color`) ?? mono.replace(/currentColor/g, "#111111");
  }

  const icon = simpleIcons.get(key);
  if (!icon) return null;
  if (variant === "mark") return pathSvg(icon.path, "#ffffff");
  return pathSvg(icon.path, luminance(icon.hex) > 0.7 ? "#111111" : `#${icon.hex}`);
}
