import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Version 1.1.2",
  description: "Better Auth Studio v1.1.2 release notes and product updates.",
  path: "/v/1.1.2",
});

export default function Version112Layout({ children }: { children: ReactNode }) {
  return children;
}
