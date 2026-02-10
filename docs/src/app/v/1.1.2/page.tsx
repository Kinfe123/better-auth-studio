"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import PixelCard from "@/components/PixelCard";
import CodeBlock from "@/components/CodeBlock";
import CodeHighlighter from "@/components/SyntaxHighlighter";
import { InstallIcon, ConfigIcon } from "@/components/icons";

const GlobeDemo = dynamic(() => import("@/components/ui/globe-demo").then((m) => m.GlobeDemo), {
  ssr: false,
});

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Stable hash so the same index always gets the same "random" value (no flicker on re-render). */
function hashTo01(index: number): number {
  const x = Math.sin(index * 12.9898 + 43758.5453) * 10000;
  return x - Math.floor(x);
}

function buildActivityGridFakeData() {
  const WEEKS = 53;
  const DAYS = 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  const weekStartsByCol: Date[] = [];
  for (let col = 0; col < WEEKS; col++) {
    const w = new Date(weekStart);
    w.setDate(weekStart.getDate() - (WEEKS - 1 - col) * 7);
    weekStartsByCol.push(w);
  }
  let lastMonth = -1;
  const monthLabelsByCol: string[] = [];
  for (let col = 0; col < WEEKS; col++) {
    const m = weekStartsByCol[col].getMonth();
    monthLabelsByCol.push(m !== lastMonth ? MONTH_NAMES[m] : "");
    lastMonth = m;
  }
  const cells: { intensity: number }[] = [];
  for (let row = 0; row < DAYS; row++) {
    for (let col = 0; col < WEEKS; col++) {
      const d = new Date(weekStartsByCol[col]);
      d.setDate(d.getDate() + row);
      const isFuture = d > today;
      const index = row * WEEKS + col;
      const r = hashTo01(index);
      const intensity = isFuture
        ? 0
        : r < 0.35
          ? 0
          : r < 0.58
            ? 1
            : r < 0.78
              ? 2
              : r < 0.92
                ? 3
                : 4;
      cells.push({ intensity });
    }
  }
  const leftYear = weekStartsByCol[0].getFullYear();
  const rightYear = today.getFullYear();
  return { cells, monthLabelsByCol, leftYear, rightYear, WEEKS, DAYS };
}

const INTENSITY_CLASSES = [
  "bg-white/5",
  "bg-white/15",
  "bg-white/25",
  "bg-white/35",
  "bg-white/50",
] as const;

const ipAddressCodeExamples = {
  ipinfo: `ipAddress: {
  provider: "ipinfo",
  apiToken: process.env.IPINFO_TOKEN,
  baseUrl: "https://api.ipinfo.io",
  endpoint: "lookup", // "lite" for free plan
},`,
  ipapi: `ipAddress: {
  provider: "ipapi",
  baseUrl: "https://ipapi.co",
  apiToken: process.env.IPAPI_TOKEN, // optional
},`,
  static: `ipAddress: {
  provider: "static",
  path: "./data/GeoLite2-City.mmdb",
},`,
} as const;

const ipTabs = [
  { id: "ipinfo", name: "ipinfo" },
  { id: "ipapi", name: "ipapi" },
  { id: "static", name: "static" },
] as const;

