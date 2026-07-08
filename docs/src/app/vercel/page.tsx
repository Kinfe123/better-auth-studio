import Navigation from "@/components/Navigation";
import { BetterAuthParticleLogo } from "@/components/ui/better-auth-particle-logo";

const stats = [
  { value: "29k", label: "GitHub stars", mobileLabel: "stars", icon: "github" },
  { value: "4.5m", label: "downloads / week", mobileLabel: "npm", icon: "npm" },
  { value: "12k+", label: "community", mobileLabel: "community", icon: "community" },
] as const;

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1em] w-[1em] flex-none"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.48 2 2 6.58 2 12.22c0 4.51 2.86 8.33 6.83 9.69.5.09.68-.22.68-.49v-1.82c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.28 9.28 0 0 1 12 7c.85 0 1.7.12 2.5.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.78-4.56 5.04.36.32.68.94.68 1.89v2.74c0 .27.18.59.69.49A10.07 10.07 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function NpmIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1em] w-[1.3em] flex-none"
      fill="none"
      viewBox="0 0 28 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 4.5h23v11h-6v-8h-3v8h-14v-11Zm3 3v5h3v-5h-3Zm6 0v5h2v-5h-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1em] w-[1em] flex-none"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12.5c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-3.31 0-6 1.57-6 3.5V20h12v-2c0-1.93-2.69-3.5-6-3.5Zm6.5-1.5c1.66 0 3-1.34 3-3s-1.34-3-3-3c-.52 0-1 .13-1.43.36.6.85.93 1.88.93 2.97 0 .94-.25 1.81-.68 2.57.36.07.75.1 1.18.1Zm0 1.5c-.58 0-1.13.06-1.65.17 1.85.82 3.15 2.05 3.15 3.33V20h4v-2c0-1.93-2.46-3.5-5.5-3.5ZM5.5 13c.43 0 .82-.03 1.18-.1A5.1 5.1 0 0 1 6 10.33c0-1.09.33-2.12.93-2.97A2.98 2.98 0 0 0 5.5 7c-1.66 0-3 1.34-3 3s1.34 3 3 3ZM4 18c0-1.28 1.3-2.51 3.15-3.33A7.96 7.96 0 0 0 5.5 14.5C2.46 14.5 0 16.07 0 18v2h4v-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StatIcon({ icon }: { icon: (typeof stats)[number]["icon"] }) {
  if (icon === "github") return <GitHubIcon />;
  if (icon === "npm") return <NpmIcon />;
  return <CommunityIcon />;
}

function VercelIcon() {
  return (
    <svg
      aria-hidden="true"
      className="relative top-[0.02em] h-[0.72em] w-[0.72em] flex-none"
      fill="none"
      viewBox="0 0 1155 1000"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m577.3 0 577.4 1000H0z" fill="currentColor" />
    </svg>
  );
}

function BetterAuthIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[0.72em] w-[0.96em] flex-none"
      fill="none"
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M200 0h200v300H200V200h100V100H200zM0 0h100v100h100v100H100v100H0z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1em] w-[1em] flex-none"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 17 17 7M9 7h8v8"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function VercelPage() {
  return (
    <main
      className="relative h-svh w-screen overflow-hidden bg-black text-white selection:bg-white selection:text-black"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      <Navigation />

      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-200/[7%] to-black">
        <div className="absolute inset-0 opacity-5">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
        </div>
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 36%, rgba(255,255,255,0.16) 0%, rgba(185,185,185,0.07) 30%, transparent 66%)",
        }}
      />
      <div className="hidden md:absolute left-1/2 top-[55%] h-px w-[min(72rem,86vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <section className="relative z-10 flex h-full items-center justify-center px-4 pb-5 pt-36 text-center sm:px-5 sm:pt-28 md:pt-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="mb-5 h-28 w-44 drop-shadow-[0_0_34px_rgba(255,255,255,0.24)] min-[390px]:h-32 min-[390px]:w-48 sm:mb-7 sm:h-40 sm:w-60 md:h-48 md:w-72 lg:h-[14.55rem] lg:w-96">
            <BetterAuthParticleLogo />
          </div>
          <div className="group/announcement">
            <h1 className="mx-auto mt-0 max-w-[21rem] text-[1.7rem] font-light uppercase leading-[1.08] text-white min-[390px]:text-xl sm:max-w-5xl sm:text-3xl md:text-[2.8rem] md:leading-[1.04]">
              <span className="inline-flex items-center gap-[0.24em]">
                <BetterAuthIcon />
                <span>Better-Auth</span>
              </span>{" "}
              <span>Joins</span>{" "}
              <span className="inline-flex items-baseline gap-[0.24em] whitespace-nowrap">
                <VercelIcon />
                <span>Vercel</span>
              </span>
            </h1>
            <div className="mx-auto mt-5 flex max-w-[21rem] items-center justify-center gap-x-2 text-[0.62rem] font-light leading-none text-white/55 min-[390px]:gap-x-2.5 min-[390px]:text-[0.68rem] sm:hidden">
              {stats.map((stat, index) => (
                <div className="flex items-center gap-x-2" key={stat.label}>
                  {index > 0 ? (
                    <span className="h-5 w-px bg-white/25" aria-hidden="true" />
                  ) : null}
                  <p className="inline-flex items-center gap-x-1.5 whitespace-nowrap">
                    <span className="font-medium text-white/90">{stat.value}</span>{" "}
                    <span className="text-white/62">
                      <StatIcon icon={stat.icon} />
                    </span>
                    <span>{stat.mobileLabel}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-7 hidden max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm font-light text-white/55 sm:flex md:text-base">
              {stats.map((stat, index) => (
                <div className="flex items-center gap-x-4" key={stat.label}>
                  {index > 0 ? (
                    <span className="h-6 w-px bg-white/25" aria-hidden="true" />
                  ) : null}
                  <p className="inline-flex items-center gap-x-2 whitespace-nowrap">
                    <span className="font-medium text-white/90">{stat.value}</span>{" "}
                    <span className="text-white/62">
                      <StatIcon icon={stat.icon} />
                    </span>
                    <span>{stat.label}</span>
                  </p>
                </div>
              ))}
            </div>
            <a
              className="mx-auto mt-3 inline-flex translate-y-0 items-center gap-x-2 text-xs font-light text-white/70 opacity-100 transition-all duration-300 hover:text-white focus:translate-y-0 focus:text-white focus:opacity-100 md:mt-4 md:translate-y-1 md:text-white/0 md:opacity-0 md:group-hover/announcement:translate-y-0 md:group-hover/announcement:text-white/65 md:group-hover/announcement:opacity-100"
              href="https://vercel.com/blog/vercel-acquires-better-auth"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>Read more</span>
              <ArrowUpRightIcon />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
