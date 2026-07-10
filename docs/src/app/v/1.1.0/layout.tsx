import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Version 1.1.0",
  description: "Better Auth Studio v1.1.0 release notes and framework support updates.",
  path: "/v/1.1.0",
});

export default function Version110Layout({ children }: { children: ReactNode }) {
  return children;
}
