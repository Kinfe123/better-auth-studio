import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const routes = [
  { path: "/", priority: 1 },
  { path: "/installation", priority: 0.9 },
  { path: "/guides", priority: 0.8 },
  { path: "/self-hosting", priority: 0.8 },
  { path: "/vercel", priority: 0.7 },
  { path: "/changelog", priority: 0.7 },
  { path: "/v/1.1.2", priority: 0.6 },
  { path: "/v/1.1.1", priority: 0.5 },
  { path: "/v/1.1.0", priority: 0.5 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/changelog" ? "weekly" : "monthly",
    priority,
  }));
}
