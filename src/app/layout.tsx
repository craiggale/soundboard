import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Inter stands in for Graphik; swap the file here to change the brand face everywhere.
const brand = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-brand",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Soundboard · Song Unplugged",
  description: "Share how AI is showing up in your work, and see what everyone else at Song is doing.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brand.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink font-sans text-white">{children}</body>
    </html>
  );
}
