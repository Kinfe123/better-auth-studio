/**
 * Test script: start auth, trigger social sign-in (Google/GitHub/Discord), then list events from the event DB.
 * Run from examples/hono/prisma: pnpm test:events
 * Or: tsx test-events.ts
 *
 * Usage:
 *   pnpm test:events              # uses Google, opens browser
 *   pnpm test:events -- --no-open # print URL only, don't open browser
 *   PROVIDER=github pnpm test:events
 *   pnpm test:events -- --no-open     # print URL only, no browser
 *   WAIT_SECONDS=20 pnpm test:events  # wait 20s then show events
 *   PORT=3002 pnpm test:events       # use port 3002 (add that callback URL to Google Console)
 *
 * Option B - Use already-running server (e.g. pnpm dev on 3002):
 *   USE_EXISTING_SERVER=1 pnpm test:events
 *   USE_EXISTING_SERVER=1 WAIT_SECONDS=60 pnpm test:events -- --no-open
 * (Start your app first in another terminal, then run this. Uses PORT=3002 by default.)
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const USE_EXISTING_SERVER =
  process.env.USE_EXISTING_SERVER === "1" || process.env.USE_EXISTING_SERVER === "true";
// Option B: default port 3002; else default 3765 so test doesn't conflict with dev server
const PORT = parseInt(
  process.env.TEST_PORT || process.env.PORT || (USE_EXISTING_SERVER ? "3002" : "3765"),
  10,
);
const BASE = `http://localhost:${PORT}`;
const PROVIDER = process.env.PROVIDER || "google";
const OPEN_BROWSER = !process.argv.includes("--no-open");
const WAIT_SECONDS = parseInt(process.env.WAIT_SECONDS || "90", 10) || 90;

const PROVIDER_DOMAINS: Record<string, string> = {
  google: "accounts.google.com",
  github: "github.com",
  discord: "discord.com",
};

/** Wait for server to respond on /health */
async function waitForServer(maxWaitMs = 15000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return true;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/** Get the social sign-in URL (redirects to provider). */
function getSocialSignInUrl(): string {
  return `${BASE}/test/social?provider=${encodeURIComponent(PROVIDER)}`;
}

/** Open URL in the default browser. */
function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(cmd, [url], { stdio: "ignore", shell: true });
}

async function readEventsFromSqlite(dbPath: string): Promise<Array<Record<string, unknown>>> {
  try {
    const Database = require("better-sqlite3");
    const db = new Database(dbPath, { readonly: true });
    const stmt = db.prepare(
      "SELECT id, type, timestamp, status, user_id, display_message, display_severity FROM auth_events ORDER BY timestamp DESC LIMIT 30",
    );
    const rows = stmt.all() as Array<Record<string, unknown>>;
    db.close();
    return rows;
  } catch {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        const proc = spawn(
          "sqlite3",
          [
            dbPath,
            "-header",
            "-csv",
            "SELECT id, type, timestamp, status, user_id, display_message, display_severity FROM auth_events ORDER BY timestamp DESC LIMIT 30",
          ],
          { stdio: ["ignore", "pipe", "pipe"] },
        );
        let out = "";
        proc.stdout?.on("data", (c) => (out += c.toString()));
        proc.stderr?.on("data", () => {});
        proc.on("exit", (code) =>
          code === 0 ? resolve(out) : reject(new Error("sqlite3 exited " + code)),
        );
      });
      const lines = result.trim().split("\n");
      if (lines.length < 2) return [];
      const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
      return lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.replace(/^"|"$/g, "").trim());
        return Object.fromEntries(headers.map((h, i) => [h, values[i]])) as Record<string, unknown>;
      });
    } catch {
      return [];
    }
  }
}

