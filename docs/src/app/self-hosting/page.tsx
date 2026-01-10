"use client";

import { useState, useEffect } from "react";
import PixelLayout from "@/components/PixelLayout";
import PixelCard from "@/components/PixelCard";
import CodeHighlighter from "@/components/SyntaxHighlighter";
import CodeBlock from "@/components/CodeBlock";
import {
  BetaIcon,
  ServerIcon,
  NextJsIcon,
  ExpressIcon,
  HonoIcon,
  ElysiaIcon,
  SvelteKitIcon,
  SolidStartIcon,
  TanStackStartIcon,
  AstroIcon,
  RemixIcon,
  NuxtIcon,
  ConfigIcon,
  WarningIcon,
  PrerequisitesIcon,
} from "@/components/icons";

type Framework = "nextjs" | "express" | "hono" | "elysia" | "sveltekit" | "solidstart" | "tanstackstart" | "astro" | "remix" | "nuxt";

const frameworks: Array<{
  id: Framework;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
    { id: "nextjs", name: "Next.js", icon: NextJsIcon },
    { id: "express", name: "Express", icon: ExpressIcon },
    { id: "hono", name: "Hono", icon: HonoIcon },
    { id: "elysia", name: "Elysia", icon: ElysiaIcon },
    { id: "sveltekit", name: "Svelte Kit", icon: SvelteKitIcon },
    { id: "solidstart", name: "Solid Start", icon: SolidStartIcon },
    { id: "tanstackstart", name: "TanStack Start", icon: TanStackStartIcon },
    { id: "astro", name: "Astro", icon: AstroIcon },
    { id: "remix", name: "Remix", icon: RemixIcon },
    { id: "nuxt", name: "Nuxt", icon: NuxtIcon },
  ];
