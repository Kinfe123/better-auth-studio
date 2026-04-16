"use client";

import { useEffect } from "react";
import PixelLayout from "@/components/PixelLayout";
import PixelCard from "@/components/PixelCard";
import CodeHighlighter from "@/components/SyntaxHighlighter";
import CodeBlock from "@/components/CodeBlock";
import Link from "next/link";
import {
  GuideIcon,
  DocumentIcon,
  ServerIcon,
  InstallIcon,
  ConfigIcon,
  PrerequisitesIcon,
} from "@/components/icons";

/** Single source of truth: all available guide posts. Add new guides here and add a matching section below. */
const GUIDES = [
  {
    id: "self-host-setup",
    title: "Self-host setup",
    description: "Deploy the studio on your own server from scratch",
  },
  {
    id: "nextjs",
    title: "Next.js – From scratch",
    description: "Full setup and customization with App Router",
  },
  {
    id: "other-frameworks",
    title: "Other frameworks",
    description: "Hono, Express, Elysia, SvelteKit, and more",
  },
  {
    id: "customize-studio",
    title: "Customize the studio",
    description: "Config options: access, metadata, theme, tools, events",
  },
  {
    id: "more",
    title: "More resources",
    description: "Installation, self-hosting, and Better Auth docs",
  },
] as const;

