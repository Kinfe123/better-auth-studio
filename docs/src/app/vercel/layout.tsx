import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Vercel",
  description: "Deploy and run Better Auth Studio with Vercel.",
  path: "/vercel",
});

export default function VercelLayout({ children }: { children: ReactNode }) {
  return children;
}
