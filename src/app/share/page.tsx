import type { Metadata } from "next";
import { ShareFlow } from "@/components/share/ShareFlow";

export const metadata: Metadata = {
  title: "Add yours · Soundboard",
};

export default function SharePage() {
  return <ShareFlow />;
}
