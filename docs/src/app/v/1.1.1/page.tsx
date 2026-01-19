'use client';

import { useEffect, useState } from 'react';
import { Component as EtheralShadow } from '@/components/ui/ethereal-shadow';
import { EventMarquee } from '@/components/ui/EventMarquee';
import EventIngestionFlow from '@/components/ui/event-ingestion-flow';
import PixelCard from '@/components/PixelCard';
import CodeBlock from '@/components/CodeBlock';
import CodeHighlighter from '@/components/SyntaxHighlighter';
import {
  PostgresIcon,
  SqliteIcon,
  PrismaIcon,
  DrizzleIcon,
  ClickHouseIcon,
  MySQLIcon,
  InstallIcon,
} from '@/components/icons';

export default function Version111Page() {
  const [activeTab, setActiveTab] = useState('sqlite');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    document.documentElement.classList.add('dark');

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const databases = [
    { name: 'PostgreSQL', icon: PostgresIcon },
    { name: 'SQLite', icon: SqliteIcon },
    { name: 'Prisma', icon: PrismaIcon },
    { name: 'Drizzle', icon: DrizzleIcon },
    { name: 'ClickHouse', icon: ClickHouseIcon },
  ];

  const codeExamples = {
    postgres: `import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';
import { Pool } from 'pg';

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const studioConfig: StudioConfig = {
  auth,
  basePath: '/api/studio',
  events: {
    enabled: true,
    client: pgPool,
    clientType: 'postgres',
    tableName: 'auth_events',
  },
};

export default studioConfig;`,
    sqlite: `import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';
import Database from 'better-sqlite3';

const studioConfig: StudioConfig = {
  auth,
  basePath: '/api/studio',
  events: {
    enabled: true,
    client: new Database('./db.sqlite'),
    clientType: 'sqlite',
    tableName: 'auth_events',
  },
};

export default studioConfig;`,
    prisma: `import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';
import prisma from './src/prisma';

const studioConfig: StudioConfig = {
  auth,
  basePath: '/api/studio',
  events: {
    enabled: true,
    client: prisma,
    clientType: 'prisma',
    tableName: 'auth_events',
  },
};

export default studioConfig;`,
    drizzle: `import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';
import { db } from './lib/db';

const studioConfig: StudioConfig = {
  auth,
  basePath: '/api/studio',
  events: {
    enabled: true,
    client: db,
    clientType: 'drizzle',
    tableName: 'auth_events',
  },
};

export default studioConfig;`,
    clickhouse: `import type { StudioConfig } from 'better-auth-studio';
import { auth } from './src/auth';
import { createClient } from '@clickhouse/client';

const clickhouseClient = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
});

const studioConfig: StudioConfig = {
  auth,
  basePath: '/api/studio',
  events: {
    enabled: true,
    client: clickhouseClient,
    clientType: 'clickhouse',
    tableName: 'auth_events',
  },
};

export default studioConfig;`,
  };

  const tabs = [
    { id: 'sqlite', name: 'SQLite', icon: SqliteIcon },
    { id: 'postgres', name: 'PostgreSQL', icon: PostgresIcon },
    { id: 'prisma', name: 'Prisma', icon: PrismaIcon },
    { id: 'drizzle', name: 'Drizzle', icon: DrizzleIcon },
    { id: 'clickhouse', name: 'ClickHouse', icon: ClickHouseIcon },
  ];

  return (
    <div className="bg-[#0a0a0a] text-white h-screen overflow-hidden overflow-x-hidden font-sans selection:bg-white selection:text-black relative">

      <header className="hidden md:absolute top-0 lg:-top-4 right-0 p-4 lg:p-8 z-50">
        <span className="font-mono text-[10px] lg:text-[11px] tracking-widest uppercase text-white/50">Better Auth Studio v1.1.1</span>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden overflow-x-hidden">
        <section className="overflow-x-hidden flex flex-col justify-start md:justify-between p-4 sm:p-6 lg:p-10 border-r-0 lg:border-r border-white/20 overflow-y-auto relative bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0 pointer-events-none opacity-70 md:opacity-100 mix-blend-overlay"
            style={{
              backgroundImage: 'url(/shades.png)',
              backgroundRepeat: 'repeat',
              backgroundSize: 'auto'
            }}
          />
          <div className="relative z-10 flex flex-col justify-start md:justify-between h-full scrollbar-hide">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-light tracking-tighter uppercase font-mono mb-2 sm:mb-3">
                  Release <br /> <span className="bg-white text-black px-1 py-0 rounded-none">Version 1.1.1</span>
                </h1>
                <div className="-mx-4 sm:-mx-6 lg:-mx-10 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] mb-3 sm:mb-4 lg:mb-4">
                  <hr className="w-full border-white/10 h-px" />
                  <div className="relative z-20 h-2 w-full bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                  <hr className="w-full border-white/10 h-px" />
                </div>
                <p className="text-[11px] sm:text-sm lg:text-xs font-light text-white/90 leading-relaxed font-mono uppercase mb-3 sm:mb-4">
                  <span>{"// "}</span>  Better Auth Studio now supports multiple database clients including PostgreSQL, SQLite, Prisma, Drizzle ORM, ClickHouse, and MySQL with seamless event ingestion and automatic table creation.
                </p>

                <div className="mb-3 sm:mb-4">
                  <div className="relative">
                    <div className="absolute left-0 sm:left-3">
                      <h3 className="relative z-20 text-[10px] sm:text-[11px] font-light uppercase tracking-tight text-white/90 border border-white/15 bg-[#0a0a0a] px-1.5 sm:px-2 py-0.5 sm:py-1 overflow-hidden">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                        <span className="relative inline-flex gap-1 items-center">
                          <InstallIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Installation
                        </span>
                      </h3>
                    </div>
                  </div>
                  <div className="pt-3 sm:pt-4 space-y-2">
                    <CodeBlock code="pnpm add better-auth-studio@latest" className="border-white/15" />
                  </div>
                </div>
              </div>
              <div className="-mx-4 sm:-mx-6 lg:-mx-10 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] mb-3 sm:mb-4 lg:mb-4">
                <hr className="w-full border-white/10 h-px" />
                <div className="relative z-20 h-2 w-full bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                <hr className="w-full border-white/10 h-px" />
              </div>

              <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <h2 className="text-xs sm:text-sm font-medium font-mono uppercase tracking-wider text-white">What's New</h2>
                <div className="w-full mb-3 sm:mb-4 lg:hidden">
                  <hr className="w-full border-white/15 h-px" />
                </div>
                <div className="hidden lg:block -mx-10 w-[calc(100%+5rem)] mb-4">
                  <hr className="w-full border-white/15 h-px" />
                </div>
                <div className="space-y-2 sm:space-y-2.5 font-sans">
                  <div>
                    <p className="text-[11px] sm:text-xs lg:text-sm leading-relaxed text-white/80 font-light mb-3 sm:mb-4">
                      <strong className="font-light font-mono uppercase text-white">Database Event Ingestion:</strong> Better Auth Studio now supports comprehensive event ingestion across multiple database clients including PostgreSQL (pg Pool/Client), SQLite (better-sqlite3), Prisma Client, Drizzle ORM, ClickHouse, and MySQL.
                    </p>
                    <div className="space-y-2">
                      <div className="relative min-h-0">
                        <div className="absolute top-0.5 pb-8 left-4 hidden md:flex gap-2 flex-wrap z-10">
                          {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                  relative font-mono text-[10px] sm:text-[11px] font-light z-10 uppercase tracking-tight 
                                  text-white/90 border bg-[#0a0a0a] 
                                  px-1.5 sm:px-2 py-0.5 sm:py-1 overflow-hidden transition-all duration-200
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
                                  <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  {tab.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Mobile select dropdown */}
                        <div className="md:hidden pt-3 sm:pt-4">
                          <div className="relative mb-2">
                            <select
                              value={activeTab}
                              onChange={(e) => setActiveTab(e.target.value)}
                              className="relative z-10 text-[11px] sm:text-[12px] font-light uppercase tracking-tight 
                                text-white/90 border border-white/40 bg-white/5 
                                px-2 py-[6px] pr-8 overflow-hidden transition-all duration-200
                                appearance-none cursor-pointer w-full
                                focus:border-white/40 focus:bg-white/10 focus:outline-none
                                shadow-[0_0_0_1px_rgba(255,255,255,0.15)] font-mono"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 8px center',
                                backgroundSize: '12px',
                              }}
                            >
                              {tabs.map((tab) => (
                                <option key={tab.id} value={tab.id}>
                                  {tab.name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute -z-1 inset-0 bg-black pointer-events-none" />
                            <div className="absolute z-0 inset-0 bg-white/5 pointer-events-none" />
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[4%] pointer-events-none" />
                          </div>
                          <PixelCard variant="highlight" className="border-white/15 p-0 overflow-hidden">
                            <div className="relative px-3 pb-2 max-h-[300px] overflow-y-auto overflow-x-hidden thin-scrollbar">
                              <CodeHighlighter
                                code={codeExamples[activeTab as keyof typeof codeExamples]}
                                language="typescript"
                                className="text-xs"
                              />
                            </div>
                          </PixelCard>
                        </div>
                      </div>
                      {/* Desktop code block */}
                      <div className="pt-3 sm:pt-4 hidden md:block">
                        <PixelCard variant="highlight" className="border-white/15 pb0 overflow-hidden">
                          <div className="relative px-3 pt-2 max-h-[250px] overflow-y-auto overflow-x-hidden thin-scrollbar">
                            <CodeHighlighter
                              code={codeExamples[activeTab as keyof typeof codeExamples]}
                              language="typescript"
                              className="text-sm"
                            />
                          </div>
                        </PixelCard>
                      </div>
                    </div>
                  </div>
                  <div className="w-full mb-3 sm:mb-4 lg:hidden">
                    <hr className="w-full border-white/15 h-px" />
                  </div>
                  <div className="hidden lg:block mt-10 -mx-10 w-[calc(100%+5rem)] mb-4">
                    <hr className="w-full border-white/15 h-px" />
                  </div>
                </div>
              </div>

              {/* Mobile Database Grid - inside scrollable container */}
              <div className="lg:hidden relative bg-[#0A0A0A] border-t border-white/15 -mx-4 sm:-mx-6 lg:mx-0 mt-4">
                <div className="px-4 sm:px-6 py-3 border-b border-white/15">
                  <p className="text-xs sm:text-sm font-medium leading-tight font-mono uppercase tracking-tight text-white">
                    <span className="text-white/50">{"> "}</span>
                    Database Support
                  </p>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-5 border-b border-white/15 divide-x divide-y divide-white/15">
                  {databases.map((database) => {
                    const Icon = database.icon;
                    return (
                      <div key={database.name} className="p-3 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 grayscale opacity-60 cursor-default">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <span className="font-mono text-[9px] sm:text-[10px] font-medium uppercase tracking-tight text-center text-white">
                          {database.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 mb-4 sm:mt-6 px-4 sm:px-6 pb-4">
                  <p className="text-[10px] sm:text-xs font-semibold leading-snug font-mono uppercase text-white">
                    Start using Better Auth <span className="bg-white text-black px-1 py-0 rounded-none">Studio</span> today. <br className="hidden sm:block" />
                    <div className='h-1'></div>
                    <a
                      href="/installation"
                      className="text-white/70 cursor-pointer hover:text-white underline decoration-white/30 hover:decoration-white/70 transition-all duration-300 font-normal underline-offset-4 text-[10px] sm:text-[11px]"
                    >
                      Get started in minutes <svg
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-3 h-3 sm:w-4 sm:h-4 mb-px inline-flex rotate-42"
                      >
                        <path
                          d="M11 20h2V8h2V6h-2V4h-2v2H9v2h2v12zM7 10V8h2v2H7zm0 0v2H5v-2h2zm10 0V8h-2v2h2zm0 0v2h2v-2h-2z"
                          fill="currentColor"
                        />
                      </svg>
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block mt-4 sm:mt-6">
              <p className="text-[10px] sm:text-xs lg:text-sm font-semibold leading-snug font-mono uppercase text-white">
                Start using Better Auth <span className="bg-white text-black px-1 py-0 rounded-none">Studio</span> today. <br className="hidden sm:block" />
                <div className='h-1'></div>
                <a
                  href="/installation"
                  className="text-white/70 cursor-pointer hover:text-white underline decoration-white/30 hover:decoration-white/70 transition-all duration-300 font-normal underline-offset-4 text-[10px] sm:text-[11px]"
                >
                  Get started in minutes <svg
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 sm:w-4 sm:h-4 mb-px inline-flex rotate-42"
                  >
                    <path
                      d="M11 20h2V8h2V6h-2V4h-2v2H9v2h2v12zM7 10V8h2v2H7zm0 0v2H5v-2h2zm10 0V8h-2v2h2zm0 0v2h2v-2h-2z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              </p>
            </div>
          </div>
        </section>
        <section className="hidden lg:flex flex-col justify-between relative bg-[#0A0A0A] overflow-hidden h-full">
          <div className="grow hidden md:flex items-start justify-center shrink-0 relative z-10" style={{ height: '60%' }}>
            <div className="relative w-full h-full flex">
              <EtheralShadow
                color="rgba(128, 128, 128, 1)"
                animation={{ scale: 100, speed: 90 }}
                noise={{ opacity: 1, scale: 1.2 }}
                sizing="fill"
              />
              <div className="absolute top-6 left-0 right-0 flex items-start justify-center z-20 pointer-events-none">
                <div className="pointer-events-auto w-full">
                  <EventIngestionFlow
                    className="w-full"
                    circleText="Auth"
                    badgeTexts={{
                      first: "user.joined",
                      second: "session.created",
                      third: "organization.created",
                      fourth: "member.added",
                    }}
                    buttonTexts={{
                      first: "Better Auth",
                      second: "Events",
                    }}
                    title="Event Ingestion Flow"
                    lightColor="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 -mt-40 relative z-10">
            <EventMarquee speed={1} pauseOnHover={true} />
            <div className="px-6 lg:px-10 py-3 border-t border-white/15">
              <p className="text-sm lg:text-base font-medium leading-tight max-w-xs font-mono uppercase tracking-tight text-white">
                <span className="text-white/50">{"> "}</span>
                Database Support
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 border-t border-white/15 divide-x divide-y divide-white/15">
              {databases.map((database) => {
                const Icon = database.icon;
                return (
                  <div key={database.name} className="p-3 lg:p-4 flex items-center justify-center gap-2 grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100 cursor-default">
                    <Icon className="w-4 h-4 text-white" />
                    <span className="font-mono text-[10px] lg:text-xs font-medium uppercase tracking-tight text-center text-white">
                      {database.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}  
