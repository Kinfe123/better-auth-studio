import Link from "next/link";

const title = "Better Auth Studio";
const description = "An admin studio for Better Auth — inspect users, manage organizations, and monitor your auth system from a polished UI.";

export default function HomePage() {
  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-gradient-to-b from-fd-background via-fd-background to-fd-muted/25 text-fd-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklch,var(--fd-primary)_12%,transparent),transparent)]"
      />
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-20 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
          Documentation
        </p>
        <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-6 text-pretty text-lg leading-relaxed text-fd-muted-foreground">{description}</p>
        <p className="mt-6 text-pretty text-base leading-relaxed text-fd-muted-foreground">
          Author markdown in{" "}
          <code className="rounded-md border border-fd-border bg-fd-muted/60 px-1.5 py-0.5 font-mono text-[0.9em] text-fd-foreground">
            docs/
          </code>
          . Everything under{" "}
          <span className="font-mono text-[0.95em] text-fd-foreground">/docs</span> is synced from that folder.
        </p>
        <div className="mt-10">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground shadow-sm outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background"
          >
            Open documentation
          </Link>
        </div>
      </div>
    </main>
  );
}
