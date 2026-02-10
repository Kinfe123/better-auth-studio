"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import PixelCard from "@/components/PixelCard";
import CodeBlock from "@/components/CodeBlock";
import { InstallIcon } from "@/components/icons";

const GlobeDemo = dynamic(
  () => import("@/components/ui/globe-demo").then((m) => m.GlobeDemo),
  { ssr: false }
);

export default function Version112Page() {
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
    <div className="bg-[#0a0a0a] text-white h-screen overflow-hidden overflow-x-hidden font-sans selection:bg-white selection:text-black relative">
      <header className="hidden md:absolute top-0 lg:-top-4 right-0 p-4 lg:p-8 z-50">
        <span className="font-mono text-[10px] lg:text-[11px] tracking-widest uppercase text-white/50">
          Better Auth Studio v1.1.2
        </span>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-hidden overflow-x-hidden">
        <section className="overflow-x-hidden flex flex-col justify-start md:justify-between p-4 sm:p-6 lg:p-10 border-r-0 lg:border-r border-white/20 overflow-y-auto relative bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0 pointer-events-none opacity-70 md:opacity-100 mix-blend-overlay"
            style={{
              backgroundImage: "url(/shades.png)",
              backgroundRepeat: "repeat",
              backgroundSize: "auto",
            }}
          />
          <div className="relative z-10 flex flex-col justify-start md:justify-between h-full scrollbar-hide">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-light tracking-tighter uppercase font-mono mb-2 sm:mb-3">
                  Release <br />{" "}
                  <span className="bg-white text-black px-1 py-0 rounded-none">Version 1.1.2</span>
                </h1>
                <div className="-mx-4 sm:-mx-6 lg:-mx-10 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+5rem)] mb-3 sm:mb-4 lg:mb-4">
                  <hr className="w-full border-white/10 h-px" />
                  <div className="relative z-20 h-2 w-full bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-7" />
                  <hr className="w-full border-white/10 h-px" />
                </div>
                <p className="text-[11px] sm:text-sm lg:text-xs font-light text-white/90 leading-relaxed font-mono uppercase mb-3 sm:mb-4">
                  <span>{"// "}</span> IP-based location for sessions & events, dedicated event log on
                  user details, GitHub-style activity feed, last active / last seen, and more
                  improvements and fixes.
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
                      Sessions and events now resolve user activity location from IP address, so you
                      can see where sign-ins and events occur on the globe and in lists.
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
                      GitHub-style activity feed for events—scrollable, filterable, and easy to scan
                      with clear event types and metadata.
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
                      User and session views now show &quot;last seen&quot; and last active time for
                      clearer audit trails and support workflows.
                    </p>
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

              <div className="lg:hidden relative bg-[#0A0A0A] border-t border-white/15 -mx-4 sm:-mx-6 lg:mx-0 mt-4">
                <div className="px-4 sm:px-6 py-3 border-b border-white/15">
                  <p className="text-xs sm:text-sm font-medium leading-tight font-mono uppercase tracking-tight text-white">
                    <span className="text-white/50">{"> "}</span>
                    User activity worldwide
                  </p>
                </div>
                <div className="mt-4 mb-4 sm:mt-6 px-4 sm:px-6 pb-4">
                  <p className="text-[10px] sm:text-xs font-semibold leading-snug font-mono uppercase text-white">
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
            </div>

            <div className="hidden lg:block mt-4 sm:mt-6">
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

        <section className="hidden lg:flex flex-col justify-between relative overflow-hidden h-full min-h-0">
          <div className="flex-[1_1_60%] min-h-[380px] flex items-stretch justify-center relative z-10 overflow-hidden">
            <div className="relative w-full h-full min-h-[380px]" style={{ minHeight: "55vh" }}>
              <GlobeDemo />
            </div>
          </div>

          <div className="shrink-0 relative z-10">
            <div className="px-6 lg:px-10 py-3 border-t border-white/15">
              <p className="text-sm lg:text-base font-medium leading-tight max-w-xs font-mono uppercase tracking-tight text-white">
                <span className="text-white/50">{"> "}</span>
                User activity worldwide
              </p>
            </div>
            <div className="grid grid-cols-3 border-t border-white/15 divide-x divide-white/15">
              <div className="p-3 lg:p-4 flex flex-col items-center justify-center gap-1.5 text-center">
                <span className="font-mono text-[10px] lg:text-xs font-medium uppercase tracking-tight text-white/80">
                  IP → Location
                </span>
              </div>
              <div className="p-3 lg:p-4 flex flex-col items-center justify-center gap-1.5 text-center">
                <span className="font-mono text-[10px] lg:text-xs font-medium uppercase tracking-tight text-white/80">
                  Event log
                </span>
              </div>
              <div className="p-3 lg:p-4 flex flex-col items-center justify-center gap-1.5 text-center">
                <span className="font-mono text-[10px] lg:text-xs font-medium uppercase tracking-tight text-white/80">
                  Last seen
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
