import PixelLayout from "@/components/PixelLayout";
import PixelCard from "@/components/PixelCard";
import CodeHighlighter from "@/components/SyntaxHighlighter";
import CodeBlock from "@/components/CodeBlock";
import {
  HostedIcon,
  BetaIcon,
  DownloadIcon,
  InstallIcon,
  BasicUsageIcon,
  PrerequisitesIcon,
  DataLayersIcon,
  DocumentIcon,
} from "@/components/icons";
export default function Installation() {
  return (
    <PixelLayout
      currentPage="installation"
      title="INSTALLATION"
      description="Get Better Auth Studio up and running in your project."
    >
      <div className="space-y-8">
        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <HostedIcon />
                  Hosted Version
                </span>
              </h3>
            </div>
            <div className="pt-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                For the hosted version, please join the waitlist: <a href="https://better-auth.build" target="_blank" rel="noopener" className="underline underline-offset-2 font-bold">better-auth.build</a>
              </p>
            </div>
          </PixelCard>
        </section>
        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <BetaIcon />
                  Beta Version Notice
                </span>
              </h3>
            </div>
            <div className="pt-4">
              <p className="text-sm font-light tracking-tight text-white/70">
                Better Auth Studio is currently in <strong className="font-bold">beta</strong> and in early development. You may encounter bugs or incomplete features. Please report any  <a href="https://github.com/Kinfe123/better-auth-studio/issues" target="_blank" rel="noopener" className="underline underline-offset-2 font-bold">issues</a> you find on our GitHub repository to help us improve the project. Your feedback is greatly appreciated!
              </p>
            </div>
          </PixelCard>
        </section>
        <section>
          <PixelCard variant="highlight" className="relative">
            <div className="flex items-start">
              <div>
                <div className="absolute -top-10 left-0">
                  <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                    <span className="relative z-10 inline-flex gap-[2px] items-center">
                      <DownloadIcon />
                      Try the Beta Version
                    </span>
                  </h3>
                </div>
                <p className="text-sm pt-4 font-light tracking-tight text-white/70 mb-3">
                  Experience the latest features, patches, and improvements by installing the beta version. The beta includes recent bug fixes, performance enhancements, and new functionality that may not be available in the stable release yet.
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-light tracking-tight text-white/60 mb-1">
                      As dev dependency (recommended):
                    </p>
                    <CodeBlock
                      code="pnpm add -D better-auth-studio@beta"
                      className="flex-1 min-w-0"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-light tracking-tight text-white/60 mb-1">
                      Or globally:
                    </p>
                    <CodeBlock
                      code="pnpm add -g better-auth-studio@beta"
                      className="flex-1 min-w-0"
                    />
                  </div>
                </div>
                <p className="text-xs font-light tracking-tight text-white/60 mt-2">
                  <strong>Note:</strong> The beta version may include experimental features.
                </p>
              </div>
            </div>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">QUICK START</h2>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <InstallIcon />
                  Installation
                </span>
              </h3>
            </div>

            <div className="mb-4 pt-4">
              <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                <strong>Recommended: Install as dev dependency</strong> (for project-specific versions):
              </p>
              <CodeBlock code="pnpm add -D better-auth-studio@latest" />
              <p className="text-xs font-light tracking-tight text-white/60 mt-2">
                This keeps the studio version consistent across your team and project.
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                <strong>Stable version (global):</strong>
              </p>
              <CodeBlock code="pnpm add -g better-auth-studio@latest" />
            </div>

            <div className="mb-4">
              <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                <strong>Beta version (recommended, global):</strong>
              </p>
              <CodeBlock code="pnpm add -g better-auth-studio@beta" />
            </div>

            <p className="text-sm font-light tracking-tight text-white/70 mt-4 mb-4">
              Or use pnpx to run it without installation:
            </p>
            <CodeBlock code="pnpx better-auth-studio@beta" />
          </PixelCard>

          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <BasicUsageIcon />
                  Basic Usage
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  <strong>1. Navigate to your Better Auth project directory</strong>
                </p>
                <CodeBlock code="cd your-better-auth-project" />
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  <strong>2. Start the studio</strong>
                </p>
                <p className="text-xs font-light tracking-tight text-white/60 mb-2">
                  If installed as dev dependency:
                </p>
                <CodeBlock code="pnpm better-auth-studio start" />
                <p className="text-xs font-light tracking-tight text-white/60 mt-2 mb-2">
                  Or with pnpx:
                </p>
                <CodeBlock code="pnpx better-auth-studio start" />
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  <strong>3. Open your browser</strong>
                </p>
                <ul className="list-none space-y-1 text-sm font-light tracking-tight text-white/70 ml-4">
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    The studio will automatically open at <code className="bg-white/10 px-1 text-white/90">http://localhost:3000</code>
                  </li>
                  <li className="flex items-start">
                    <span className="text-white/50 mr-3">•</span>
                    Or manually navigate to the URL shown in the terminal
                  </li>
                </ul>
              </div>
            </div>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">PREREQUISITES</h2>
          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <PrerequisitesIcon />
                  Prerequisites
                </span>
              </h3>
            </div>
            <p className="text-sm font-light tracking-tight text-white/70 mb-4 pt-4">
              Before using Better Auth Studio, ensure you have:
            </p>
            <ul className="list-none space-y-3 text-sm font-light tracking-tight text-white/70">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Node.js</strong> (v18 or higher)
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>A Better Auth project</strong> with a valid <code className="bg-white/10 px-1 text-white/90">auth.ts</code> configuration file
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Database setup</strong> (Prisma, Drizzle, or SQLite)
              </li>
            </ul>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">CONFIGURATION</h2>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <DataLayersIcon />
                  Supported Database Adapters
                </span>
              </h3>
            </div>
            <p className="text-sm font-light tracking-tight text-white/70 mb-4 pt-4">
              Better Auth Studio automatically detects and works with:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                <strong>Prisma</strong> (<code className="bg-white/10 px-1 text-white/90">prismaAdapter</code>)
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                <strong>Drizzle</strong> (<code className="bg-white/10 px-1 text-white/90">drizzleAdapter</code>)
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                <strong>SQLite</strong> (<code className="bg-white/10 px-1 text-white/90">new Database()</code> from better-sqlite3)
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                <strong>PostgreSQL</strong> (via Prisma or Drizzle)
              </div>
              <div className="flex items-center text-sm font-light tracking-tight text-white/70">
                <span className="text-white/50 mr-3">→</span>
                <strong>MySQL</strong> (via Prisma or Drizzle)
              </div>
            </div>
          </PixelCard>

          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <DocumentIcon />
                  Example Configuration Files
                </span>
              </h3>
            </div>

            <div className="mb-6 pt-4">
              <h4 className="font-light tracking-tight mb-3 text-white">Prisma Setup</h4>
              <PixelCard variant="code">
                <CodeHighlighter
                  code={`// auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "sqlite"
  }),
  // ... other config
});`}
                  language="typescript"
                />
              </PixelCard>
            </div>

            <div className="mb-6">
              <h4 className="font-light tracking-tight mb-3 text-white">Drizzle Setup</h4>
              <PixelCard variant="code">
                <CodeHighlighter
                  code={`// auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  // ... other config
});`}
                  language="typescript"
                />
              </PixelCard>
            </div>

            <div>
              <h4 className="font-light tracking-tight mb-3 text-white">SQLite Setup</h4>
              <PixelCard variant="code">
                <CodeHighlighter
                  code={`// auth.ts
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./better-auth.db"),
  // ... other config
});`}
                  language="typescript"
                />
              </PixelCard>
            </div>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">FEATURES</h2>

          <PixelCard className="mb-8 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M3 3h18v18H3V3zm16 2H5v14h14V5zM7 12h2v5H7v-5zm10-5h-2v10h2V7zm-6 3h2v2h-2v-2zm2 4h-2v3h2v-3z"
                      fill="currentColor"
                    />
                  </svg>
                  Dashboard
                </span>
              </h3>
            </div>
            <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 pt-4">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Overview statistics</strong> - User counts, organization counts, session data
              </li>
            </ul>
          </PixelCard>

          <PixelCard className="mb-8 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M9 2h6v2H9V2zM7 6V4h2v2H7zm0 8H5V6h2v8zm2 2H7v-2h2v2zm6 0v2H9v-2h6zm2-2h-2v2h2v2h2v-6h-2v2zm0-8h2v8h-2V6zm0 0V4h-2v2h2zm-6 10v2h-2v-2h2zm0 0h2v-2h-2v2zm-2-4H7v2h2v-2zm8 0h-2v2h2v-2z"
                      fill="currentColor"
                    />
                  </svg>
                  User Management
                </span>
              </h3>
            </div>
            <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 pt-4">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>View all users</strong> - Paginated list with search and filtering
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Create users</strong> - Add new users with email/password
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Edit users</strong> - Update user information, email verification status
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Delete users</strong> - Remove users from the system
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Bulk operations</strong> - Seed multiple test users
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>User details</strong> - View user profiles, and accounts
              </li>
            </ul>
          </PixelCard>

          <PixelCard className="mb-8 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M2 2h14v4h6v16H2V2zm18 6h-4v2h2v2h-2v2h2v2h-2v2h2v2h2V8zm-6-4H4v16h2v-2h6v2h2V4zM6 6h2v2H6V6zm6 0h-2v2h2V6zm-6 4h2v2H6v-2zm6 0h-2v2h2v-2zm-6 4h2v2H6v-2zm6 0h-2v2h2v-2z"
                      fill="currentColor"
                    />
                  </svg>
                  Organization Management
                </span>
              </h3>
            </div>
            <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 pt-4">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>View organizations</strong> - List all organizations with pagination
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Create organizations</strong> - Add new organizations with custom slugs
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Edit organizations</strong> - Update organization details
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Delete organizations</strong> - Remove organizations
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Team management</strong> - Create and manage teams within organizations
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Member management</strong> - Add/remove members from teams
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Bulk seeding</strong> - Generate test organizations and teams
              </li>
            </ul>
          </PixelCard>

          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="noneTypeScript"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M10 2h4v2h2v2h2v2h2v4h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4v-4h2V8h2V6h2V4h2V2zm0 4H8v2H6v4h2v2h2v2h4v-2h2v-2h2V8h-2V6h-2V4h-4v2zm2 2h-2v2H8v2h2v2h2v2h2v-2h2v-2h-2v-2h-2V8z"
                      fill="currentColor"
                    />
                  </svg>
                  Settings & Configuration
                </span>
              </h3>
            </div>
            <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 pt-4">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Plugin status</strong> - Check which Better Auth plugins are enabled
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Database configuration</strong> - View current database adapter and settings
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Social providers</strong> - Configure OAuth providers (GitHub, Google, etc.)
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Email settings</strong> - Configure email verification and password reset
              </li>
            </ul>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">COMMAND LINE OPTIONS</h2>
          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M20 3H2v14h8v2H8v2h8v-2h-2v-2h8V3h-2zm-6 12H4V5h16v10h-6z"
                      fill="currentColor"
                    />
                  </svg>
                  Start Studio
                </span>
              </h3>
            </div>
            <p className="text-sm font-light tracking-tight text-white/70 mb-2 pt-4">
              If installed as dev dependency:
            </p>
            <CodeBlock code="pnpm better-auth-studio start [options]" className="mb-4" />
            <p className="text-sm font-light tracking-tight text-white/70 mb-2 mt-4">
              Or with pnpx:
            </p>
            <CodeBlock code="pnpx better-auth-studio start [options]" className="mb-4" />

            <h4 className="font-light tracking-tight mb-3 text-white">Options:</h4>
            <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 mb-4">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <code className="bg-white/10 px-1 text-white/90">--port &lt;number&gt;</code> - Specify port (default: 3000)
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <code className="bg-white/10 px-1 text-white/90">--host &lt;string&gt;</code> - Specify host (default: localhost)
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <code className="bg-white/10 px-1 text-white/90">--no-open</code> - Don't automatically open browser
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <code className="bg-white/10 px-1 text-white/90">--config &lt;path&gt;</code> - Path to auth config file (default: auto-detect)
              </li>
            </ul>

            <h4 className="font-light tracking-tight mb-3 text-white">Examples:</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Start on custom port:
                </p>
                <CodeBlock code="pnpm better-auth-studio start --port 3001" />
                <p className="text-xs font-light tracking-tight text-white/60 mt-1">
                  Or: <code className="bg-white/10 px-1 text-white/90">pnpx better-auth-studio start --port 3001</code>
                </p>
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Start without opening browser:
                </p>
                <CodeBlock code="pnpm better-auth-studio start --no-open" />
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Use custom config file:
                </p>
                <CodeBlock code="pnpm better-auth-studio start --config ./custom-auth.ts" />
              </div>
            </div>
          </PixelCard>

          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M10 2h4v2h2v2h2v2h2v4h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4v-4h2V8h2V6h2V4h2V2zm0 4H8v2H6v4h2v2h2v2h4v-2h2v-2h2V8h-2V6h-2V4h-4v2zm2 2h-2v2H8v2h2v2h2v2h2v-2h2v-2h-2v-2h-2V8z"
                      fill="currentColor"
                    />
                  </svg>
                  Using the <code className="bg-white/10 px-1 text-white/90">--config</code> Option
                </span>
              </h3>
            </div>

            <p className="text-sm font-light tracking-tight text-white/70 mb-4 pt-4">
              Specify a custom path to your auth config file when it's in a non-standard location or auto-detection fails.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Relative or absolute paths:
                </p>
                <CodeBlock code="pnpm better-auth-studio start --config ./src/lib/auth.ts" />
                <CodeBlock code="pnpm better-auth-studio start --config /path/to/auth.ts" className="mt-2" />
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-none">
              <p className="text-xs font-light tracking-tight text-white/70">
                <strong>Note:</strong> TypeScript path aliases (like <code className="bg-white/10 px-1 text-white/90">$lib</code>, <code className="bg-white/10 px-1 text-white/90">$app/*</code>) are automatically resolved based on your <code className="bg-white/10 px-1 text-white/90">tsconfig.json</code>.
              </p>
            </div>
          </PixelCard>

          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M4 2H2v8h2V2zm16 0h2v8h-2V2zm-6 6h-4V2H4v2h4v4H4v2h4v4H4v2h4v4H4v2h6v-6h4v6h2v-6h4v-2h-4v-4h4V8h-4V2h-2v6zm-4 6v-4h4v4h-4zM20 2h-4v2h4V2zM2 14h2v8H2v-8zm14 6h4v2h-4v-2zm6-6h-2v8h2v-8z"
                      fill="currentColor"
                    />
                  </svg>
                  Other Commands
                </span>
              </h3>
            </div>
            <div className="space-y-3 pt-4">
              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Check version:
                </p>
                <CodeBlock code="pnpx better-auth-studio --version" />
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Show help:
                </p>
                <CodeBlock code="pnpx better-auth-studio --help" />
              </div>
            </div>
          </PixelCard>
        </section>

        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">DEVELOPMENT</h2>
          <PixelCard className="mb-6 relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M4 11v2h12v2h2v-2h2v-2h-2V9h-2v2H4zm10-4h2v2h-2V7zm0 0h-2V5h2v2zm0 10h2v-2h-2v2zm0 0h-2v2h2v-2z"
                      fill="currentColor"
                    />
                  </svg>
                  Running from Source
                </span>
              </h3>
            </div>
            <div className="space-y-4 pt-4">
              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Clone the repository:
                </p>
                <CodeBlock code="git clone https://github.com/Kinfe123/better-auth-studio.git" />
                <CodeBlock code="cd better-auth-studio" className="mt-2" />
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Install dependencies:
                </p>
                <CodeBlock code="pnpm install" />
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Build the project:
                </p>
                <CodeBlock code="pnpm build" />
              </div>

              <div>
                <p className="text-sm font-light tracking-tight text-white/70 mb-2">
                  Start development server:
                </p>
                <CodeBlock code="pnpm dev" />
              </div>
            </div>
          </PixelCard>
          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M9 2h6v2H9V2zM7 6V4h2v2H7zm0 8H5V6h2v8zm2 2H7v-2h2v2zm6 0v2H9v-2h6zm2-2h-2v2h2v2h2v-6h-2v2zm0-8h2v8h-2V6zm0 0V4h-2v2h2zm-6 10v2h-2v-2h2zm0 0h2v-2h-2v2zm-2-4H7v2h2v-2zm8 0h-2v2h2v-2z"
                      fill="currentColor"
                    />
                  </svg>
                  Contributing
                </span>
              </h3>
            </div>
            <ol className="list-none space-y-2 text-sm font-light tracking-tight text-white/70 pt-4">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">1.</span>
                Fork the repository
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">2.</span>
                Create a feature branch
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">3.</span>
                Make your changes
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">4.</span>
                Add tests if applicable
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">5.</span>
                Submit a pull request
              </li>
            </ol>
          </PixelCard>
        </section>
        <section>
          <h2 className="text-2xl font-light tracking-tight mb-6 text-white">SUPPORT</h2>
          <PixelCard className="relative">
            <div className="absolute -top-10 left-0">
              <h3 className="relative text-[12px] font-light uppercase tracking-tight text-white/90 border border-white/20 bg-[#0a0a0a] px-2 py-[6px] overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                <span className="relative z-10 inline-flex gap-[2px] items-center">
                  <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 inline-flex mr-1 text-white/50"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      fill="currentColor"
                    />
                  </svg>
                  Support & Help
                </span>
              </h3>
            </div>
            <p className="text-sm font-light tracking-tight text-white/70 mb-4 pt-4">
              If you encounter any issues or have questions:
            </p>
            <ul className="list-none space-y-2 text-sm font-light tracking-tight text-white/70">
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Search existing issues</strong> on GitHub
              </li>
              <li className="flex items-start">
                <span className="text-white/50 mr-3">•</span>
                <strong>Create a new issue</strong> with detailed information
              </li>
            </ul>
          </PixelCard>
        </section>
      </div>
    </PixelLayout>
  );
}