export default function Version112Page() {
  const [activeIpTab, setActiveIpTab] = useState<keyof typeof ipAddressCodeExamples>("ipinfo");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("dark");
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="bg-transparent text-white h-screen min-h-dvh overflow-hidden overflow-x-hidden font-sans selection:bg-white selection:text-black relative">
      <main className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden overflow-x-hidden">
        <section className="overflow-x-hidden flex flex-col p-4 sm:p-6 lg:p-10 pt-[max(3rem,env(safe-area-inset-top,0)+2rem)] sm:pt-14 lg:pt-10 border-r-0 lg:border-r border-white/20 h-full relative bg-black/50 backdrop-blur-sm min-h-0">
          <div
            className="absolute inset-0 pointer-events-none opacity-70 md:opacity-100 mix-blend-overlay"
            style={{
              backgroundImage: "url(/shades.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "auto",
            }}
          />
          <div className="relative z-10 flex flex-col h-full min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h1 className="text-base sm:text-lg lg:text-xl font-light tracking-tighter uppercase font-mono mb-2 sm:mb-3">
                    Release <br />{" "}
                    <span className="bg-white text-black px-1 py-0 rounded-none">
                      Version 1.1.2
                    </span>
                  </h1>
                  <div className="-mx-4 sm:-mx-6 lg:-mx-10 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] mb-3 sm:mb-4 lg:mb-4">
                    <hr className="w-full border-white/10 h-px" />
                    <div className="relative z-20 h-2 w-full bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                    <hr className="w-full border-white/10 h-px" />
                  </div>
                  <p className="text-[11px] sm:text-sm lg:text-xs font-light text-white/90 leading-relaxed font-mono uppercase mb-3 sm:mb-4">
                    <span>{"// "}</span> IP-based location for sessions & events, dedicated event
                    log on user details, GitHub-style activity feed, last active / last seen, and
                    more improvements and fixes.
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
                      <CodeBlock
                        code="pnpm add better-auth-studio@latest"
                        className="border-white/15"
                      />
                    </div>
                  </div>
                </div>
                <div className="-mx-4 sm:-mx-6 lg:-mx-10 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] mb-3 sm:mb-4 lg:mb-4">
                  <hr className="w-full border-white/10 h-px" />
                  <div className="relative z-20 h-2 w-full bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                  <hr className="w-full border-white/10 h-px" />
                </div>

                <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <h2 className="text-xs sm:text-sm font-medium font-mono uppercase tracking-wider text-white">
                    What&apos;s New
                  </h2>
                  <div className="w-full mb-3 sm:mb-4 lg:hidden">
                    <hr className="w-full border-white/15 h-px" />
                  </div>
                  <div className="hidden lg:block -mx-10 w-[calc(100%+5rem)] mb-4">
                    <hr className="w-full border-white/15 h-px" />
                  </div>
                  <div className="space-y-2 sm:space-y-2.5 font-sans">
                    <div>
                      <p className="text-[11px] sm:text-xs lg:text-sm leading-relaxed text-white/80 font-light mb-2">
                        <strong className="font-light font-mono uppercase text-white">
                          IP-based location:
                        </strong>{" "}
                        Sessions and events now resolve user activity location from IP address, so
                        you can see where sign-ins and events occur on the globe and in lists.
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-mono uppercase text-white/60 mb-1.5 mt-2">
                        Enable in studio config:
                      </p>
                      <div className="space-y-2">
                        <div className="relative min-h-0">
                          <div className="absolute top-6 pb-8 left-4 hidden md:flex gap-2 flex-wrap z-10">
                            {ipTabs.map((tab) => {
                              const isActive = activeIpTab === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveIpTab(tab.id)}
                                  className={`
                                  relative font-mono text-[10px] sm:text-[11px] font-light z-10 uppercase tracking-tight
                                  text-white/90 border bg-[#0a0a0a]
                                  px-1.5 sm:px-2 py-0.5 sm:py-1 overflow-hidden transition-all duration-200
                                  inline-flex items-center gap-[5px] no-underline
                                  ${
                                    isActive
                                      ? "border-white/40 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                                      : "border-white/20 hover:border-white/30 hover:bg-white/5"
                                  }
                                `}
                                >
                                  {isActive && <div className="absolute -z-1 inset-0 bg-black" />}
                                  {isActive && (
                                    <div className="absolute z-10 inset-0 bg-white/10" />
                                  )}
                                  {isActive ? (
                                    <>
                                      <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[8%]" />
                                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_8px)] opacity-[4%]" />
                                    </>
                                  ) : (
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[2.5%]" />
                                  )}
                                  <span className="relative z-10 inline-flex gap-[5px] items-center">
                                    <ConfigIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    {tab.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="md:hidden pt-3 sm:pt-4">
                            <div className="relative mb-2">
                              <select
                                value={activeIpTab}
                                onChange={(e) =>
                                  setActiveIpTab(
                                    e.target.value as keyof typeof ipAddressCodeExamples,
                                  )
                                }
                                className="relative z-10 text-[11px] sm:text-[12px] font-light uppercase tracking-tight
                                text-white/90 border border-white/40 bg-white/5
                                px-3 py-3 sm:py-[6px] pr-10 sm:pr-8 overflow-hidden transition-all duration-200
                                appearance-none cursor-pointer w-full min-h-[44px] sm:min-h-0
                                focus:border-white/40 focus:bg-white/10 focus:outline-none
                                shadow-[0_0_0_1px_rgba(255,255,255,0.15)] font-mono"
                                style={{
                                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                  backgroundRepeat: "no-repeat",
                                  backgroundPosition: "right 8px center",
                                  backgroundSize: "12px",
                                }}
                              >
                                {ipTabs.map((tab) => (
                                  <option key={tab.id} value={tab.id}>
                                    {tab.name}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute -z-1 inset-0 bg-black pointer-events-none" />
                              <div className="absolute z-0 inset-0 bg-white/5 pointer-events-none" />
                              <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[4%] pointer-events-none" />
                            </div>
                            <PixelCard
                              variant="highlight"
                              className="border-white/15 p-0 overflow-hidden"
                            >
                              <div className="relative px-3 pb-2 max-h-[220px] min-w-0 overflow-y-auto overflow-x-auto thin-scrollbar">
                                <CodeHighlighter
                                  code={ipAddressCodeExamples[activeIpTab]}
                                  language="typescript"
                                  className="text-[11px] sm:text-xs"
                                />
                              </div>
                            </PixelCard>
                          </div>
                        </div>
                        <div className="pt-10 sm:pt-10 hidden md:block">
                          <PixelCard
                            variant="highlight"
                            className="border-white/15 overflow-hidden"
                          >
                            <div className="relative px-3 pt-2 max-h-[200px] min-w-0 overflow-y-auto overflow-x-auto thin-scrollbar">
                              <CodeHighlighter
                                code={ipAddressCodeExamples[activeIpTab]}
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
                    <div className="hidden lg:block -mx-10 w-[calc(100%+5rem)] mb-4">
                      <hr className="w-full border-white/15 h-px" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs lg:text-sm leading-relaxed text-white/80 font-light mb-2">
                        <strong className="font-light font-mono uppercase text-white">
                          Events on user details:
                        </strong>{" "}
                        A dedicated events section on the user details tab shows all events for that
                        user in one place, with filters and timestamps.
                      </p>
                    </div>
                    <div className="w-full mb-3 sm:mb-4 lg:hidden">
                      <hr className="w-full border-white/15 h-px" />
                    </div>
                    <div className="hidden lg:block -mx-10 w-[calc(100%+5rem)] mb-4">
                      <hr className="w-full border-white/15 h-px" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs lg:text-sm leading-relaxed text-white/80 font-light mb-2">
                        <strong className="font-light font-mono uppercase text-white">
                          Interactive event log:
                        </strong>{" "}
                        GitHub-style activity feed for events—scrollable, filterable, and easy to
                        scan with clear event types and metadata.
                      </p>
                    </div>
                    <div className="w-full mb-3 sm:mb-4 lg:hidden">
                      <hr className="w-full border-white/15 h-px" />
                    </div>
                    <div className="hidden lg:block -mx-10 w-[calc(100%+5rem)] mb-4">
                      <hr className="w-full border-white/15 h-px" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs lg:text-sm leading-relaxed text-white/80 font-light mb-2">
                        <strong className="font-light font-mono uppercase text-white">
                          Last active / last seen:
                        </strong>{" "}
                        User and session views now show &quot;last seen&quot; and last active time
                        for clearer audit trails and support workflows.
                      </p>
                      <p className="text-[10px] sm:text-[11px] font-mono uppercase text-white/60 mb-1.5 mt-2">
                        Enable in studio config:
                      </p>
                      <div className="pt-2">
                        <PixelCard
                          variant="highlight"
                          className="border-white/15 overflow-hidden min-w-0"
                        >
                          <div className="relative max-h-[180px] min-w-0 overflow-y-auto overflow-x-auto thin-scrollbar">
                            <CodeHighlighter
                              code={`lastSeenAt: {
  enabled: true,
  columnName: "lastSeenAt", // or "last_seen_at"
},`}
                              language="typescript"
                              className="text-[11px] sm:text-xs"
                            />
                          </div>
                        </PixelCard>
                      </div>
                    </div>
                    <div className="w-full mb-3 sm:mb-4 lg:hidden">
                      <hr className="w-full border-white/15 h-px" />
                    </div>
                    <div className="hidden lg:block -mx-10 w-[calc(100%+5rem)] mb-4">
                      <hr className="w-full border-white/15 h-px" />
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs lg:text-sm leading-relaxed text-white/80 font-light">
                        Plus additional improvements and fixes across events, sessions, and the
                        studio UI.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:hidden relative bg-[#0A0A0A] border-t border-white/15 -mx-4 sm:-mx-6 lg:mx-0 mt-4 pb-[env(safe-area-inset-bottom,0)]">
                  <div className="px-4 sm:px-6 py-3 border-b border-white/15">
                    <p className="text-xs sm:text-sm font-medium leading-tight font-mono uppercase tracking-tight text-white">
                      <span className="text-white/50">{"> "}</span>
                      User activity worldwide
                    </p>
                  </div>
                  <div className="mt-4 mb-4 sm:mt-6 px-4 sm:px-6 pb-4">
                    <p className="text-[10px] sm:text-xs font-semibold leading-snug font-mono uppercase text-white">
                      Start using Better Auth{" "}
                      <span className="bg-white text-black px-1 py-0 rounded-none">
                        Studio
                      </span>{" "}
                      today. <br className="hidden sm:block" />
                      <div className="h-2"></div>
                      <a
                        href="/installation"
                        className="inline-block py-2 -my-2 text-white/70 cursor-pointer hover:text-white underline decoration-white/30 hover:decoration-white/70 transition-all duration-300 font-normal underline-offset-4 text-[10px] sm:text-[11px] touch-manipulation"
                      >
                        Get started in minutes{" "}
                        <svg
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
            </div>

            <div className="shrink-0 hidden lg:block pt-4 border-t border-white/10 mt-4">
              <p className="text-[10px] sm:text-xs lg:text-sm font-semibold leading-snug font-mono uppercase text-white">
                Start using Better Auth{" "}
                <span className="bg-white text-black px-1 py-0 rounded-none">Studio</span> today.{" "}
                <br className="hidden sm:block" />
                <div className="h-1"></div>
                <a
                  href="/installation"
                  className="text-white/70 cursor-pointer hover:text-white underline decoration-white/30 hover:decoration-white/70 transition-all duration-300 font-normal underline-offset-4 text-[10px] sm:text-[11px]"
                >
                  Get started in minutes{" "}
                  <svg
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

        <section className="hidden lg:flex flex-col justify-between relative overflow-hidden h-full min-h-0 bg-[#0A0A0A]">
          <div className="flex-[1_1_70%] min-h-[420px] flex items-stretch justify-center relative z-10 overflow-hidden w-full">
            <div className="relative w-full h-full min-h-[400px]" style={{ minHeight: "60vh" }}>
              <GlobeDemo />
            </div>
          </div>

          <div className="shrink-0 relative z-10 w-full pb-2 overflow-hidden">
            {(() => {
              const { cells, monthLabelsByCol, leftYear, rightYear, WEEKS, DAYS } =
                buildActivityGridFakeData();
              const cellGap = 3;
              const monthRowHeight = 18;
              const dayColWidth = 16;
              return (
                <div className="relative z-10 w-full border border-white/10 bg-black/40 opacity-75 backdrop-blur-sm">
                  <div className="px-4 lg:px-6 py-1.5 border-b border-white/10">
                    <p className="text-[9px] font-mono uppercase tracking-wider text-white/50">
                      Event activity
                    </p>
                  </div>
                  <div className="p-2 lg:p-3 w-full min-w-0">
                    <div
                      className="grid w-full min-w-0"
                      style={{
                        gridTemplateColumns: `${dayColWidth}px repeat(${WEEKS}, minmax(0, 1fr))`,
                        gridTemplateRows: `${monthRowHeight}px repeat(${DAYS}, auto)`,
                        gap: `${cellGap}px ${cellGap}px`,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ gridColumn: 1, gridRow: 1 }} aria-hidden />
                      {monthLabelsByCol.map((label, col) =>
                        label ? (
                          <span
                            key={col}
                            className="text-[9px] text-white/40 font-mono text-left whitespace-nowrap"
                            style={{
                              gridColumn: `${col + 2} / span 4`,
                              gridRow: 1,
                            }}
                          >
                            {label}
                          </span>
                        ) : (
                          <div key={col} style={{ gridColumn: col + 2, gridRow: 1 }} aria-hidden />
                        ),
                      )}
                      {DAY_NAMES.map((name, row) => (
                        <span
                          key={name}
                          className="text-[8px] text-white/40 font-mono flex items-center truncate overflow-hidden"
                          style={{
                            gridColumn: 1,
                            gridRow: row + 2,
                            alignSelf: "stretch",
                            maxWidth: dayColWidth,
                          }}
                        >
                          {name}
                        </span>
                      ))}
                      {cells.map((cell, index) => {
                        const row = Math.floor(index / WEEKS);
                        const col = index % WEEKS;
                        return (
                          <div
                            key={index}
                            className={`rounded-[1px] border border-white/10 min-w-0 w-full ${INTENSITY_CLASSES[cell.intensity]}`}
                            style={{
                              aspectRatio: "1",
                              gridColumn: col + 2,
                              gridRow: row + 2,
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] text-white/40 font-mono mt-1 px-0.5">
                      <span>{leftYear}</span>
                      <span>{leftYear !== rightYear ? rightYear : "Today"}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      <span className="text-[8px] text-white/40 font-mono">Less</span>
                      <div className="flex items-center gap-0.5">
                        {INTENSITY_CLASSES.map((bg) => (
                          <div
                            key={bg}
                            className={`rounded-[1px] border border-white/10 ${bg}`}
                            style={{ width: 10, height: 10 }}
                            aria-hidden
                          />
                        ))}
                      </div>
                      <span className="text-[8px] text-white/40 font-mono">More</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="shrink-0 relative z-10">
            <div className="px-6 lg:px-10 py-3 border-t border-white/15">
              <p className="text-sm lg:text-base font-medium leading-tight max-w-xs font-mono uppercase tracking-tight text-white">
                <span className="text-white/50">{"> "}</span>
                User activity worldwide
              </p>
            </div>
            <div className="grid grid-cols-3 border-t border-white/15 divide-x divide-white/15"></div>
          </div>
        </section>
      </main>
    </div>
  );
}
