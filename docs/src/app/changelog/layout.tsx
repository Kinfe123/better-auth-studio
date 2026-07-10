import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Changelog",
  description: "Recent Better Auth Studio releases, fixes, and feature updates.",
  path: "/changelog",
});

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return children;
}