export default function SelfHosting() {
  const [activeFramework, setActiveFramework] = useState<Framework>("nextjs");

  useEffect(() => {
    if (window.location.hash === '#frameworks') {
      const element = document.getElementById('frameworks');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);
  return (
    <PixelLayout
      currentPage="self-hosting"
      title="SELF-HOSTING"
      description="Deploy Better Auth Studio on your own infrastructure."
    >
      <div className="space-y-8">
        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <BetaIcon />
                  Beta Feature
                </span>
              </h3>
            </div>
            <div className="pt-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                Self-hosting is currently in <strong className="font-bold">beta</strong>. This feature allows you to deploy Better Auth Studio alongside your application for production use. You may encounter bugs or incomplete features. Please report any <a href="https://github.com/Kinfe123/better-auth-studio/issues" target="_blank" rel="noopener" className="underline underline-offset-2 font-bold">issues</a> on GitHub.
              </p>
            </div>
          </PixelCard>
        </section>

        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ServerIcon />
                  Overview
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <p className="text-sm font-light tracking-tight text-white/70">
                Self-hosting Better Auth Studio allows you to embed the admin dashboard directly into your application. This enables you to access the studio at a custom route like <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code> or <code className="text-white/90 bg-white/10 px-1 py-0.5">/admin</code>.
              </p>
              <p className="text-sm font-light tracking-tight text-white/70">
                Benefits include:
              </p>
              <ul className="text-sm font-light tracking-tight text-white/70 space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>Deploy studio alongside your app in production</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>Role-based access control with admin login</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>Restrict access to specific admin emails</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>Framework-agnostic (Next.js, Express, and more)</span>
                </li>
              </ul>
            </div>
          </PixelCard>
        </section>

        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <PrerequisitesIcon />
                  Prerequisites
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <ul className="text-sm font-light tracking-tight text-white/70 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-white/50">1.</span>
                  <span>Better Auth Studio installed as a <strong className="font-bold">regular dependency</strong> (required for production)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">2.</span>
                  <span>A Better Auth project with valid <code className="text-white/90 bg-white/10 px-1 py-0.5">auth.ts</code> configuration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">3.</span>
                  <span>Database adapter configured (Prisma, Drizzle, or SQLite)</span>
                </li>
              </ul>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-light tracking-tight text-white/60">
                  ⚠️ <strong className="font-bold text-white/80">Important:</strong> For self-hosting, install as a regular dependency (not devDependency) since it's needed at runtime in production.
                </p>
                <CodeBlock
                  code="pnpm add better-auth-studio"
                  className="flex-1 min-w-0"
                />
              </div>
            </div>
          </PixelCard>
        </section>

        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  Step 1: Initialize Studio Config
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                Run the init command to generate the configuration file:
              </p>
              <CodeBlock
                code="pnpx better-auth-studio init"
                className="flex-1 min-w-0"
              />
              <p className="text-sm font-light tracking-tight text-white/70">
                This creates a <code className="text-white/90 bg-white/10 px-1 py-0.5">studio.config.ts</code> file in your project root:
              </p>
              <CodeHighlighter
                code={`import type { StudioConfig } from "better-auth-studio";
import { auth } from "./lib/auth";

const config: StudioConfig = {
  auth,
  basePath: "/api/studio",
  metadata: {
    title: "Admin Dashboard",
    theme: "dark",
  },
  access: {
    roles: ["admin"],
    allowEmails: ["admin@example.com"],
  },
};

export default config;`}
                language="typescript"
              />
            </div>
          </PixelCard>
        </section>

        <section id="frameworks">
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0 z-99 md:hidden">
              <div className="relative">
                <select
                  value={activeFramework}
                  onChange={(e) => setActiveFramework(e.target.value as Framework)}
                  className="relative z-10 text-[12px] font-light uppercase tracking-tight 
                    text-white/90 border border-white/40 bg-white/10 
                    px-2 py-[6px] pr-8 overflow-hidden transition-all duration-200
                    appearance-none cursor-pointer w-full
                    focus:border-white/40 focus:bg-white/10 focus:outline-none
                    shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '12px',
                  }}
                >
                  {frameworks.map((framework) => (
                    <option key={framework.id} value={framework.id}>
                      {framework.name}
                    </option>
                  ))}
                </select>
                <div className="absolute -z-1 inset-0 bg-black pointer-events-none" />
                <div className="absolute z-0 inset-0 bg-white/5 pointer-events-none" />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[4%] pointer-events-none" />
              </div>
            </div>

            <div className="absolute -top-10 left-0 hidden md:flex gap-2 flex-wrap z-99">
              {frameworks.map((framework) => {
                const Icon = framework.icon;
                const isActive = activeFramework === framework.id;
                return (
                  <button
                    key={framework.id}
                    onClick={() => setActiveFramework(framework.id)}
                    className={`
                      relative text-[12px] font-light z-10 uppercase tracking-tight 
                      text-white/90 border bg-[#0a0a0a] 
                      px-2 py-[6px] overflow-hidden transition-all duration-200
                      inline-flex items-center gap-[5px] no-underline
                      ${isActive
                        ? "border-white/40 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                        : "border-white/20 hover:border-white/30 hover:bg-white/5"
                      }
                    `}
                  >
                    {isActive && <div className="absolute -z-1 inset-0 bg-black" />}
                    {isActive && <div className="absolute z-10 inset-0 bg-white/10" />}
                    {isActive ? (
                      <>
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[8%]" />
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_8px)] opacity-[4%]" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                    )}
                    <span className="relative z-10 inline-flex gap-[5px] items-center">
                      <Icon />
                      {framework.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pt-4 space-y-4 relative">
              <div className="min-h-[400px]">
                {activeFramework === "nextjs" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For Next.js App Router, the init command automatically creates the API route file at <code className="text-white/90 bg-white/10 px-1 py-0.5">app/api/studio/[[...path]]/route.ts</code>:
                      </p>
                      <CodeHighlighter
                        code={`import { betterAuthStudio } from "better-auth-studio/nextjs";
import studioConfig from "@/studio.config";

const handler = betterAuthStudio(studioConfig);

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as DELETE,
  handler as PATCH,
};`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "express" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For Express apps, add the studio handler to your server:
                      </p>
                      <CodeHighlighter
                        code={`import express from "express";
import { toNodeHandler } from "better-auth/node";
import { betterAuthStudio } from "better-auth-studio/express";
import { auth } from "./auth";
import studioConfig from "./studio.config";

const app = express();

app.use(express.json());
app.use("/api/studio", betterAuthStudio(studioConfig));
app.all("/api/auth/*", toNodeHandler(auth));


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "hono" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For Hono apps, add the studio handler to your server:
                      </p>
                      <CodeHighlighter
                        code={`import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { auth } from './auth';
import { betterAuthStudio } from 'better-auth-studio/hono';
import studioConfig from './studio.config';

const app = new Hono();

// CORS configuration (optional)
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Better Auth Studio routes
app.on(['POST', 'GET', 'PUT', 'DELETE'], '/api/studio/*', betterAuthStudio(studioConfig));

// Better Auth routes
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
serve({
  fetch: app.fetch,
  port: PORT,
}, (info) => {
  console.log(\`🚀 Server running on http://localhost:\${info.port}\`);
});`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "elysia" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For Elysia apps (optimized for Bun), add the studio handler to your server:
                      </p>
                      <CodeHighlighter
                        code={`import { Elysia } from 'elysia';
import { auth } from './auth';
import { betterAuthStudio } from 'better-auth-studio/elysia';
import studioConfig from './studio.config';

const app = new Elysia()
  
  .all('/api/studio', betterAuthStudio(studioConfig))
  .all('/api/studio/*', betterAuthStudio(studioConfig))
  // Better Auth routes
  .all('/api/auth', async (context) => {
    const response = await auth.handler(context.request);
    return response;
  })
  .all('/api/auth/*', async (context) => {
    const response = await auth.handler(context.request);
    return response;
  });

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                      <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-none">
                        <p className="text-xs font-light tracking-tight text-white/60 mb-2">
                          <strong className="font-bold text-white/80">Note:</strong> Elysia is optimized for Bun runtime. Make sure to install the required dependencies:
                        </p>
                        <p className="text-xs font-light tracking-tight text-white/50 mt-2">
                          <strong className="font-bold text-white/70">Why two routes?</strong> Elysia's wildcard route <code className="text-white/70 bg-white/10 px-1 py-0.5">/api/studio/*</code> matches sub-paths but not the exact path. We include both <code className="text-white/70 bg-white/10 px-1 py-0.5">/api/studio</code> and <code className="text-white/70 bg-white/10 px-1 py-0.5">/api/studio/*</code> to handle all cases.
                        </p>
                      </div>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "sveltekit" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For SvelteKit apps, create a catch-all route handler for the studio:
                      </p>
                      <CodeHighlighter
                        code={`// src/routes/api/studio/[...path]/+server.ts
import { betterAuthStudio } from 'better-auth-studio/svelte-kit';
import studioConfig from '../../../../../studio.config';

const handler = betterAuthStudio(studioConfig);

export async function GET(event) {
  return handler(event);
}

export async function POST(event) {
  return handler(event);
}

export async function PUT(event) {
  return handler(event);
}

export async function DELETE(event) {
  return handler(event);
}

export async function PATCH(event) {
  return handler(event);
}`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "solidstart" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For SolidStart apps, create a catch-all route handler for the studio:
                      </p>
                      <CodeHighlighter
                        code={`// src/routes/api/studio/*studio.ts
import { betterAuthStudio } from "better-auth-studio/solid-start";
import studioConfig from "../../../../studio.config";

const handler = betterAuthStudio(studioConfig);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "tanstackstart" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For TanStack Start apps, create a server route handler for the studio:
                      </p>
                      <CodeHighlighter
                        code={`// src/routes/api/studio/$.ts
import { createFileRoute } from '@tanstack/react-router';
import { betterAuthStudio } from 'better-auth-studio/tanstack-start';
import studioConfig from '../../../../studio.config';

const handler = betterAuthStudio(studioConfig);

export const Route = createFileRoute('/api/studio/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      DELETE: handler,
      PATCH: handler,
    },
  },
});`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "astro" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For Astro apps, create a catch-all API route handler for the studio:
                      </p>
                      <CodeHighlighter
                        code={`// pages/api/studio/[...all].ts
import { betterAuthStudio } from 'better-auth-studio/astro';
import studioConfig from '../../../../studio.config';
import type { APIRoute } from 'astro';

const handler = betterAuthStudio(studioConfig);

export const ALL: APIRoute = async (ctx) => {
  return handler(ctx);
};`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "remix" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For Remix apps, create a resource route handler for the studio:
                      </p>
                      <CodeHighlighter
                        code={`// app/routes/api.studio.$.ts
import { betterAuthStudio } from 'better-auth-studio/remix';
import studioConfig from '~/studio.config';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

const handler = betterAuthStudio(studioConfig);

export async function loader({ request }: LoaderFunctionArgs) {
  return handler({ request });
}

export async function action({ request }: ActionFunctionArgs) {
  return handler({ request });
}`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}

                {activeFramework === "nuxt" && (
                  <PixelCard variant="highlight" className="relative">
                    <div className="pt-4 space-y-4 relative">
                      <p className="text-sm font-light tracking-tight text-white/70">
                        For Nuxt apps, create a catch-all API route handler for the studio:
                      </p>
                      <CodeHighlighter
                        code={`// server/api/studio/[...all].ts
import { betterAuthStudio } from 'better-auth-studio/nuxt';
import studioConfig from '~/studio.config';
import { toWebRequest } from 'better-auth/nuxt';

const handler = betterAuthStudio(studioConfig);

export default defineEventHandler(async (event) => {
  return handler(toWebRequest(event));
});`}
                        language="typescript"
                      />
                      <p className="text-sm font-light tracking-tight text-white/70">
                        Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">/api/studio</code>
                      </p>
                    </div>
                  </PixelCard>
                )}
              </div>
            </div>
          </PixelCard>
        </section>

        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ConfigIcon />
                  Configuration Options
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <div className="space-y-3">
                <div className="border-b border-white/10 pb-3">
                  <code className="text-white/90 text-sm">auth</code>
                  <span className="text-white/50 text-xs ml-2">(required)</span>
                  <p className="text-sm font-light tracking-tight text-white/50 mt-1">
                    Your Better Auth instance from <code className="text-white/70 bg-white/10 px-1 py-0.5">auth.ts</code>
                  </p>
                </div>
                <div className="border-b border-white/10 pb-3">
                  <code className="text-white/90 text-sm">basePath</code>
                  <span className="text-white/50 text-xs ml-2">(required)</span>
                  <p className="text-sm font-light tracking-tight text-white/50 mt-1">
                    The URL path where studio is mounted (e.g., <code className="text-white/70 bg-white/10 px-1 py-0.5">/api/studio</code>)
                  </p>
                  <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-none">
                    <p className="text-xs font-light tracking-tight text-white/60 mb-2">
                      <strong className="font-bold text-white/80">⚠️ Important:</strong> When adjusting the <code className="text-white/70 bg-white/10 px-1 py-0.5">basePath</code>, make sure to adjust your route structure accordingly when mounting the handler.
                    </p>
                    <p className="text-xs font-light tracking-tight text-white/50 mt-2">
                      For example, if your <code className="text-white/70 bg-white/10 px-1 py-0.5">basePath</code> is <code className="text-white/70 bg-white/10 px-1 py-0.5">/admin</code>, your route file should be at <code className="text-white/70 bg-white/10 px-1 py-0.5">app/admin/[[...path]]/route.ts</code> to matching the path structure.
                    </p>
                  </div>
                </div>
                <div className="border-b border-white/10 pb-3">
                  <code className="text-white/90 text-sm">access.allowEmails</code>
                  <span className="text-white/50 text-xs ml-2">(optional)</span>
                  <p className="text-sm font-light tracking-tight text-white/50 mt-1">
                    Array of email addresses allowed to access the studio
                  </p>
                  <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-none">
                    <p className="text-xs font-light tracking-tight text-white/60 mb-2">
                      <strong className="font-bold text-white/80">💡 Best Practice:</strong> Use environment variables for configuration to keep sensitive data out of your codebase:
                    </p>
                    <CodeHighlighter
                      code={`// studio.config.ts
import type { StudioConfig } from "better-auth-studio";
import { auth } from "./lib/auth";

const config: StudioConfig = {
  auth,
  basePath: process.env.STUDIO_BASE_PATH || "/api/studio",
  access: {
    allowEmails: [
      process.env.ADMIN_EMAIL_1,
      process.env.ADMIN_EMAIL_2,
      process.env.ADMIN_EMAIL_3,
    ].filter(Boolean) as string[],
  },
};

export default config;`}
                      language="typescript"
                    />
                    <p className="text-xs font-light tracking-tight text-white/50 mt-2">
                      Add to your <code className="text-white/70 bg-white/10 px-1 py-0.5">.env</code> file:
                    </p>
                    <CodeBlock
                      code={`STUDIO_BASE_PATH=/api/studio
ADMIN_EMAIL_1=admin@example.com
ADMIN_EMAIL_2=admin2@example.com
ADMIN_EMAIL_3=admin3@example.com`}
                      className="flex-1 min-w-0 mt-2"
                    />
                  </div>
                </div>
                <div className="border-b border-white/10 pb-3">
                  <code className="text-white/90 text-sm">access.roles</code>
                  <span className="text-white/50 text-xs ml-2">(optional)</span>
                  <p className="text-sm font-light tracking-tight text-white/50 mt-1">
                    Array of user roles allowed to access (e.g., <code className="text-white/70 bg-white/10 px-1 py-0.5">["admin", "superadmin"]</code>)
                  </p>
                </div>
                <div className="pb-3">
                  <code className="text-white/90 text-sm">metadata</code>
                  <span className="text-white/50 text-xs ml-2">(optional)</span>
                  <p className="text-sm font-light tracking-tight text-white/50 mt-1">
                    Custom branding with <code className="text-white/70 bg-white/10 px-1 py-0.5">title</code> and <code className="text-white/70 bg-white/10 px-1 py-0.5">theme</code>
                  </p>
                </div>
              </div>
            </div>
          </PixelCard>
        </section>

        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <WarningIcon />
                  Security Notes
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-3">
              <ul className="text-sm font-light tracking-tight text-white/70 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>Always configure <code className="text-white/90 bg-white/10 px-1 py-0.5">allowedEmails</code> or <code className="text-white/90 bg-white/10 px-1 py-0.5">allowedRoles</code> in production</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>The studio uses encrypted session cookies for authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>Admin users must sign in with email/password through the studio login page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white/50">→</span>
                  <span>Consider using environment-specific configurations for different deployment stages</span>
                </li>
              </ul>
            </div>
          </PixelCard>
        </section>
      </div>
    </PixelLayout>
  );
}