export default function Guides() {
  const scrollToElement = (sectionId: string, retries = 5) => {
    let element = document.getElementById(sectionId);
    if (!element) {
      element = document.querySelector(`[id="${sectionId}"]`) as HTMLElement;
    }
    if (element) {
      const yOffset = -40;
      const elementTop = element.getBoundingClientRect().top;
      const elementScrollTop = elementTop + window.pageYOffset;
      const targetPosition = elementScrollTop + yOffset;
      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: "smooth",
      });
      return true;
    } else if (retries > 0) {
      setTimeout(() => scrollToElement(sectionId, retries - 1), 100);
      return false;
    }
    return false;
  };

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const sectionId = hash.substring(1);
        setTimeout(() => scrollToElement(sectionId), 200);
      }
    };
    scrollToHash();
    const handleHashChange = () => {
      setTimeout(() => {
        const hash = window.location.hash;
        if (hash) scrollToElement(hash.substring(1));
      }, 100);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSectionClick = (sectionId: string) => {
    const hash = `#${sectionId}`;
    window.history.pushState(null, "", hash);
    requestAnimationFrame(() => {
      setTimeout(() => scrollToElement(sectionId), 150);
    });
  };

  return (
    <PixelLayout
      currentPage="guides"
      title="GUIDES"
      description="Step-by-step guides for self-hosting and getting started with your framework."
    >
      {/* Fixed sidebar - desktop only */}
      <div className="fixed top-12 right-12 text-right space-y-8 z-20 hidden md:block">
        <section>
          <h3 className="text-[10px] font-mono tracking-[0.2em] text-white/40 mb-1">■ VERSIONS</h3>
          <Link
            href="/v/1.1.2"
            className="text-[11px] font-mono lowercase tracking-widest block hover:text-white transition-colors duration-300 text-white/70"
          >
            v1.1.2
          </Link>
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
            className="text-[11px] font-mono lowercase tracking-widest block hover:text-white transition-colors duration-300 text-white/70"
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

      <div className="space-y-8">
        {/* Guide index – lists all available guide posts; clicking goes to guides#id */}
        <section id="guide-index">
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">AVAILABLE GUIDES</h2>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("guide-index")}
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <GuideIcon />
                  Guide posts
                </span>
              </h3>
            </div>
            <div className="pt-4">
              <p className="text-sm font-light tracking-tight text-white/70 mb-4">
                Click a guide to open it. The URL will update to{" "}
                <code className="bg-white/10 px-1 text-white/80">guides#link-of-guide</code> so you
                can share or bookmark.
              </p>
              <ul className="space-y-3">
                {GUIDES.map((guide) => (
                  <li key={guide.id}>
                    <Link
                      href={`/guides#${guide.id}`}
                      onClick={(e) => {
                        if (
                          typeof window !== "undefined" &&
                          window.location.pathname === "/guides"
                        ) {
                          e.preventDefault();
                          handleSectionClick(guide.id);
                        }
                      }}
                      className="text-left w-full group block border border-white/10 hover:border-white/25 bg-white/[2%] hover:bg-white/[6%] transition-all duration-200 px-4 py-3 no-underline"
                    >
                      <span className="text-sm font-medium text-white/90 group-hover:text-white">
                        {guide.title}
                      </span>
                      <p className="text-xs font-light text-white/50 mt-0.5">{guide.description}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </PixelCard>
        </section>

        {/* Self-host setup – detailed guide */}
        <section id="self-host-setup">
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">SELF-HOST SETUP</h2>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("self-host-setup")}
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ServerIcon />
                  What is self-hosting?
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light tracking-tight text-white/70">
                Self-hosting runs the studio inside your app so it’s available at a URL you choose
                (e.g. <code className="bg-white/10 px-1 text-white/90">/api/studio</code> or{" "}
                <code className="bg-white/10 px-1 text-white/90">/admin</code>). Only people who
                pass your access rules (roles or allowlisted emails) can open it. The studio is
                served by your framework, so it works in production without a separate process.
              </p>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("self-host-prereqs")}
                id="self-host-prereqs"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <PrerequisitesIcon />
                  Prerequisites (starting from scratch)
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light tracking-tight text-white/70">
                Before adding the studio you need:
              </p>
              <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-2">
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">1.</span> A project using Better Auth (with{" "}
                  <code className="bg-white/10 px-1">auth</code> exported from e.g.{" "}
                  <code className="bg-white/10 px-1">lib/auth.ts</code> or{" "}
                  <code className="bg-white/10 px-1">src/auth.ts</code>).
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">2.</span> A database and adapter (Prisma,
                  Drizzle, or SQLite) already configured in that auth.
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">3.</span> Node 18+ and pnpm (or npm/yarn).
                </li>
              </ul>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("self-host-steps")}
                id="self-host-steps"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  Step-by-step
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                <strong>Step 1: Install the package</strong>
              </p>
              <p className="text-xs font-light text-white/50">
                Use a regular dependency (not dev) so the studio is available in production.
              </p>
              <CodeBlock code="pnpm add better-auth-studio" className="flex-1 min-w-0" />

              <p className="text-sm font-light tracking-tight text-white/70">
                <strong>Step 2: Generate the config file</strong>
              </p>
              <p className="text-xs font-light text-white/50">
                From your project root, run the init command. It will create{" "}
                <code className="bg-white/10 px-1">studio.config.ts</code> (or{" "}
                <code className="bg-white/10 px-1">studio.config.js</code>) and, for some
                frameworks, the route file.
              </p>
              <CodeBlock code="pnpx better-auth-studio init" className="flex-1 min-w-0" />

              <p className="text-sm font-light tracking-tight text-white/70">
                <strong>Step 3: Point config to your auth</strong>
              </p>
              <p className="text-xs font-light text-white/50">
                Open <code className="bg-white/10 px-1">studio.config.ts</code> and set{" "}
                <code className="bg-white/10 px-1">auth</code> to your Better Auth instance (e.g.{" "}
                <code className="bg-white/10 px-1">
                  import &#123; auth &#125; from &quot;./lib/auth&quot;
                </code>
                ).
              </p>

              <p className="text-sm font-light tracking-tight text-white/70">
                <strong>Step 4: Mount the studio in your app</strong>
              </p>
              <p className="text-xs font-light text-white/50">
                Depending on your framework, you mount the handler on a path that matches{" "}
                <code className="bg-white/10 px-1">basePath</code> in config (default{" "}
                <code className="bg-white/10 px-1">/api/studio</code>). For exact code per
                framework, see the Next.js guide below or the{" "}
                <Link
                  href="/self-hosting"
                  className="underline underline-offset-2 font-bold text-white/90 hover:text-white"
                >
                  Self-hosting
                </Link>{" "}
                page.
              </p>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("self-host-customize")}
                id="self-host-customize"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <GuideIcon />
                  Customizing self-host
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light tracking-tight text-white/70">
                In <code className="bg-white/10 px-1">studio.config.ts</code> you can change:
              </p>
              <ul className="list-none space-y-1.5 text-sm font-light tracking-tight text-white/70 ml-2">
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span>
                  <code className="bg-white/10 px-1">basePath</code> – URL path where the studio is
                  served (e.g. <code className="bg-white/10 px-1">/admin</code>). Your route must
                  match this.
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span>
                  <code className="bg-white/10 px-1">access.roles</code> – Only users with these
                  Better Auth roles can open the studio.
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span>
                  <code className="bg-white/10 px-1">access.allowEmails</code> – Only these emails
                  can open the studio (ignored if <code className="bg-white/10 px-1">roles</code> is
                  set).
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span>
                  <code className="bg-white/10 px-1">access.allowIpAddresses</code> and{" "}
                  <code className="bg-white/10 px-1">access.blockIpAddresses</code> – IP allow/block
                  rules for Studio requests (supports wildcard patterns like{" "}
                  <code className="bg-white/10 px-1">192.168.*</code>).
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span>
                  <code className="bg-white/10 px-1">metadata</code> – Title, logo, theme
                  (dark/light/auto), and other UI options.
                </li>
              </ul>
              <p className="text-sm font-light tracking-tight text-white/70">
                For every option, see the{" "}
                <Link
                  href="/guides#customize-studio"
                  className="underline underline-offset-2 font-bold text-white/90 hover:text-white"
                >
                  Customize the studio
                </Link>{" "}
                guide.
              </p>
            </div>
          </PixelCard>
        </section>

        {/* Next.js – From scratch detailed guide */}
        <section id="nextjs">
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">
            NEXT.JS – FROM SCRATCH
          </h2>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("nextjs-prerequisites")}
                id="nextjs-prerequisites"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <PrerequisitesIcon />
                  Prerequisites
                </span>
              </h3>
            </div>
            <div className="pt-4">
              <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                You need a Next.js app (App Router) with Better Auth already set up:
              </p>
              <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 ml-2">
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span> Next.js 14+ with App Router
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span> Better Auth installed and configured
                  (e.g. <code className="bg-white/10 px-1">lib/auth.ts</code>)
                </li>
                <li className="flex items-start">
                  <span className="text-white/50 mr-2">•</span> Database and adapter (Prisma,
                  Drizzle, or SQLite) configured in your auth
                </li>
              </ul>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("nextjs-from-scratch")}
                id="nextjs-from-scratch"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <InstallIcon />
                  From scratch: 1. Create app and auth
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                If you don’t have a project yet:
              </p>
              <CodeBlock
                code="pnpm create next-app@latest my-app --typescript --tailwind --eslint --app --src-dir"
                className="flex-1 min-w-0"
              />
              <p className="text-sm font-light tracking-tight text-white/70">
                Then add Better Auth and your database adapter (see Better Auth docs). You should
                end up with something like <code className="bg-white/10 px-1">src/lib/auth.ts</code>{" "}
                (or <code className="bg-white/10 px-1">lib/auth.ts</code>) exporting{" "}
                <code className="bg-white/10 px-1">auth</code> and an API route for auth (e.g.{" "}
                <code className="bg-white/10 px-1">app/api/auth/[...all]/route.ts</code>).
              </p>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("nextjs-install")}
                id="nextjs-install"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <InstallIcon />
                  From scratch: 2. Install Better Auth Studio
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm font-light tracking-tight text-white/70">
                Install as a regular dependency so it runs in production:
              </p>
              <CodeBlock code="pnpm add better-auth-studio" className="flex-1 min-w-0" />
              <p className="text-xs font-light text-white/50">
                For local-only use you can use{" "}
                <code className="bg-white/10 px-1">pnpm add -D better-auth-studio</code> and run{" "}
                <code className="bg-white/10 px-1">pnpm better-auth-studio start</code> instead of
                embedding the route.
              </p>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("nextjs-config")}
                id="nextjs-config"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  From scratch: 3. Config and API route
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                Run the init command to generate the config and, for Next.js, the API route file:
              </p>
              <CodeBlock code="pnpx better-auth-studio init" className="flex-1 min-w-0" />
              <p className="text-sm font-light tracking-tight text-white/70">
                It creates <code className="bg-white/10 px-1">studio.config.ts</code> at the project
                root and{" "}
                <code className="bg-white/10 px-1">app/api/studio/[[...path]]/route.ts</code>. The
                route file should look like this:
              </p>
              <PixelCard variant="code">
                <CodeHighlighter
                  className="text-xs"
                  code={`import { betterAuthStudio } from "better-auth-studio/nextjs";
import studioConfig from "@/studio.config";

const handler = betterAuthStudio(studioConfig);

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };`}
                  language="typescript"
                />
              </PixelCard>
              <p className="text-sm font-light tracking-tight text-white/70">
                If your config lives elsewhere, change the import (e.g.{" "}
                <code className="bg-white/10 px-1">from &quot;@/studio.config&quot;</code> or{" "}
                <code className="bg-white/10 px-1">from &quot;../../studio.config&quot;</code>).
              </p>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("nextjs-run")}
                id="nextjs-run"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  From scratch: 4. Run and open
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-2">
              <CodeBlock code="pnpm dev" className="flex-1 min-w-0" />
              <p className="text-sm font-light tracking-tight text-white/70">
                Open <code className="bg-white/10 px-1">http://localhost:3000/api/studio</code> (or
                the <code className="bg-white/10 px-1">basePath</code> you set in{" "}
                <code className="bg-white/10 px-1">studio.config.ts</code>). You’ll be asked to sign
                in; only users who match your <code className="bg-white/10 px-1">access</code>{" "}
                config can use the studio.
              </p>
            </div>
          </PixelCard>

          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("nextjs-customize")}
                id="nextjs-customize"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <GuideIcon />
                  Customizing the Next.js setup
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <ul className="list-none space-y-3 text-sm font-light tracking-tight text-white/70 ml-2">
                <li className="flex items-start gap-2">
                  <span className="text-white/50 shrink-0">•</span>
                  <span className="min-w-0">
                    <strong className="block mb-1">Different URL:</strong>
                    <span className="block">
                      In{" "}
                      <code className="bg-white/10 px-1 whitespace-nowrap">studio.config.ts</code>{" "}
                      set{" "}
                      <code className="bg-white/10 px-1 whitespace-nowrap">
                        basePath: &quot;/admin&quot;
                      </code>{" "}
                      (or another path).
                    </span>
                    <span className="block mt-1">
                      Then move the route to{" "}
                      <code className="bg-white/10 px-1 whitespace-nowrap text-xs">
                        app/api/admin/[[...path]]/route.ts
                      </code>{" "}
                      so the route path matches{" "}
                      <code className="bg-white/10 px-1 whitespace-nowrap">basePath</code>.
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50 shrink-0">•</span>
                  <span className="min-w-0">
                    <strong>Who can access:</strong> Use{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">access.roles</code> (e.g.{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">[&quot;admin&quot;]</code>)
                    or{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">access.allowEmails</code>{" "}
                    and optionally{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">
                      access.allowIpAddresses
                    </code>{" "}
                    /{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">
                      access.blockIpAddresses
                    </code>{" "}
                    in the config. See the{" "}
                    <Link
                      href="/guides#customize-studio"
                      className="underline underline-offset-2 text-white/90 hover:text-white"
                    >
                      Customize the studio
                    </Link>{" "}
                    guide.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50 shrink-0">•</span>
                  <span className="min-w-0">
                    <strong>Title, logo, theme:</strong> Set{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">metadata.title</code>,{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">metadata.logo</code>,{" "}
                    <code className="bg-white/10 px-1 whitespace-nowrap">metadata.theme</code> in
                    config.
                  </span>
                </li>
              </ul>
            </div>
          </PixelCard>
        </section>

        {/* Other frameworks */}
        <section id="other-frameworks">
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">OTHER FRAMEWORKS</h2>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("other-frameworks")}
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <DocumentIcon />
                  Supported frameworks
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light tracking-tight text-white/70">
                Same flow: install <code className="bg-white/10 px-1">better-auth-studio</code>, run{" "}
                <code className="bg-white/10 px-1">pnpx better-auth-studio init</code> to get{" "}
                <code className="bg-white/10 px-1">studio.config.ts</code>, then mount the framework
                adapter on the path that matches <code className="bg-white/10 px-1">basePath</code>{" "}
                (e.g. <code className="bg-white/10 px-1">/api/studio</code>).
              </p>
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("other-frameworks-detail")}
                id="other-frameworks-detail"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  From scratch (any framework)
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm font-light tracking-tight text-white/70">
                <li>
                  Create or open your project and set up Better Auth (auth instance + database).
                </li>
                <li>
                  <code className="bg-white/10 px-1">pnpm add better-auth-studio</code>
                </li>
                <li>
                  <code className="bg-white/10 px-1">pnpx better-auth-studio init</code> – creates{" "}
                  <code className="bg-white/10 px-1">studio.config.ts</code>. Point it at your{" "}
                  <code className="bg-white/10 px-1">auth</code>.
                </li>
                <li>
                  Import the adapter (e.g.{" "}
                  <code className="bg-white/10 px-1">better-auth-studio/hono</code>,{" "}
                  <code className="bg-white/10 px-1">better-auth-studio/express</code>) and mount
                  the handler on <code className="bg-white/10 px-1">basePath</code>.
                </li>
              </ol>
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("other-frameworks-list")}
                id="other-frameworks-list"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <DocumentIcon />
                  Adapter imports
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-2">
              <ul className="text-sm font-light tracking-tight text-white/70 space-y-1.5 ml-2">
                <li>
                  <strong>Hono</strong> –{" "}
                  <code className="bg-white/10 px-1">better-auth-studio/hono</code>
                </li>
                <li>
                  <strong>Express</strong> –{" "}
                  <code className="bg-white/10 px-1">better-auth-studio/express</code>
                </li>
                <li>
                  <strong>Elysia</strong> –{" "}
                  <code className="bg-white/10 px-1">better-auth-studio/elysia</code>
                </li>
                <li>
                  <strong>SvelteKit, Remix, Nuxt, Astro, Solid Start, TanStack Start</strong> – each
                  has an entry in the package.
                </li>
              </ul>
              <p className="text-sm font-light tracking-tight text-white/70 mt-3">
                For exact code per framework, see the{" "}
                <Link
                  href="/self-hosting"
                  className="underline underline-offset-2 font-bold text-white/90 hover:text-white"
                >
                  Self-hosting
                </Link>{" "}
                page and pick your framework in the tabs.
              </p>
            </div>
          </PixelCard>
        </section>

        {/* Customize the studio */}
        <section id="customize-studio">
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">
            CUSTOMIZE THE STUDIO
          </h2>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("customize-overview")}
                id="customize-overview"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <GuideIcon />
                  Config file overview
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light tracking-tight text-white/70">
                All customization lives in{" "}
                <code className="bg-white/10 px-1">studio.config.ts</code>:{" "}
                <code className="bg-white/10 px-1">auth</code>,{" "}
                <code className="bg-white/10 px-1">basePath</code>,{" "}
                <code className="bg-white/10 px-1">access</code>,{" "}
                <code className="bg-white/10 px-1">metadata</code>, and optionally{" "}
                <code className="bg-white/10 px-1">tools</code>,{" "}
                <code className="bg-white/10 px-1">events</code>,{" "}
                <code className="bg-white/10 px-1">lastSeenAt</code>,{" "}
                <code className="bg-white/10 px-1">ipAddress</code>. Below is what each does and how
                to set it.
              </p>
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("customize-basepath")}
                id="customize-basepath"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  basePath
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm font-light tracking-tight text-white/70">
                URL path where the studio is served. Default{" "}
                <code className="bg-white/10 px-1">/api/studio</code>. Your app must serve the
                handler on this path.
              </p>
              <PixelCard variant="code">
                <CodeHighlighter code={`basePath: "/admin"`} language="typescript" />
              </PixelCard>
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("customize-access")}
                id="customize-access"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  access (who can open the studio)
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <ul className="list-none space-y-1.5 text-sm font-light tracking-tight text-white/70 ml-2">
                <li>
                  <code className="bg-white/10 px-1">roles</code> – Array of Better Auth role names
                  (e.g. <code className="bg-white/10 px-1">["admin"]</code>).
                </li>
                <li>
                  <code className="bg-white/10 px-1">allowEmails</code> – Array of emails allowed
                  when not using roles.
                </li>
                <li>
                  <code className="bg-white/10 px-1">allowIpAddresses</code> – Optional IP
                  allowlist for Studio requests.
                </li>
                <li>
                  <code className="bg-white/10 px-1">blockIpAddresses</code> – Optional IP blocklist
                  for Studio requests.
                </li>
                <li>
                  <code className="bg-white/10 px-1">sessionDuration</code> – Studio session length
                  (e.g. seconds).
                </li>
                <li>
                  <code className="bg-white/10 px-1">secret</code> – Secret for signing the studio
                  session; set in production.
                </li>
              </ul>
              <PixelCard variant="code">
                <CodeHighlighter
                  className="text-xs"
                  code={`access: {
  roles: ["admin"],
  allowEmails: ["admin@example.com"],
  allowIpAddresses: ["127.0.0.1", "::1", "192.168.*"],
  blockIpAddresses: ["203.0.113.45"],
  sessionDuration: 60 * 60 * 24,
  secret: process.env.STUDIO_SECRET,
}`}
                  language="typescript"
                />
              </PixelCard>
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("customize-metadata")}
                id="customize-metadata"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <GuideIcon />
                  metadata (title, logo, theme, colors)
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <ul className="list-none space-y-1.5 text-sm font-light tracking-tight text-white/70 ml-2">
                <li>
                  <code className="bg-white/10 px-1">title</code>,{" "}
                  <code className="bg-white/10 px-1">logo</code>,{" "}
                  <code className="bg-white/10 px-1">favicon</code>
                </li>
                <li>
                  <code className="bg-white/10 px-1">theme</code> –{" "}
                  <code className="bg-white/10 px-1">"dark"</code> |{" "}
                  <code className="bg-white/10 px-1">"light"</code> |{" "}
                  <code className="bg-white/10 px-1">"auto"</code>
                </li>
                <li>
                  <code className="bg-white/10 px-1">colors</code> –{" "}
                  <code className="bg-white/10 px-1">primary</code>,{" "}
                  <code className="bg-white/10 px-1">secondary</code>,{" "}
                  <code className="bg-white/10 px-1">accent</code>
                </li>
                <li>
                  <code className="bg-white/10 px-1">company</code> –{" "}
                  <code className="bg-white/10 px-1">name</code>,{" "}
                  <code className="bg-white/10 px-1">website</code>,{" "}
                  <code className="bg-white/10 px-1">supportEmail</code>
                </li>
                <li>
                  <code className="bg-white/10 px-1">features</code> – Toggle users, sessions,
                  organizations, analytics, tools, security
                </li>
                <li>
                  <code className="bg-white/10 px-1">links</code> –{" "}
                  <code className="bg-white/10 px-1">[&#123; label, url &#125;]</code>
                </li>
              </ul>
              <PixelCard variant="code">
                <CodeHighlighter
                  className="text-xs"
                  code={`metadata: {
  title: "My Admin",
  logo: "/logo.png",
  theme: "dark",
  colors: { primary: "#0ea5e9" },
  company: { name: "Acme", supportEmail: "support@acme.com" },
  features: { tools: true, analytics: true },
}`}
                  language="typescript"
                />
              </PixelCard>
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("customize-tools")}
                id="customize-tools"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  tools (hide tools)
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm font-light tracking-tight text-white/70">
                Use <code className="bg-white/10 px-1">tools.exclude</code> with ids like{" "}
                <code className="bg-white/10 px-1">test-oauth</code>,{" "}
                <code className="bg-white/10 px-1">health-check</code>,{" "}
                <code className="bg-white/10 px-1">run-migration</code> to hide them from the Tools
                page.
              </p>
              <CodeHighlighter
                className="text-xs py-3"
                code={`tools: { exclude: ["test-oauth", "health-check"] }`}
                language="typescript"
              />
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative mb-6">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("customize-events")}
                id="customize-events"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  events
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm font-light tracking-tight text-white/70">
                Optional event ingestion for the Events dashboard:{" "}
                <code className="bg-white/10 px-1">events.enabled</code>,{" "}
                <code className="bg-white/10 px-1">client</code> /{" "}
                <code className="bg-white/10 px-1">clientType</code> (prisma, drizzle, sqlite,
                etc.), <code className="bg-white/10 px-1">include</code> /{" "}
                <code className="bg-white/10 px-1">exclude</code> event types,{" "}
                <code className="bg-white/10 px-1">liveMarquee</code>.
              </p>
            </div>
          </PixelCard>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("customize-other")}
                id="customize-other"
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <GuideIcon />
                  lastSeenAt and ipAddress
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-2">
              <p className="text-sm font-light tracking-tight text-white/70">
                <code className="bg-white/10 px-1">lastSeenAt</code> – Updates a “last seen” column
                on the user at sign-in. <code className="bg-white/10 px-1">ipAddress</code> –
                Optional IP geolocation (ipinfo, ipapi, or MaxMind file) for Events/Sessions
                location.
              </p>
            </div>
          </PixelCard>
        </section>

        {/* More resources */}
        <section id="more">
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3
                onClick={() => handleSectionClick("more")}
                className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden cursor-pointer hover:border-white/40 hover:bg-white/15 transition-all duration-200"
              >
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <GuideIcon />
                  More resources
                </span>
              </h3>
            </div>
            <div className="pt-4">
              <ul className="space-y-2 text-sm font-light tracking-tight text-white/70">
                <li>
                  <Link
                    href="/installation"
                    className="underline underline-offset-2 hover:text-white/90"
                  >
                    Installation
                  </Link>{" "}
                  – Install options, prerequisites, and quick start.
                </li>
                <li>
                  <Link
                    href="/self-hosting"
                    className="underline underline-offset-2 hover:text-white/90"
                  >
                    Self-hosting
                  </Link>{" "}
                  – Full setup for every supported framework.
                </li>
                <li>
                  <a
                    href="https://better-auth.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-white/90"
                  >
                    Better Auth docs
                  </a>{" "}
                  – Auth configuration and APIs.
                </li>
              </ul>
            </div>
          </PixelCard>
        </section>
      </div>
    </PixelLayout>
  );
}
