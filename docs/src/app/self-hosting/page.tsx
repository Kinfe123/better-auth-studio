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
  ConfigIcon,
  WarningIcon,
  PrerequisitesIcon,
} from "@/components/icons";

export default function SelfHosting() {
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

        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <ConfigIcon />
                  Framework Integration
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                Choose your framework to see integration instructions:
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#nextjs"
                  className="text-xs font-light tracking-tight text-white/70 hover:text-white/90 border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-none transition-colors inline-flex items-center gap-2"
                >
                  <NextJsIcon />
                  Next.js
                </a>
                <a
                  href="#express"
                  className="text-xs font-light tracking-tight text-white/70 hover:text-white/90 border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-none transition-colors inline-flex items-center gap-2"
                >
                  <ExpressIcon />
                  Express
                </a>
                <a
                  href="#hono"
                  className="text-xs font-light tracking-tight text-white/70 hover:text-white/90 border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-none transition-colors inline-flex items-center gap-2"
                >
                  <HonoIcon />
                  Hono
                </a>
                <a
                  href="#elysia"
                  className="text-xs font-light tracking-tight text-white/70 hover:text-white/90 border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-none transition-colors inline-flex items-center gap-2"
                >
                  <ElysiaIcon />
                  Elysia
                </a>
                <a
                  href="#sveltekit"
                  className="text-xs font-light tracking-tight text-white/70 hover:text-white/90 border border-white/20 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-none transition-colors inline-flex items-center gap-2"
                >
                  <SvelteKitIcon />
                  SvelteKit
                </a>
              </div>
            </div>
          </PixelCard>
        </section>

        <section id="nextjs">
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <NextJsIcon />
                  Next.js Setup
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                For Next.js App Router, the init command automatically creates the API route file at <code className="text-white/90 bg-white/10 px-1 py-0.5">app/api/studio/[[...path]]/route.ts</code>:
              </p>
              <CodeHighlighter
                code={`import { createStudioHandler } from "better-auth-studio/nextjs";
import studioConfig from "@/studio.config";

const handler = createStudioHandler(studioConfig);

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
                Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">http://localhost:3000/api/studio</code>
              </p>
            </div>
          </PixelCard>
        </section>

        <section id="express">
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ExpressIcon />
                  Express Setup
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
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
                Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">http://localhost:3000/api/studio</code>
              </p>
            </div>
          </PixelCard>
        </section>

        <section id="hono">
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <HonoIcon />
                  Hono Setup
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
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
                Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">http://localhost:3000/api/studio</code>
              </p>
            </div>
          </PixelCard>
        </section>

        <section id="elysia">
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <ElysiaIcon />
                  Elysia Setup
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
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
                Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">http://localhost:3000/api/studio</code>
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
        </section>

        <section id="sveltekit">
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[5px] items-center">
                  <SvelteKitIcon />
                  SvelteKit Setup
                </span>
              </h3>
            </div>
            <div className="pt-4 space-y-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                For SvelteKit apps, create a catch-all route handler for the studio:
              </p>
              <CodeHighlighter
                code={`// src/routes/api/studio/[...path]/+server.ts
import { betterAuthStudio } from 'better-auth-studio/svelte-kit';
import studioConfig from '../../../../../studio.config.js';

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
                Make sure your <code className="text-white/90 bg-white/10 px-1 py-0.5">hooks.server.ts</code> includes the Better Auth handler:
              </p>
              <CodeHighlighter
                code={`// src/hooks.server.ts
import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";

export async function handle({ event, resolve }) {
  return svelteKitHandler({ event, resolve, auth, building });
}`}
                language="typescript"
              />
              <p className="text-sm font-light tracking-tight text-white/70">
                Access the studio at <code className="text-white/90 bg-white/10 px-1 py-0.5">http://localhost:5173/api/studio</code>
              </p>
              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-none">
                <p className="text-xs font-light tracking-tight text-white/60 mb-2">
                  <strong className="font-bold text-white/80">Note:</strong> SvelteKit uses file-based routing. The catch-all route <code className="text-white/70 bg-white/10 px-1 py-0.5">[...path]</code> will match all paths under <code className="text-white/70 bg-white/10 px-1 py-0.5">/api/studio</code>.
                </p>
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
                </div>
                <div className="border-b border-white/10 pb-3">
                  <code className="text-white/90 text-sm">access.allowEmails</code>
                  <span className="text-white/50 text-xs ml-2">(optional)</span>
                  <p className="text-sm font-light tracking-tight text-white/50 mt-1">
                    Array of email addresses allowed to access the studio
                  </p>
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

