import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Installation",
  description: "Install Better Auth Studio and start it in your Better Auth project.",
  path: "/installation",
});

export default function InstallationLayout({ children }: { children: ReactNode }) {
  return children;
}
