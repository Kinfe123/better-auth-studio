import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Guides",
  description: "Step-by-step guides for self-hosting and getting started with Better Auth Studio.",
  path: "/guides",
});

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return children;
}