async function main() {
  const serverCwd = process.cwd();
  const dbPath = join(serverCwd, "db.sqlite");

  let server: ReturnType<typeof spawn> | null = null;

  if (!USE_EXISTING_SERVER) {
    console.log("Building root project (better-auth-studio)...");
    const repoRoot = join(serverCwd, "..", "..", "..");
    const build = spawn("pnpm", ["build"], {
      cwd: repoRoot,
      stdio: "pipe",
      shell: true,
    });
    await new Promise<void>((resolve, reject) => {
      build.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`build exited ${code}`)),
      );
    });
    console.log("Build OK.\n");

    console.log("Starting server on port", PORT, "...");
    server = spawn("pnpm", ["exec", "tsx", "src/index.ts"], {
      cwd: serverCwd,
      env: {
        ...process.env,
        PORT: String(PORT),
        BETTER_AUTH_URL: BASE,
      },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    const out = createInterface({ input: server.stdout! });
    const err = createInterface({ input: server.stderr! });
    out.on("line", (line) => console.log("[server]", line));
    err.on("line", (line) => console.error("[server err]", line));
  } else {
    console.log("Option B: using existing server on port", PORT);
    console.log("(Make sure your app is running, e.g. pnpm dev)\n");
  }

  try {
    const up = await waitForServer();
    if (!up) {
      console.error("Server did not become ready in time. Start your app first (e.g. pnpm dev).");
      process.exit(1);
    }
    console.log("Server is up.\n");

    // Verify social sign-in URL redirects to the provider
    const socialUrl = getSocialSignInUrl();
    let redirectOk = false;
    try {
      const res = await fetch(socialUrl, { redirect: "manual" });
      const location = res.headers.get("location") || "";
      const expectedDomain = PROVIDER_DOMAINS[PROVIDER] || "accounts.google.com";
      redirectOk = res.status === 302 && location.includes(expectedDomain);
      if (!redirectOk) {
        console.error(
          "  [CHECK] Social sign-in redirect failed: expected 302 to",
          expectedDomain,
          "got",
          res.status,
          location.slice(0, 80) + "...",
        );
        console.error(
          "  Fix: ensure GOOGLE_CLIENT_ID / GITHUB_CLIENT_ID etc. are set in .env and the app is running.",
        );
      } else {
        console.log("  [CHECK] Social sign-in URL redirects to", PROVIDER, "OK");
      }
    } catch (e) {
      console.error("  [CHECK] Failed to fetch social URL:", e);
    }
    if (!redirectOk) {
      console.error("\nSocial sign-in setup failed. Exiting.");
      process.exit(1);
    }

    console.log("Social sign-in (", PROVIDER, ")");
    console.log("  URL:", socialUrl);
    console.log("  Callback:", `${BASE}/api/auth/callback/${PROVIDER}`);
    console.log("  → Add this callback URL to your", PROVIDER, "OAuth app if you haven't.");
    console.log("");

    if (OPEN_BROWSER) {
      console.log("Opening browser — complete sign-in with", PROVIDER, "then return here.");
      openBrowser(socialUrl);
    } else {
      console.log("Run without --no-open to open the browser, or visit the URL above.");
    }

    console.log(
      "Waiting up to",
      WAIT_SECONDS,
      "s for you to complete sign-in (then we'll show events)...",
    );
    console.log("(Set WAIT_SECONDS=20 to wait less, or Ctrl+C once done.)\n");
    await new Promise((r) => setTimeout(r, WAIT_SECONDS * 1000));

    if (existsSync(dbPath)) {
      const events = await readEventsFromSqlite(dbPath);
      const oauthOrJoined = events.filter(
        (e) =>
          String(e.type).startsWith("oauth.") ||
          String(e.type) === "user.joined" ||
          String(e.type) === "session.created",
      );
      console.log("--- Recent OAuth / user.joined / session events (auth_events) ---");
      if (oauthOrJoined.length === 0) {
        console.log(
          "(None found. Complete sign-in in the browser and run again, or check events config.)",
        );
      } else {
        console.table(oauthOrJoined.slice(0, 15));
        console.log("Shown:", Math.min(oauthOrJoined.length, 15), "of", oauthOrJoined.length);
      }
      console.log("\n--- All events (latest 20) ---");
      if (events.length === 0) {
        console.log("(No rows in auth_events.)");
      } else {
        console.table(events.slice(0, 20));
        console.log("Total in table (latest 30):", events.length);
      }
    } else {
      console.log("No db.sqlite at", dbPath, "- events may use a different path.");
    }
  } finally {
    if (server) {
      server.kill("SIGTERM");
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
