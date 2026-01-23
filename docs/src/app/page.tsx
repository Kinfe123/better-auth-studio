import { Suspense } from "react";
import { Hero } from "@/components/ui/hero";
import Navigation from "@/components/Navigation";
import Link from "next/link";
async function getLatestStudioVersion(): Promise<string | null> {
  try {
    const response = await fetch("https://registry.npmjs.org/better-auth-studio/latest", {
      next: { revalidate: 60 * 60 },
      cache: "force-cache",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return typeof data.version === "string" ? data.version : null;
  } catch (error) {
    console.error("Failed to fetch better-auth-studio version:", error);
    return null;
  }
}

export default async function Home() {
  const version = await getLatestStudioVersion();

  return (
    <div className="h-svh w-screen relative">
      <Navigation currentPage="home" />
      {/* Version links in top right corner - desktop only */}
      <div className="fixed top-12 right-12 text-right space-y-8 z-20 hidden md:block">
        <section>
          <h3 className="text-[10px] font-mono tracking-[0.2em] text-white/40 mb-1">■ VERSIONS</h3>
          <Link
            href="/v/1.1.1"
            className="text-[11px] font-mono lowercase tracking-widest block hover:text-white transition-colors duration-300 text-white/70"
          >
            v1.1.1
          </Link>
          <Link
            href="/v/1.1.0"
            className="text-[11px] font-mono lowercase tracking-widest block hover:text-white transition-colors duration-300 text-white/70"
          >
            v1.1.0
          </Link>
        </section>
        <section>
          <h3 className="text-[10px] font-mono tracking-[0.2em] text-white/40 mb-1">
            ■ CREATED BY
          </h3>
          <a
            href="https://kinfish.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono uppercase tracking-widest block hover:text-white transition-colors duration-300 text-white/70"
          >
            kinfish.dev
          </a>
        </section>
        <section>
          <h3 className="text-[10px] font-mono tracking-[0.2em] text-white/40 mb-1">■ CONTACT</h3>
          <a
            href="https://x.com/KinfishT"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono lowercase tracking-widest block hover:text-white transition-colors duration-300 text-white/70"
          >
            Twitter <span className="tracking-tighter"> [ X ] </span>
          </a>
          <a
            href="mailto:kinfetare83@gmail.com"
            className="text-[11px] font-mono lowercase tracking-widest block hover:text-white transition-colors duration-300 text-white/70"
          >
            Email
          </a>
        </section>
      </div>
      <Suspense fallback={null}>
        <Hero
          title="Better-Auth Studio"
          description="An admin dashboard for Better Auth. Manage users, sessions, organizations, teams , database along with testing , utitility and much more with an intuitive interface."
          links={[]}
          version={version}
        />
      </Suspense>
    </div>
  );
}
