import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Self-Hosting",
  description: "Deploy Better Auth Studio inside your own application across supported frameworks.",
  path: "/self-hosting",
});

export default function SelfHostingLayout({ children }: { children: ReactNode }) {
  return children;
}
