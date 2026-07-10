import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Version 1.1.1",
  description: "Better Auth Studio v1.1.1 release notes and event ingestion updates.",
  path: "/v/1.1.1",
});

export default function Version111Layout({ children }: { children: ReactNode }) {
  return children;
}
